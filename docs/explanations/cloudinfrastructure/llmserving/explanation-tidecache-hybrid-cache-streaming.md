---
title: 'TideCache: Efficient Hybrid LLM Serving with Transparent Cache Management
  and Layer-Wise Streaming'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.26619
date: 2026-11-19
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# TideCache: Efficient Hybrid LLM Serving with Transparent Cache Management and Layer-Wise Streaming

## Overview
TideCache is a serving system for **hybrid-architecture** language models (mixtures of global-attention layers and bounded-state/linear layers) running on CPU–GPU superchips. Its insight: these two layer families maintain *heterogeneous* caches whose memory demands shift with context length and concurrency, so GPU memory should be dynamically rebalanced among them — with global-attention prefixes streamed layer-by-layer from host memory instead of fully resident in HBM.

## Problem Statement
Hybrid architectures are now mainstream among open-weight models. Their global-attention layers (KV caches) and bounded-state layers (state caches) have very different and workload-dependent memory footprints. Fixed cache allocations either waste HBM or starve one cache type; on CPU–GPU superchips with shared capacity, managing residency across GPU and host memory is the bottleneck for long-context, high-concurrency agent serving.

## Key Contribution
- **Transparent Cache Pool**: redistributes physical pages among the different cache components *behind fixed virtual addresses*, so cache layouts and backend interfaces remain untouched — memory rebalancing without engine-level surgery.
- **Cache Streamer**: exploits the computation intervals that bounded-state layers naturally provide to prefetch the *next* global-attention layer's prefix into GPU slots **shared across global-attention layers**, overlapping layer-wise host→GPU transfers with computation and cutting GPU residency; generated KV stays resident.
- **Request Scheduler**: chooses between resident-execution and streamed-execution per request based on request size and queue state, and triggers capacity adjustments accordingly.
- **Compounding effect**: HBM freed by streaming becomes available for the other cache components and for admitting more requests.

## Technical Approach
Implemented in **SGLang** and evaluated on **GB300 and GH200** platforms across seven model/configuration combinations. The design leans on a structural property of hybrid models: bounded-state layers compute quickly and create scheduling gaps, which are exactly the windows in which a shared streaming buffer can load the next global-attention layer's prefix. Fixed virtual addresses decouple logical cache identity from physical page placement, making the rebalancing transparent to kernels and runtimes.

## Results (vs SGLang with HiCache)
- Up to **2.04× more agent turns** completed.
- Overall **P50 per-token latency −20% to −59%**.
- Agent **P50 TTFT improved 1.40–3.05×**.

## Relevance to Our Domain
Hybrid (attention + linear/bounded-state) models are dominating open-weight releases; serving stacks that assume a single homogeneous KV cache will leave capacity on the table. TideCache demonstrates an SGLang-level pattern for CPU–GPU superchips (GH200/GB300 class): virtual-address-transparent page pools + layer-wise prefetch into shared slots. Directly relevant to our serving notes on cache offloading and prefix reuse.

## References
- Paper: https://arxiv.org/abs/2611.26619
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26619
- Related: [[reference-kvcompass-prefix-cache-discovery]], [[explanation-mosaickv-dynamic-2d-kv-cache-compression]] (llm-serving)
