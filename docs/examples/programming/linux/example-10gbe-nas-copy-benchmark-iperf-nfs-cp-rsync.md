---
title: 'Benchmarking 10GbE NAS-to-NAS Copies: iperf, NFS, dd, cp and rsync Numbers
  on Synology Atoms'
diataxis: Example
domain: programming
topic: linux
source: DEV.to Tech News
source_url: https://dev.to/nha6ki/benchmarking-10gbe-nas-to-nas-transfers-iperf-nfs-cp-and-rsync-4p1j
date: 2026-11-11
keywords:
- knowledge-base
- linux
- programming
- examples
---
# Benchmarking 10GbE NAS-to-NAS Copies: iperf, NFS, dd, cp and rsync Numbers on Synology Atoms

Worked example of a storage-performance investigation: before migrating data between two Synology NAS boxes over an existing 10GbE link, each tool already installed was measured — and **the network baseline lied about achievable copy speed**.

## Setup (Nov 2026, anonymized)

| Component | Source NAS | Destination NAS |
|---|---|---|
| CPU | Intel Atom C3538, 4c @ 2.10 GHz | Intel Atom C3538, 4c @ 2.10 GHz |
| Kernel | Synology 4.4.302+ | Synology 4.4.302+ |
| RAM | ~20 GiB | ~4 GiB |
| Storage | Btrfs, 6-disk RAID5 | Btrfs, 6-disk RAID5 |
| Role | NFSv3 server | RO NFS client + local writes |

Destination mounts source over **NFSv3/TCP, effective `rsize` 128 KiB**. Test artifact: one existing **16,285,199,445-byte (15.17 GiB)** file; copies verified against source bytes with SHA-256. Cache state was *not* controlled — stated explicitly as a limitation.

## The measurements

**Network baseline (iperf2)** — near line rate, but tells you nothing about copy speed:

```bash
# destination:  iperf -s -B <DEST_IP> -p 5201 -i 1
# source:       iperf -c <DEST_IP> -B <SOURCE_IP> -p 5201 -t 10 -P 4
```

| TCP streams | Throughput |
|---|---|
| 1 | 9.10 Gbps |
| 4 | **9.42 Gbps** |

**Tool comparison on the same file:**

| Command | Data | Time | Throughput |
|---|---|---|---|
| `dd if=$SRC of=/dev/null bs=4M count=2048` | 8 GiB read | 13.43 s | 640 MB/s (inflation likely from cache — source RAID showed almost no physical reads) |
| `dd bs=1M conv=fsync` | 8 GiB copy | 19.92 s | 431 MB/s |
| `dd bs=4M conv=fsync` | 8 GiB copy | 21.98 s | 391 MB/s |
| `dd bs=16M conv=fsync` | 8 GiB copy | 22.47 s | 382 MB/s |
| `cp` | 15.17 GiB | 33 s | **494 MB/s** (second run 479 MB/s) |
| `rsync -W --stats` | 15.17 GiB | 90 s | **181 MB/s** |

**Parallelism:** splitting one 8 GiB range across concurrent `dd` processes to independent outputs: 1 → 397 MB/s, 2 → **475 MB/s (+20%)**, 4 → 468 MB/s (no further gain). Separately, 2 concurrent `rsync` jobs each copying the *whole file* to its own destination: 181 → **281 MB/s aggregate (+55%)** — concurrency helps *independent files*, never one file.

**Why rsync loses (CPU profile, destination, `iostat -cdx 1` + CPU):**

| Destination metric | `cp` | 1× `rsync` | 2× `rsync` |
|---|---|---|---|
| CPU user | 0.5% | 27% (~1 full core) | 43% |
| CPU system | 67% | 26% | 38% |
| `md2` writes | 488 MB/s | 182 MB/s | 284 MB/s |

`cp` is syscall-pipe work the kernel does for you; rsync adds transfer checksums and sender/receiver processing on a weak Atom core. Note rsync 3.1.2's `-W` only disables delta-transfer — whole-file mode is already the default when both endpoints look local (including an NFS mount).

## Methodology lessons

1. **iperf ≈ line rate ≠ copy speed.** Measure the whole path (NFS processing + destination filesystem writes), never just the network.
2. **Reads-to-`/dev/null` overestimate** when cache is warm — cross-check with physical RAID read counters.
3. **Different durability classes are not comparable**: the `dd` runs ended with explicit `fsync`; `cp`/`rsync` copied whole files without an equivalent final sync. Numbers are command-completion rates, not durability-controlled benchmarks.
4. **Define parallelism precisely**: same-range split vs per-process full copy produced opposite-looking conclusions.
5. On CPU-poor NAS boxes, the bottleneck for `cp` is kernel/system time and RAID write throughput; for `rsync` it's user-space CPU.

## Cross-links

- `security-privacy/blue-team-handbook-ir/howto-enumerate-linux-nfs-samba-shares.md` — NFS surface enumeration
- `programming/linux/explanation-file-descriptors-stdio-processes.md` — why `of=/dev/null` measures the read path alone

## References

- DEV.to: *Benchmarking 10GbE NAS-to-NAS Transfers: iperf, NFS, cp, and rsync* — [dev.to/nha6ki/benchmarking-10gbe-nas-to-nas-transfers-iperf-nfs-cp-and-rsync-4p1j](https://dev.to/nha6ki/benchmarking-10gbe-nas-to-nas-transfers-iperf-nfs-cp-and-rsync-4p1j)
- rsync man page (whole-file / `--whole-file` semantics): [man7.org/linux/man-pages/man1/rsync.1.html](https://man7.org/linux/man-pages/man1/rsync.1.html)
- iperf2: [iperf.fr](https://iperf.fr)
