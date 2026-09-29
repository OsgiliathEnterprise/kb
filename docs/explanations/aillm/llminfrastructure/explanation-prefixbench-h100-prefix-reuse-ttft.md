---
title: 'PrefixBench-H100: Characterizing Prefix Reuse and Time-to-First-Token in H100
  LLM Serving'
diataxis: Explanation
domain: AI-LLM
topic: LLM-Infrastructure
source: arXiv
source_url: https://arxiv.org/abs/2609.19657
date: 2026-09-20
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- explanations
---
# PrefixBench-H100: Characterizing Prefix Reuse and Time-to-First-Token in H100 LLM Serving

## Overview

Repeated prompt prefixes are now ubiquitous in LLM serving — system prompts, templated RAG pipelines, agent frameworks, multi-turn conversations. Modern runtimes (vLLM, TensorRT-LLM) reuse previously computed KV-cache state across requests, but it's been unclear *when* prefix reuse actually helps on contemporary accelerators and when its benefits are capped by scheduling, cache granularity, concurrency, or memory pressure. PrefixBench-H100 is a reproducible benchmark and measurement framework that maps the practical operating envelope of prefix reuse on a single NVIDIA H100 — it's reference material for understanding where KV-cache prefix sharing pays off.

## Problem Statement

Prefix-reuse mechanisms exist in mainstream runtimes, but their real-world benefit is poorly characterized: does reusing a shared prefix reduce time-to-first-token (TTFT) meaningfully, or do scheduling overheads, cache granularity limits, concurrency, and memory pressure erode the gain? Without controlled measurements across these axes, operators can't know whether to rely on prefix caching for latency.

## Key Contribution

- A **reproducible benchmark + measurement framework** for characterizing prefix reuse on a single H100, combining controlled synthetic traces with chat-style and retrieval-style workloads.
- Head-to-head evaluation of **two widely used runtimes (vLLM and TensorRT-LLM)** under matched workload conditions.
- Systematic variation across the axes that matter: shared-prefix length, suffix diversity, request arrival pattern, concurrency, output length, and cache configuration — while collecting TTFT, inter-token latency, end-to-end latency, throughput, cache-hit statistics, GPU memory usage, and profiling traces.

## Technical Approach

The benchmark is deliberately *not* a new caching algorithm; it's a measurement harness. It sweeps shared-prefix length, suffix diversity, arrival pattern, concurrency, output length, and cache config, then records TTFT/ITL/E2E latency, throughput, cache-hit rates, GPU memory, and profiling traces for two runtimes under identical workloads. The goal is to expose the regime where prefix reuse gives substantial first-token-latency reductions versus the regime where cache pressure erodes them.

## Results (key findings)

- Identifies the **regime where prefix reuse yields substantial TTFT reductions** and the **regime where cache pressure erodes those gains**.
- Cache effectiveness itself is **largely insensitive to concurrency and output length** — the benefit/limitation is driven more by prefix structure and memory than by load.
- The remaining cross-runtime differences arise **above the cache, in the scheduling layer**, not in the caching mechanism itself.

### Verified numbers (H100 NVL, vLLM 0.21 vs TensorRT-LLM 1.2.1)

- At an 8192-token shared prefix both runtimes cache ≈ 92% of the input and deliver a **5–6.5× TTFT reduction** over reuse-disabled; hit rates scale with prefix length (≈ 65/78/87/92% at 1024/2048/4096/8192 tokens) and are statistically identical across runtimes — the cross-runtime gap is per-request overhead, not cache behavior.
- **Arrival pattern flips the leader**: sequential → bursty arrival at concurrency 32 flips p50 TTFT leadership from vLLM to TensorRT-LLM by ~2.4×; fixed-rate (16 QPS) flips it back to vLLM by ~9.2× on p95 TTFT. All attributable to the scheduling layer, not cache effectiveness.
- **Under load**: at 4096-token prefix with bursty arrivals, vLLM's p50 TTFT inflates rapidly (c=8: 215 ms → c=32: 759 ms) while TensorRT-LLM's PyTorch backend scales more gradually (c=8: 142 ms → c=32: 319 ms).
- **Cache pressure regime**: once the prefix working set exceeds KV capacity, the cache binds again for both runtimes simultaneously — at ~13.2× over-subscription hit rate drops to ~5.6% and TTFT regresses ~15.7×.

## Relevance to Our Domain

This is lookup material for anyone tuning LLM serving latency on H100-class hardware: it tells you *when* prefix/KV-cache reuse is worth relying on and when it isn't. The finding that cache effectiveness is insensitive to concurrency/output length (and that runtime differences live in the scheduler) is a useful mental model — if your TTFT problems persist under prefix caching, look at scheduling rather than the cache. Reproducible traces make it directly reusable for capacity planning.

## References
- Paper: https://arxiv.org/abs/2609.19657
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.19657
