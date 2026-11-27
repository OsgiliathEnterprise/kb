---
title: CUDA Locality Domains on Blackwell B300 — Die-Aware Performance Reference
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.07535
date: '2026-11-15'
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# CUDA Locality Domains on Blackwell B300 — Die-Aware Performance Reference

## Overview
Wang, Zhou, Jiang & Zhao (2026, Scitix AI) characterise the **CUDA "locality domain" (LD)** — a region of GPU resources offering similar performance and scheduling semantics — on a dual-die chiplet GPU: **NVIDIA B300 (GB200 NVL72 configuration)**, measured across **eight B300 GPUs**. CUDA 13.4 exposes LDs via two *independent* controls: **memory placement** on a selected die (VMM or LD-tagged memory pool) and **compute binding** to the 70 SMs of one die (green context on an SM partition). The central practical question: is there an *intra-device* analogue of the multi-GPU "does my kernel span GPUs?" concern? Answer: yes — but **the benefit depends on the access pattern; locality can just as easily hurt.**

## Hardware Under Test

| Property | Value |
|----------|-------|
| GPU | NVIDIA B300 (dual-die chiplet, dies joined by on-package fabric / NV-HBI) |
| System | GB200 NVL72 |
| Locality domains | 2 per GPU, **70 SMs each of 148 total** |
| L2 cache | 126 MiB total (die-local slices + memory controllers per die) |
| Software | CUDA 13.4 (LDs via VMM / LD-tagged pool + green contexts) |
| Method | Controlled four-state comparison across 8 B300s: stock, memory-placement only, compute-binding only, both; mismatched configs as negative controls; hardware counters |

## Key Findings (lookup)

### Cross-die access costs
- **Dependent (latency-bound) HBM access across dies: 193.4 ns** per cross-die hop.
- **Cross-die streaming: only ~27% of baseline bandwidth.**
- Cross-die **reads add little latency once data is L2-resident** (the accessing die caches a local copy); **writes cross the fabric on every access**.

### Placement ≠ automatic speedup (access pattern decides)
| Scenario | Result |
|----------|--------|
| 1 MiB buffer read by remote GPU, memory placed on owning die | **2.08× faster** (75.7 → 157.2 GB/s) |
| 1 MiB buffer for a *local* collective, memory placement | no measurable gain |
| 256 MiB streaming buffer pinned to one die (local kernel) | **47% WORSE** than default striping |
| SM-issued collectives, compute binding alone | **1.495×** (an equivalent SM count spread over both dies: 0.999× — the win is locality, not fewer SMs) |
| Resident-data GEMMs | memory-only 0.75×, compute-only 1.04×, **both controls 1.37×** |
| Bandwidth-bound attention kernel | apparent 1.27× gain **disappears** when each config picks its own tile size |

### Driver overhead of localized allocation
- Beyond a **32 MiB threshold**, localized allocation overhead becomes substantial: the open-source driver maps localized memory **one 2 MiB page at a time**, with **77–87% of each call's cost in full-chip barriers and TLB invalidations** (not page-table work).
- Coalescing physically contiguous mappings + deferring synchronization cut a 1 GiB `cuMemCreate` by **7.02×**.

## Tuning Checklist (derived from the findings)
1. Classify the kernel first: latency-bound dependent loads and resident-data reuse benefit from LDs; **streaming workloads lose** if data is pinned to one die (striping is better).
2. Resident-data kernels (GEMM weights) usually need **both** memory placement and compute binding; test each control separately before combining.
3. For bandwidth-bound kernels, re-tune tile sizes per configuration before crediting LDs — apparent gains can be autotuning artifacts.
4. Budget the **allocation path** too: localized `cuMemCreate` >32 MiB carries barrier/TLB-invalidation overhead; batch/pool allocations.
5. TMEM capacity couples with placement decisions — treat as a constraint, not a footnote.

## Caveats
Results are specific to the B300/GB200 NVL72 dual-die configuration and CUDA 13.4; other multi-die designs may expose different locality-domain boundaries and fabric characteristics. LD vs MIG: MIG provides isolation but not the same performance guarantees (paper §8.3).

## References
- Paper: https://arxiv.org/abs/2611.07535
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.07535
- Related KB: `explanations/cloudinfrastructure/gpucompute/explanation-blackwell-b200-inference-tuning.md`
