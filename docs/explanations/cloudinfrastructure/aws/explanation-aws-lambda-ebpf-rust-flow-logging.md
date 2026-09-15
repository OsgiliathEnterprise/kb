---
title: AWS Lambda eBPF/Rust Flow Logging Architecture
diataxis: Explanation
domain: cloud-infrastructure
topic: aws
source: TheNewStack
source_url: https://thenewstack.io/aws-lambda-ebpf-rust/
date: 2026-09-15
keywords:
- knowledge-base
- aws
- cloud-infrastructure
- explanations
---
# AWS Lambda eBPF/Rust Flow Logging Architecture

AWS Lambda replaced its aging iptables-based packet capture system with a purpose-built pipeline in eBPF and Rust to log every network flow across thousands of Firecracker microVMs per host. The old design broke at Lambda's density for two reasons: **rule explosion** (100k+ iptables rules for 2,000 microVMs, each packet paying a linear tax) and **no IPv6 support**.

## Why the Old Design Failed

The EC2-era system had two parts:
- A kernel-side extension that counted packets and matched them to tenants per flow
- A userspace daemon that read counters, batched records, serialized, and uploaded files

At Lambda's density (thousands of microVMs per bare-metal host), iptables' linear rule walk meant every packet paid a tax proportional to host crowding. Adding more microVMs made each packet slower — the exact opposite of what you want when packing density. The kernel module also couldn't see IPv6, making it untrustworthy for dual-stack workloads.

## Architecture: Three Cooperating Pieces

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "ctrl-plane",
      "type": "rectangle",
      "x": 300,
      "y": 40,
      "width": 280,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Control Plane\ngRPC over Unix socket",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "orchestrator",
      "type": "rectangle",
      "x": 300,
      "y": 160,
      "width": 280,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Orchestrator (privileged)\nloads eBPF, configures TC,\nspawns taggers per network",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "ebpf-capture",
      "type": "rectangle",
      "x": 60,
      "y": 320,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "eBPF capture\nTC hooks on devices\n(observe-only)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "ring-buffer",
      "type": "rectangle",
      "x": 300,
      "y": 320,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a8d5a2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Ring Buffer\n(one per network)\n~512 KiB default",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "tagger",
      "type": "rectangle",
      "x": 540,
      "y": 320,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f5c6aa",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Tagger (unprivileged)\nRust, one per network\naggregates flows → Ion",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "downstream",
      "type": "rectangle",
      "x": 540,
      "y": 460,
      "width": 200,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Billing + Flow-log\npipeline (unchanged)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "arrow-ctrl-orch",
      "type": "arrow",
      "x": 440,
      "y": 100,
      "width": 0,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [0, 60]]
    },
    {
      "id": "arrow-orch-ebpf",
      "type": "arrow",
      "x": 380,
      "y": 230,
      "width": 140,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [-140, 90]]
    },
    {
      "id": "arrow-ebpf-ring",
      "type": "arrow",
      "x": 260,
      "y": 355,
      "width": 40,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [40, 0]]
    },
    {
      "id": "arrow-ring-tagger",
      "type": "arrow",
      "x": 500,
      "y": 355,
      "width": 40,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [40, 0]]
    },
    {
      "id": "arrow-tagger-downstream",
      "type": "arrow",
      "x": 640,
      "y": 390,
      "width": 0,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [0, 70]]
    }
  ],
  "appState": {
    "gridSize": null
  }
}
```

### Kernel Capture Layer (eBPF)

- Small eBPF programs attached to the `clsact` qdisc on both ingress and egress of each network's virtual devices (4 attach points per network)
- **Observe-only**: every program reads the packet and returns "keep going" — no code path can copy, block, drop, or rewrite a packet
- Per-packet event is ~24 bytes for IPv4: `ip_version`, `protocol`, `direction`, `device_id`, `local_port`, `remote_port`, `flags_and_bytes` (8-bit TCP flags + 24-bit byte count), addresses, timestamp
- Direction normalization happens in-kernel: "local" always means the sandbox side, so userspace never reasons about direction when grouping flows

### Tagger (Rust, unprivileged)

- One tagger per network, running with **no elevated privileges**
- Single-threaded async runtime: one task reads the ring, another owns flow state, a third writes parcels
- Flow map keyed by `(device, five-tuple, tenant_attribution_handle)` — attribution comes from dedicated ring + devices, not from parsing shared traffic
- Serializes completed flows into Amazon Ion records every minute (aligned to top of second), written to temp name → flush → rename for atomic visibility
- Each tagger runs in a few hundred KB RAM against ~1 MB budget

### Orchestrator (privileged, one per host)

- Owns all elevated operations: loading eBPF programs, wiring traffic control, spawning/supervising taggers
- Exposes lifecycle API over Unix domain socket (gRPC): create flows, activate flow, recycle, tear down, health check
- **Create** is heavy (loads eBPF, configures TC, spawns tagger); **Activate** is light (&lt;2 ms p90, &lt;10 ms p99.9) — just hands over metadata and flips to steady-state

## Key Design Decisions

### Ring Buffer Sizing from First Principles

```
ring bytes ≈ 62,500 pps × 0.1 s × ~24 bytes × 2 directions ≈ 300 KB
→ rounded up to 512 KiB (power of two requirement)
```

The floor ensures a guest can't outrun the recorder even at its own maximum packet rate. In production, provisioned more generously (~2 MB) while tuning per-workload values.

### Wakeup Strategy

- Kernel checks ring fill level; only forces wakeup when ring crosses ~1% full
- Userspace won't re-read more than once every 100 ms
- Quiet flows: free (no timer, no polling). Busy flows: read almost immediately via threshold trigger

### Least Privilege via File Descriptor Passing

The taggers hold **zero** elevated privileges. They can't load eBPF or touch traffic control. The orchestrator opens the ring buffer map and hands the open file descriptor to each tagger over a Unix domain socket using `SCM_RIGHTS`. The tagger gets a ready-to-use handle with nothing else. The entire privileged surface is one small process per host.

### Verifier + Formal Verification

- eBPF header parser made a shared subroutine so the verifier proves it once instead of re-proving at every attach point
- IPv6 extension-header walk bounded to fixed hops for termination proof
- Fragmented packets report zero ports/flags (no garbage)
- GSO/GRO super-packets handled correctly for byte counts
- Each eBPF program runs through **CBMC** (formal model checker) during every build, asserting struct layout compatibility

### Kill-or-Reuse Tradeoff

Original design: always destroy tagger on recycle (structurally prevents cross-tenant metadata leakage). Production reality: fork/exec thousands of times caused CPU spikes. Shipped system adds a knob — workloads that reuse networks can reuse the tagger after recycle; strict mode remains available for maximum isolation.

## Results

| Metric | Old (iptables) | New (eBPF/Rust) |
|--------|---------------|-----------------|
| Per-packet cost | Linear in rule count (~100k rules) | Constant-time map lookup |
| IPv6 support | No | Yes, first-class |
| Taggers per host | 1 daemon | Thousands (few hundred KB each) |
| Activate latency | — | &lt;2 ms p90, &lt;10 ms p99.9 |
| Downstream migration | — | Zero (byte-identical Ion output) |

## Transferable Lessons

1. **Observe from outside the hot path** — inline recording becomes a per-packet tax; eBPF lets you watch from the side while expensive work happens elsewhere
2. **Size buffers from real limits** — rate × drain interval × event size is a defensible number, not a guess
3. **Separate tenants at capture time** — dedicated ring + devices means streams never touch; label clean traffic instead of guessing after the fact
4. **Old primitives are underrated** — passing an fd over a socket (SCM_RIGHTS) concentrates privilege in one small place while keeping thousands of processes powerless
5. **Keep the bolt pattern** — byte-for-byte identical output enables zero downstream migration and record-for-record completeness verification

## References

- [How AWS Lambda logs every flow across thousands of microVMs per host with eBPF and Rust — The New Stack](https://thenewstack.io/aws-lambda-ebpf-rust/)
- [BPF ring buffer — Linux kernel documentation](https://docs.kernel.org/bpf/ringbuf.html)
- [eBPF ring buffer deep dive — Deep Kondah](https://www.deep-kondah.com/deep-dive-into-ebpf-ring-buffers/)

## Related

- [[explanation-k8s-device-management-dra]]
- [[howto-manage-cluster-api-resources-with-headlamp]]
