---
title: 'Zero-SM NCCL: A Systematic Guide to Designing and Deploying SM-Free GPU Communication'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.18075
date: '2026-11-16'
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# Zero-SM NCCL: A Systematic Guide to Designing and Deploying SM-Free GPU Communication

## Overview
NCCL-class GPU communication libraries use Streaming Multiprocessors (SMs) for data movement and synchronization, stealing throughput from overlapped computation — a cost that grows with interconnect bandwidth. Zero-SM NCCL communicates within and across scale-up domains **without launching any SM kernel**: synchronization runs through CUDA stream memory operations, data moves asynchronously via copy engines within a scale-up domain, and network RDMA is driven from a stream-ordered CPU proxy. This paper is the first systematic guide to that design space: mechanisms, quantified benefits, and deployment recipes, built on an NCCL-derived implementation extended with the required features (exact NCCL version not stated in the paper).

## Key Contribution
- **SM-free mechanism stack**: CUDA stream memory ops for sync + copy-engine data movement + stream-ordered CPU proxy for RDMA — SMs fully out of the collective datapath.
- **API surface**: data-movement collectives (AllGather, AlltoAll) plus one-sided `ncclPutSignal` / `ncclWaitSignal` APIs.
- **Quantified benefits and a decision rule** distilled from an end-to-end study across models and parallelism strategies.

## Technical Reference Points
| Aspect | Detail |
|---|---|
| Synchronization | CUDA stream memory operations |
| Intra-domain data movement | Copy engines (async, no SM kernels) |
| Network RDMA | Stream-ordered CPU proxy |
| APIs | AllGather, AlltoAll, one-sided `ncclPutSignal`/`ncclWaitSignal` |
| Evaluated on | GB200 NVL72 and B200 NVL8 systems |
| Reference implementation | NCCL-derived, extended with the required features (version unspecified in paper) |
| AllGather bandwidth | up to **1.36×** vs legacy SM-based NCCL kernels |
| Overlapped GEMM median slowdown | **33% → 4%** |
| Megatron-LM gains | FSDP up to **+3.5%**; pipeline parallelism up to **+15%** (one-sided puts) |
| Trade-off | Higher latency per operation than SM kernels |
| Pays off | Large transfers in GPU-bound workloads; deep pipelines with large bubbles |
| Loses | Small messages; host-bound workloads |

## Relevance to Our Domain
For large-scale distributed training on GPU fleets, SM-free collectives free the entire SM budget for kernels — but the paper's own win/loss map shows it is conditional: enable it for large-message, GPU-bound collectives and deep pipelines; keep classic SM-based communication for small messages and host-bound phases. This note is the lookup table for that decision in NCCL-based training jobs. Related: [[reference-p2p-collectives-topology-aware-overlap]] in this topic.

## Publication Facts (verified on arXiv, 2026-11-17)

- **arXiv**: 2611.18075 [cs.DC], submitted **2026-11-13**; DOI 10.48550/arXiv.2611.18075; license CC BY-SA 4.0.
- **Authors** (13): Zhenhao He, Siyuan Shen, Ke Wen, Prajwal Singhania, Shiqing Fan, Youngeun Kwon, Sangkug Lym, Vasudevan Rengasamy, Vishnuswaroop Ramesh, Yicheng Qiang, Craig Belusar, Jeff Hammond, Torsten Hoefler.
- **HTML (experimental) full text** is available — useful for reading deployment recipes without the PDF.

## References
- Paper: https://arxiv.org/abs/2611.18075
- HTML full text: https://arxiv.org/html/2611.18075v1
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18075
