---
title: 'XM-Sparse: High-Throughput Sparse-Attention LLM Serving over Scale-up Memory
  Pools'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.22280
date: '2026-11-18'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# XM-Sparse: High-Throughput Sparse-Attention LLM Serving over Scale-up Memory Pools

## Overview
XM-Sparse is the first sparse-attention **offloading** system built over scale-up memory pools (e.g., X-Mem). Sparse attention is increasingly adopted in production LLMs — including recent DeepSeek (2025) and GLM (2026) models — for long-context inference, but serving stacks still retain the full KV history, so GPU HBM capacity caps serving concurrency. Host-memory offload (PCIe-based) trades one bottleneck (capacity) for another (bandwidth); scale-up memory pools relieve both — yet the authors show decode throughput remains HBM-bound because hot KV buffers and a fully resident indexer-key (K-index) cache occupy large HBM footprints.

## Problem Statement
How to serve sparse-attention LLMs at high decode throughput over very long contexts (16K–1M tokens) when HBM is the binding constraint even with an external memory pool — given that the two hot caches (dynamic KV entries, K-index) have fundamentally different access patterns.

## Key Contribution (system parameters)
| Design point | Mechanism |
|---|---|
| Dynamic KV entry retrieval | TMA-based retrieval **fused** with attention in a tile-level pipeline, hiding on-demand I/O latency |
| K-index cache | Predictable accesses → page prefetch via SM-efficient **GPU-initiated DMA**, coordinated with latency-critical decode ops to avoid interference |
| Core idea | Offload *both* caches aggressively, but match each cache with an I/O mechanism tailored to its access pattern |
| HBM residency | Only compact hot KV buffers, K-index staging buffers, and a subset of K-index pages stay in HBM; full KV and K-index caches live in the external pool |
| Implementation | Built atop **SGLang**; evaluated with an emulated scale-up memory pool |

## Results
| Model | Comparison | Decode throughput gain |
|---|---|---|
| DeepSeek-V3.2, GLM-5.3 (16K–1M contexts) | vs PCIe-based ECHO | up to **4.98×** |
| same | vs HiSparse | up to **4.52×** |
| same | vs naive integration on same platform | up to **1.34×** |

## Relevance to Our Domain
Reference architecture for our long-context serving roadmap: the key operational insight is that cache offloading must be access-pattern-aware (fused-TMA for random KV reads vs DMA prefetch for predictable index reads). The ECHO/HiSparse comparison points anchor expected gains when moving from PCIe host offload to scale-up memory pools.

## References
- Paper: https://arxiv.org/abs/2611.22280 (published 2026-11-17)
- Authors: Yijun Sun, Xudong Liao, Zhuobin Huang, Kai Chen, Nikita Lazarev, Zhizhen Zhong
- Prior systems: ECHO, HiSparse; scale-up memory pool: X-Mem; base serving engine: SGLang
- Industry write-up (Netpreme, X-Mem + SGLang HiSparse integration): https://netpreme.com/blog/xm-sparse-sglang-hisparse-netpreme-xmem
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22280
