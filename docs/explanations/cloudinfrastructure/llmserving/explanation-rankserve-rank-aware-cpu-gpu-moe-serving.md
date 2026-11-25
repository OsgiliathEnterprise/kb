---
title: 'RankServe: Rank-Aware CPU-GPU Scheduling for Memory-Constrained MoE Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.31869
date: '2026-11-25'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# RankServe: Rank-Aware CPU-GPU Scheduling for Memory-Constrained MoE Serving

**Authors:** Hengyi Zhu, Zhendong Mi, Pu Zhao, Yanzhi Wang, Hao Wang, Shaoyi Huang


## Overview
Low-rank compression shrinks the expert pools that make Mixture-of-Experts models so memory-hungry at inference, but it creates a new scheduling problem: experts now have **different ranks**, so their storage, transfer and execution costs differ. RankServe is a CPU-GPU serving system for compressed MoE checkpoints whose core idea is to price GPU residency against the cheaper "nonresident path" (CPU execution, or transfer-then-GPU-execute) for each expert, given its rank and current token load — then keep on GPU only the experts with the best savings per byte.

## Problem Statement
Under tight GPU memory, deciding which experts to keep resident usually relies on popularity (routing frequency) and transfer cost. With heterogeneous low-rank experts, that is insufficient: a high-rank expert costs disproportionately more to store and move than a low-rank one, so popularity alone misranks which experts are actually worth the GPU bytes.

## Key Contribution
- **Rank-aware residency valuation**: each expert's GPU residency is scored by estimated savings versus its nonresident execution path, combining rank, token load and routing demand; residency priority = savings per byte.
- **Miss-path selection at runtime**: on a miss, the system chooses between CPU execution and transfer-then-GPU-execute based on current token loads, and permits temporary GPU execution **without cache admission** (no polluting residency).
- **Variable-rank runtime**: grouped matrix multiplications execute heterogeneous-rank factors directly, avoiding the padding-to-common-rank waste of naive low-rank serving.
- Built on **vLLM**; evaluated against six serving systems on three MoE models on a single CPU-GPU platform.

## Technical Approach
RankServe aggregates per-expert savings over observed routing demand from recent routing history, ranking candidates for GPU residency by marginal savings per byte. The runtime maintains a variable-rank weight format and dispatches expert FFNs through grouped GEMMs so that differently sized low-rank factors run in one launch. Nonresident experts follow the path (CPU compute vs. PCIe transfer + GPU compute) predicted cheapest at the moment of the miss.

## Results
Across batch sizes 1–32, per-model geometric-mean speedups over the fastest baseline per configuration:

| Metric | Speedup |
|---|---|
| Time to first token (TTFT) | 1.69–2.29× |
| Time per output token (TPOT) | 1.71–2.48× |

## Relevance to Our Domain
Memory-constrained MoE inference (single-GPU or edge-adjacent serving of DeepSeek/Mixtral-class models) is one of our core serving topics. RankServe's lesson generalizes beyond MoE: when compression makes components heterogeneous, cache-residency policies must be **cost-model driven per component**, not popularity-driven — and "execute on the miss path without admitting to cache" is a reusable primitive for any tiered-memory serving stack. Complements our MoE-CORE expert-offloading and "Broadcast, Don't Replicate" notes.

## References
- Paper: https://arxiv.org/abs/2611.31869
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.31869
- Related in KB: explanation-broadcast-dont-replicate-moe-serving.md, reference-moe-core-expert-offloading-residency.md
