---
title: A Fast, Programmable GPU-to-CPU Invocation Layer for GPU-Initiated Communication
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.23848
date: 2026-11-21
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# A Fast, Programmable GPU-to-CPU Invocation Layer for GPU-Initiated Communication

## Overview
Device-initiated communication lets GPU kernels talk to the outside world without synchronizing with the host at kernel boundaries. The dominant pattern, **GPUDirect Async (GDA)**, keeps transport control on GPU threads and treats offloading work back to host proxy threads ("reverse offload") as a slow fallback. This paper (arXiv:2611.23848, Yan et al., AMD Research) argues the opposite: reverse offload can be **faster than GDA** and should be a first-class communication path — exposed as a *programming interface* so users can define workload-specific communication operations. The framework is called **KIWI**, with open source code at https://github.com/AMDResearch/kiwi.

## Problem Statement
GPU-initiated communication libraries force a choice between keeping all control logic on the GPU (GDA, which steals SM cycles and complicates transport logic) and using host proxies as a degraded fallback. Neither path is programmable: applications cannot define their own communication operations, and scaling reverse offload naively runs into contention on shared queues, polling overhead, and load imbalance across proxy threads.

## Technical Specification
| Property | Value |
|----------|-------|
| System | KIWI — programmable reverse-offload framework (device → host invocation) |
| One-way device-to-host latency | Sub-microsecond |
| Operation rate | Hundreds of millions of operations per second |
| Scaling issues addressed | Shared-queue contention, polling overhead, proxy load imbalance |
| KIWI-P2P | SHMEM-like library built on KIWI; outperforms state-of-the-art GDA implementations in both latency and bandwidth |
| KIWI-EP | Expert-parallel MoE dispatch/combine kernels rebuilt around workload-defined operations |
| MoE communication latency | Up to **2.3× lower** than the best existing backend on AMD GPUs |
| vLLM time-per-output-token | Up to **29% reduction** |
| Paper | 11 pages, 9 figures, 3 tables |

## Key Components
- **Pluggable invocation layer**: GPU threads post requests that host proxy threads execute — the "reverse offload" path, promoted from fallback to primary mechanism.
- **Workload-defined communication operations**: users express domain-specific ops (e.g., MoE dispatch/combine) rather than generic send/recv.
- **KIWI-P2P**: reference SHMEM-like transport built on the layer, used to demonstrate that reverse offload beats GDA on both latency and bandwidth.
- **KIWI-EP**: mixture-of-experts dispatch/combine redesign for low-latency expert-parallel serving.

## Relevance to Our Domain
Expert-parallel MoE serving (DeepSeek-style models) is one of the hottest bottlenecks in LLM serving infrastructure; a 29% cut in vLLM time-per-output-token purely from a better GPU→CPU invocation path is directly actionable for anyone operating GPU fleets. It also challenges a widely repeated assumption (GDA is the fast path) in GPU networking literature.

## References
- Paper: https://arxiv.org/abs/2611.23848
- Code: https://github.com/AMDResearch/kiwi
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23848
- Related: NCCL GPU-initiated networking (arXiv:2511.15076) for the GDA/IBGDA baseline this paper compares against
