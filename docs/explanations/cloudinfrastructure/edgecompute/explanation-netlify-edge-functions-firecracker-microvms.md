---
title: Netlify Edge Functions on Firecracker MicroVMs — V8 Isolates to Hardware Isolation
  at the Edge
diataxis: Explanation
domain: cloud-infrastructure
topic: edge-compute
source: HackerNews (netlify.com)
source_url: https://www.netlify.com/blog/edge-functions-firecracker-microvms/
date: 2026-10-01
keywords:
- knowledge-base
- edge-compute
- cloud-infrastructure
- explanations
---
# Netlify Edge Functions on Firecracker MicroVMs — V8 Isolates to Hardware Isolation at the Edge

Netlify rebuilt the infrastructure behind its ~1 billion daily Edge Function invocations: functions now run on **Firecracker MicroVMs inside Netlify's own edge network** instead of a hosted execution service, built with [Unikraft](https://unikraft.com/). The result is roughly 5x faster at the median — and stronger isolation. Nothing changes for users: URL imports, npm packages, Node built-ins, `netlify.toml` declarations, and local development all work exactly as before.

## The numbers

| Metric | Before (V8 isolates) | After (MicroVMs) |
| --- | --- | --- |
| p50 warm invocation latency | 25–40 ms | **~5–6 ms** (~5x faster) |
| p99 invocations | — | **47.4% faster** |
| Availability | — | 99.998% |
| Log delivery | baseline | 5x faster |
| Cold invocations | — | ~1.2% of traffic, ~9 ms average (fetching images in a region that has never seen the function) |

A warm invocation = routing to a compute node, entering the MicroVM, running the function, producing response headers.

## Request path: how one request flows

1. **Edge node.** The request lands on the nearest edge node, which terminates TLS and matches the path against that deploy's Edge Function routes. No match → cache/origin as usual. Match → forward to a compute node *inside Netlify's network* (previously the request left the network entirely).
2. **Machine spec.** Before forwarding, the edge node writes a machine specification naming three images — runtime, platform, and the edge function image — plus CPU/memory/connection limits. The spec travels with every request; its hash plus site-specific info becomes a **service ID**. Two deploys with different code or environment variables are different services and never share a MicroVM — so a compromised deploy cannot poison other customers or the compute layer. This is the isolation V8 isolates, "no matter their name", do not provide.
3. **Compute node selection.** Each region has a group of compute nodes; the edge node picks one via **rendezvous hashing**, so the same service lands on the same node every time — which keeps the MicroVM warm and code in cache. Stickiness is relaxed above a traffic threshold: a hot function gets spread across a slice of nodes so one customer's spike doesn't saturate its pinned box.
4. **Service lifecycle.** A *service* groups multiple MicroVMs for one site's functions, with parameters controlling when VMs scale in/out (e.g., a fixed request count per VM before shutdown). Images are fetched only for functions receiving traffic in that region; first-fetch cost is paid once and cached.
5. **MicroVM boot.** Each function runs in its own Firecracker MicroVM — created in under 1 ms, starting at ~2 ms p99 because the guest is a stripped-down Linux environment (Unikraft) rather than a full OS. Function files are mounted as an **uncompressed EROFS image and memory-mapped**, so the VM reads only the parts of the bundle it actually uses.
6. **Snapshot + scale-to-zero.** When the JS server starts listening, the MicroVM is snapshotted. Idle functions scale to zero; the next invocation restores from the snapshot — which is itself memory-mapped, so execution resumes without waiting for the whole snapshot to be read back into memory. The VM lifecycle (boot, snapshot, restore, scale-to-zero) is Unikraft's product layer on top of Firecracker.

## Why MicroVMs beat isolates here

- **Isolation boundary.** A potentially compromised deploy runs in a separate hardware-isolated VM; even if it escapes the runtime it cannot reach other customers or the compute layer.
- **Density + caching.** Rendezvous-hash stickiness turns node-local image/code caching into a cold-start strategy: only first requests pay fetch cost, and warm VMs stay on the same node.
- **No user-facing change.** The platform swap is invisible to function authors — the win is pure latency, isolation, and resilience.

## Context from Unikraft's side

Unikraft positions Firecracker as "a VMM, not a platform": the open-source project gives you the isolation boundary; everything above it (guest OS, snapshots, orchestration, density) is what you'd otherwise build yourself. Their claims for the platform layer: cold boot and stateful scale-to-zero resume in under 10 ms, ~10 ms live-VM fork/branching, 100K+ microVMs per standard server (shared-memory networking instead of tap devices at that density), a Dockerfile-derived minimal Linux guest that boots in milliseconds versus ~330 ms for a stock Linux guest on raw Firecracker, and **Kraftlet** — a Virtual Kubelet-based node that schedules ordinary Kubernetes pods as strongly-isolated microVMs (demo: 100k pods on one box). Netlify's blog is the production reference case for this stack at edge scale.

## Diagram

See [netlify-edge-functions-microvm-request-path.excalidraw](netlify-edge-functions-microvm-request-path.svg) for the request path from client to MicroVM and back.

## References

- [5x faster Edge Functions: How we replaced v8 isolates with Firecracker MicroVMs (Netlify, 2026-09-30)](https://www.netlify.com/blog/edge-functions-firecracker-microvms/)
- [Unikraft's account of the Netlify migration](https://unikraft.com/blog/netlify-edge-functions)
- [A VMM does not make an entire platform (Unikraft vs Firecracker)](https://unikraft.com/blog/unikraft-vs-firecracker)
- [Millisecond, microVM Kubernetes — Kraftlet architecture (Unikraft)](https://unikraft.com/blog/millisecond-microvm-kubernetes)
