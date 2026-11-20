---
title: A Runtime System for Mitigating Crossbar Port Contention on SM-Partitioned
  GPUs
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.24458
date: 2026-11-19
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# A Runtime System for Mitigating Crossbar Port Contention on SM-Partitioned GPUs

## Overview
This paper (GPCPlace) shows that SM partitioning via CUDA Green Contexts does not fully isolate co-located GPU workloads: contention also happens at the crossbar ports linking each Graphics Processing Cluster (GPC) to the L2 cache. A runtime system that dynamically chooses between "spreading" and "packing" workloads across GPCs recovers much of the lost latency.

**Paper details** (verified on arXiv, 2026-11-20): Ziwen Wang, Qi Luo, Kunlin Li, Changxi Liu, Dongsheng Wang, Yun Chen — submitted 18 Nov 2026, 7 pages / 7 figures / 1 table, categories cs.DC (primary) and cs.AR.

## Problem Statement
Green Contexts restrict concurrent workloads to disjoint SMs to avoid scheduling interference, yet latency-critical workloads still slow down. Prior work blamed shared L2/memory bandwidth, but the authors identify a second mechanism: all SMs of a GPC share a single crossbar port to L2, and Green Contexts' spreading policy co-locates background requests with latency-critical ones on the same ports.

## Key Contribution
- Identifies **GPC-to-L2 crossbar port contention** as a distinct interference channel beyond L2/memory sharing.
- Explains the trade-off: *spreading* workloads across GPCs queues latency-critical requests behind background traffic on shared ports; *packing* into separate GPCs avoids queuing but narrows the latency-critical workload to fewer ports, capping bandwidth. Neither policy dominates across workloads and GPUs.
- **GPCPlace**: a runtime that profiles workloads on the target GPU, estimates both slowdowns, and dynamically selects spread vs. pack by hooking kernel launches in the CUDA driver and rewriting SM masks — **no application changes required**.

## Technical Approach
Per-target-GPU profiling feeds slowdown estimators for the two placement policies. A CUDA-driver hook intercepts kernel launches and applies the chosen SM mask, making placement a runtime decision rather than a code change.

## Results
Evaluated on 14 GPUs across 112 workload cases: latency-critical workloads speed up **up to 1.15× on average and 2.38× at the maximum** over Green Contexts, without degrading background throughput.

## Relevance to Our Domain
GPU co-location and interference isolation are central concerns for shared inference fleets and mixed latency-critical/batch clusters (the same theme as our PACER, TailGuard-GDS, and zero-SM NCCL notes). The result warns that SM-level partitioning alone is insufficient isolation, and offers a driver-level placement control that platform teams could adopt.

## References
- Paper: https://arxiv.org/abs/2611.24458
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24458
