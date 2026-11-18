---
title: 'GNoF: A Low-SM-Overhead GPU-Native NVMe-over-Fabrics Completion Path for Data-Intensive
  GPU Workloads'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.21288
date: 2026-11-18
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# GNoF: A Low-SM-Overhead GPU-Native NVMe-over-Fabrics Completion Path for Data-Intensive GPU Workloads

## Overview
Data-intensive GPU workloads increasingly run on datasets that exceed device memory and live on **remote flash**. The conventional path has the host CPU orchestrate every NVMe-over-Fabrics transaction and stage data through host memory — costing CPU usage, repeated CPU–GPU synchronization, and redundant data movement. GPU-initiated storage removes the CPU from the I/O path, but leaves two problems (arXiv:2611.21288; Tian, Gu): **synchronous lock-step completion pins SMs in spin-polling** (wasteful over 10–100 µs RDMA round trips), and current GPU-native systems focus on target-side firmware while using per-command doorbells and periodic CQ polling. GNoF is a **GPU-native NVMe-oF/RDMA data path** — including the completion path — that fixes both.

## Design
GPU threads **build command capsules, post send work-queue elements, ring doorbells, and reap completions entirely on the device**. The CPU is reduced to one-time connection setup, the admin queue, and a keep-alive thread. Three mechanisms target the long fabric round trip:
1. **Doorbell mover** — coalesces a burst's doorbells into a single MMIO ring, amortizing expensive MMIO writes.
2. **Batched CQ poller** — a lock-free fast peek plus monotonic completion counters that **cannot lose a wakeup**.
3. **Set-associative, reference-pinned GPU page cache** — with split fetch/wait pipelining and orphan-fill takeover.

**Deployment property**: no target or firmware change required; GNoF runs against an **unmodified SPDK target**.

## Results
On a **200 Gb/s InfiniBand fabric**, per client:
- **1.77 million 4 KB IOPS** at **0.37% host CPU** and **~1% SM occupancy**
- vs. **40% CPU** for kernel nvme-rdma and **~100% SM occupancy** for lock-step polling
- Versus three baselines (kernel nvme-rdma, BaM over a BlueField-3 DPU, BaM on a local SSD) under identical workloads: **10–22× gains** on selective column I/O, **CPU-burn immunity**, and the regime where bulk staging is faster.

## Why It Matters
The novelty is the *completion path*: previous GPU-native designs left completions to lock-step spin-polling, silently converting I/O waits into SM starvation — the scarcest resource on an AI cluster. Decoupling completions (batched poller + doorbell coalescing) is what makes GPU-native NoF practical at production SM budgets (~1%).

## Relevance to Our Domain
For GPU cluster infrastructure: remote-flash data loading, checkpoint I/O and dataset curation can move onto the GPU data path without touching storage targets (plain SPDK). The SM-occupancy metric is the one to demand from any GPU-direct storage proposal — it competes directly with training compute.

## References
- Paper: https://arxiv.org/abs/2611.21288
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21288?fields=citationCount,year
