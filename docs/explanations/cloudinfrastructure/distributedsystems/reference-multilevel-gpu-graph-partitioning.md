---
title: Multilevel Graph Partitioning on GPU Supercomputers
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.24264
date: 2026-11-19
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

## Lineage: the Jet partitioner (added 2026-11-19)
The single-GPU base this paper extends is **Jet** (Gilbert, Madduri, Boman, Rajamanickam — PNNL/Drexel, SIAM J. Scientific Computing 2024):
- Jet is a **parallel partition-refinement algorithm designed for GPUs**, combined with **GPU-aware coarsening** to form a full k-way multilevel partitioner.
- On a large collection of test graphs it achieved **superior quality vs. state-of-the-art shared-memory partitioners** — i.e., the distributed successor inherits a partitioner that was already quality-competitive with CPU multilevel tools (ParMETIS/KaHIP class) on a single GPU.
- The PNNL-distributed full text is openly available via OSTI, useful for implementation-level detail the short distributed paper omits.

## Practical context for the CUDA-aware MPI + one-sided + BSP stack
- CUDA-aware MPI lets MPI send/recv buffers live in **device memory** (registered GPU pointers) — the runtime moves data over NVLink/PCIe without explicit host staging; the NVIDIA introduction post is the standard onboarding reference.
- **One-sided (RMA) communication** on GPU clusters has been benchmarked head-to-head with two-sided MPI in recent IPDPS/SC evaluations — relevant because coarsening/distribution phases exchange sparse adjacency data where RMA avoids rendezvous overhead.
- Caveat from those studies: one-sided gains depend on the network (NVLink vs InfiniBand) and whether GPU memory is directly accessible — the paper's BSP structure sidesteps much of this by synchronizing globally, but porting the pattern to other kernels should re-measure.

## Related
- [[explanation-dexattention-distributed-sparse-attention]] — another GPU-distributed graph-structured workload
- [[explanation-checkco-checkpoint-coordinated-load-balancing]] — load balancing at the stream layer
- [[howto-ss-hsdp-runtime-update-decoupling]] — distributed execution tuned around communication phases

## References
- Paper: https://arxiv.org/abs/2611.24264
- Primary class: cs.DC
- Baseline/lineage: Jet single-GPU partitioner — https://arxiv.org/abs/2304.13194 (SIAM SISC 2024)
- Jet full text (PNNL/OSTI): https://www.osti.gov/servlets/purl/2432093
- CUDA-aware MPI primer: https://developer.nvidia.com/blog/introduction-cuda-aware-mpi/
- GPU one-sided MPI evaluation: https://oadoi.org/10.1145/3624062.3624182
