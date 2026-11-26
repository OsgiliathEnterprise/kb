---
title: 'Minipg: PostgreSQL as a Single Executable on a Plan 9 Hypervisor Kernel'
diataxis: Explanation
domain: programming
topic: databases
source: HackerNews
source_url: https://progrium.github.io/minipg/
date: '2026-11-26'
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# Minipg: PostgreSQL as a Single Executable on a Plan 9 Hypervisor Kernel

[minipg](https://github.com/progrium/minipg) is PostgreSQL as one executable — ready to use,
with no server to configure. A **`.pgdb` directory *is* the database**: its data, config,
credentials, and Postgres version all live inside it, and `minipg app.pgdb` opens a `psql`
shell on it. A server starts when a command needs one and stops on its own when idle.

## How it works (the interesting part)

minipg embeds Docker Hub's `postgres:18-alpine` image and runs it with
[h9 (hyper9)](https://github.com/progrium/hyper9), used as a **Zig library**. h9's "Linux
personality" runs Alpine's own Postgres binaries **directly on the host's hypervisor**, with
h9's **Plan 9 kernel answering their system calls**. There is no Linux kernel to boot, no VM
image, and no Docker — an architecture halfway between containers and unikernels (compare
`hyperlight-unikraft` micro-VM unikernels in the CNCF landscape).

- Exactly **one process runs Postgres per `.pgdb`**, enforced by a lock. It holds the server's h9 machine, whose Linux root is the unpacked image and whose writable working directory is the `.pgdb`.
- Commands never host Postgres themselves: if no server is running, they start one in the background and use it. `psql`, `pg_dump`, and friends each run in their **own short-lived h9 machine (~90 ms to start)** over the same root.
- A `.pgdb` holds `minipg.toml` (settings + generated superuser password) and `pgdata/` (Postgres's data directory as plain files). A stopped `.pgdb` can be **copied like any directory**.
- New clusters use Postgres's builtin `C.UTF-8` locale, so sorting is identical on every platform.
- The image's `docker-entrypoint.sh` initializes the cluster on first start.

## Usage

```shell
minipg app.pgdb                     # psql shell (creates app.pgdb if missing)
minipg app.pgdb "select 1"          # one statement
minipg url app.pgdb                 # postgres://postgres:...@127.0.0.1:54321/app
minipg serve app.pgdb               # an explicit foreground server
minipg run app.pgdb -- npm start    # your app, with DATABASE_URL set
minipg dump app.pgdb > dump.sql     # and: minipg restore app.pgdb dump.sql
```

**CI without privileges or devices:** the Linux binary is static; without `/dev/kvm`, h9 runs
Postgres on its native backend. A test job can be as small as:

```shell
minipg init test.pgdb
minipg run test.pgdb -- go test ./...
```

## Portability matrix

| Platform | Backend |
| --- | --- |
| Linux x86_64 | KVM, or h9's native backend without it (Linux 5.11+) |
| Linux arm64 | KVM |
| macOS (Apple Silicon) | Hypervisor.framework |
| Browser | h9's web host, v86, and minipg's Linux build |

## Building

Building needs Zig 0.16 plus curl, jq, tar, xz for the rootfs:

```shell
git clone --recursive https://github.com/progrium/minipg
cd minipg
make build         # pulls the root for this host's arch, builds ./minipg
make root ARCH=386
make web           # the demo page, in .zig-out/web
```

## Caveats

- minipg is early, and h9's Linux personality is young.
- On h9's native backend, Postgres is about **2x slower than native** for one client, and slower under load.
- Don't trust it with data you can't recreate yet.

## Why it matters

The `.pgdb`-as-a-directory model gives PostgreSQL the SQLite ergonomics (git-ignorable,
copyable, per-project databases) while keeping the real server binaries. It removes the
"spin up Docker for tests" step entirely — the database becomes just another build artifact
of the repository.

## References

- [minipg project page](https://progrium.github.io/minipg/)
- [minipg on GitHub (MIT)](https://github.com/progrium/minipg)
- [hyper9 (h9): isolated Plan 9 and Linux programs on host hypervisors](https://github.com/progrium/hyper9)
- [CNCF: Linux applications in hypervisor-isolated micro-VMs with Hyperlight (comparison)](https://www.cncf.io/blog/2026-11-09/run-linux-applications-in-hypervisor-isolated-micro-vms-with-hyperlight/)
