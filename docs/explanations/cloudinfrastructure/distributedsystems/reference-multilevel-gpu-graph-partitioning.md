---
title: Multilevel Graph Partitioning on GPU Supercomputers
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.24264
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# Multilevel Graph Partitioning on GPU Supercomputers — Technical Reference

## Overview
Graph partitioning underpins sparse linear algebra, load-balanced parallel computation, and graph analytics — yet most **distributed** partitioners still don't use GPUs, even though GPUs dominate the top supercomputers. Gilbert, Boman & Madduri build a **new multi-GPU distributed partitioner based on Jet** (a prior single-GPU partitioner), targeting scalability at constant quality.

## Architecture (lookup)
| Component | Choice |
|---|---|
| Base algorithm | Jet (single-GPU multilevel partitioner), extended to distributed multi-GPU |
| Communication | **CUDA-aware MPI** + **one-sided communication** routines |
| Programming model | overall **bulk-synchronous parallel (BSP)** structure |
| Goal | scalability **without sacrificing solution quality** |

## Results
- **Quality**: solution quality **comparable to Jet** — going distributed did not cost partition quality.
- **Scalability**: **excellent weak scaling up to 256 GPUs**, enabling instances far larger than any single-GPU partitioner can hold.

## Decision Guide
- **Fits**: exascale-adjacent workloads needing high-quality partitions of graphs too large for one GPU's memory — sparse solver prep, parallel load balancing, large-graph analytics on GPU clusters.
- **Design takeaway**: the CUDA-aware MPI + one-sided + BSP combination is the reusable pattern for porting other single-GPU graph kernels to distributed GPU settings.
- **Not covered here**: dynamic/incremental repartitioning under evolving graphs, and CPU/GPU hybrid pipelines.

## Why It Matters for the KB
GPU-native partitioning is the substrate for load-balanced distributed compute (and data placement) on modern AI supercomputers; this is the current reference implementation profile for multilevel partitioning at multi-GPU scale.

## Related
- [[explanation-dexattention-distributed-sparse-attention]] — another GPU-distributed graph-structured workload
- [[explanation-checkco-checkpoint-coordinated-load-balancing]] — load balancing at the stream layer
- [[howto-ss-hsdp-runtime-update-decoupling]] — distributed execution tuned around communication phases

## References
- Paper: https://arxiv.org/abs/2611.24264
- Primary class: cs.DC
- Baseline/lineage: Jet single-GPU partitioner
