---
title: CUDA Locality Domains on Blackwell B300 — Die-Aware Performance Reference
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.07535
date: '2026-11-08'
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# CUDA Locality Domains on Blackwell B300 — Die-Aware Performance Reference

## Overview
Wu & Li (2026) characterise the **CUDA "locality domain"** — a region of GPU resources offering similar performance and scheduling semantics — on a dual-die chiplet GPU: **NVIDIA B300 (GB200 NVL72 configuration)**. The central practical question: is there an *intra-device* analogue of the multi-GPU "does my kernel span GPUs?" concern? Answer: yes. **Which die a thread block lands on, and whether kernel data spans dies, measurably changes kernel runtime.**

## Hardware Under Test

| Property | Value |
|----------|-------|
| GPU | NVIDIA B300 |
| System | GB200 NVL72 |
| Architecture | Dual-die chiplet (dies interconnected via NV-HBI) |
| Method | Controlled microbenchmarks, die-aware scheduling, single-die residency tests |

## Characterised Resource Families

| Resource | Locality finding |
|----------|-----------------|
| Tensor Memory (TMEM) | Locality-sensitive; capacity-constrained resource interacts with die placement |
| Streaming Multiprocessors (SMs) | Kernel scheduling semantics differ within vs. across die boundaries |
| L2 cache | Access latency/behaviour depends on die-resident vs. cross-die data placement |
| High Bandwidth Memory (HBM) | Cross-die access adds measurable cost relative to die-local access |

## Key Findings (lookup)
- A **deterministic die-replica benchmark** isolates intra-device locality effects from inter-GPU locality effects.
- **Die-aware thread-block scheduling** changes kernel runtimes — locality-domain management is a first-class tuning knob on dual-die GPUs, not a scheduling footnote.
- **Data-aware optimisations** (keeping hot data die-local) reduce runtime for data-intensive kernels.
- **Cross-die memory access** is an identified and quantified source of performance loss.

## Tuning Checklist (derived from the findings)
1. Profile whether your kernel's working set spans dies; assume cross-die penalties exist before proving otherwise.
2. Use die-aware block scheduling (pinning/partitioning) for latency-sensitive kernels.
3. For bandwidth-bound kernels, structure data layout so producers and consumers share a die.
4. Treat TMEM capacity as a constraint that couples with placement decisions.

## Caveats
Results are specific to the B300/GB200 NVL72 dual-die configuration; other multi-die designs may expose different locality-domain boundaries and NV-HBI characteristics.

## References
- Paper: https://arxiv.org/abs/2611.07535
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.07535
- Related KB: `explanations/cloudinfrastructure/gpucompute/explanation-blackwell-b200-inference-tuning.md`
