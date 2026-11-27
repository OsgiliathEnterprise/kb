---
title: MosaicKV — Dynamic Two-Dimensional KV Cache Compression for Long-Context Serving
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2607.00760
date: 2026-11-22
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# MosaicKV — Dynamic Two-Dimensional KV Cache Compression for Long-Context Serving

## Overview
At hundred-thousand-to-million-token prompts, the KV cache is a first-order serving cost: it grows linearly with context, exhausts GPU memory, forces smaller batches and throttles throughput. Prior compressors attack one axis — sequence (token) *or* channel (head-dimension) — which caps the achievable reduction; naively combining both wrecks accuracy. MosaicKV makes two-dimensional compression work by making it *dynamic*.

## Problem Statement
Two challenges gate two-D KV compression:
1. **Accuracy**: element importance in the KV cache is highly non-uniform, so a single global compression pattern applied across both dimensions loses too much.
2. **Performance**: fine-grained sparsity plus the bookkeeping to manage it can cost more than the compression saves.

## Key Contributions
- **Dynamic two-D compression**: instead of one global pattern, MosaicKV identifies the important elements *per KV vector* and selects compression strategies at **KV-cache segment granularity** — a mosaic of locally chosen patterns rather than a uniform blanket.
- **Compressed-KV-cache management**: uses underutilized GPU *and CPU* resources to maintain the compressed caches and accelerate attention, so the management overhead doesn't eat the gains.
- **End-to-end serving system** evaluated on H800 GPUs across multiple LLMs.

## Technical Approach
The insight is that KV-cache importance is non-uniform across both the token axis and the channel axis simultaneously. MosaicKV scores element importance at KV-vector level, then partitions the cache into segments and assigns each segment the best compression strategy for its content (token-dropping, channel-pruning, or mixes). A dedicated management layer offloads compressed-cache maintenance to idle GPU/CPU capacity and runs attention against the compressed layout, keeping the sparsity machinery out of the critical path.

## Results (H800, multiple LLMs, vs. uncompressed baseline)
- **16×** attention speedup
- **4.8×** lower decode latency
- **7.3×** higher serving throughput
- **3×** memory reduction
- Only **1.76%** average accuracy loss on LongBench and RULER

## Relevance
For long-context serving capacity planning: MosaicKV shows the KV-cache cost curve can be cut superlinearly when both dimensions are compressed *adaptively*, at the price of ~1-2% benchmark accuracy — a directly quotable trade for any 100K+ context deployment. Complements prefix-cache discovery (KVCompass) and residency management notes in this topic.

## Sources
- arXiv: https://arxiv.org/abs/2607.00760 (cs.LG, cross-listed cs.DC; 15 pages, 10 figures; v1 submitted 2026-07-01)
- Authors: Sheng Qiang, Ruiwei Chen, Yinpeng Wu, Jinyu Gu, Zhichao Hua, Yubin Xia, Binyu Zang, Haibo Chen
- Related: [[reference-kvcompass-prefix-cache-discovery]], [[reference-moe-core-expert-offloading-residency]]

> Verified against arXiv abstract 2026-11-22 (KB Zookeeper): all headline numbers (16× attention speedup, 4.8× lower decode latency, 7.3× throughput, 3× memory reduction, 1.76% avg accuracy loss on LongBench/RULER, H800 eval) match the published abstract.
