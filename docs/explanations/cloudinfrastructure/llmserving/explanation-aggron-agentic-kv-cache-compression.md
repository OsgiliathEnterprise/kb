---
title: 'Aggron: Aggressive Compression of Agentic KV Caches during Head-of-Line Stalls
  in the Request Queue'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.26435
date: 2026-11-19
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Aggron: Aggressive Compression of Agentic KV Caches during Head-of-Line Stalls in the Request Queue

## Overview
Aggron is a serving system that exploits idle capacity created by head-of-line stalls to compress the KV caches of agentic LLM workloads. Instead of running history-summarization as a competing background job, Aggron schedules summarization requests in a separate queue that consumes exactly the compute and memory left over while a stalled agentic request waits in the main queue — and only issues a summarization if it predicts the summary will finish before the request needs to run.

## Problem Statement
LLM agents run long multi-turn programs whose context grows at every step, so serving them is bounded by KV-cache capacity. Conventional relief is threshold-triggered context compression: when the KV cache crosses a large threshold, a big span of history is summarized at once — in the background or on the critical path. When that summarization runs on the same engine as serving (same model, no extra hardware), it competes with live requests for both compute and memory capacity, hurting latency and throughput.

## Key Contribution
- **Per-turn, selective summarization**: Aggron summarizes agentic requests at *every turn* and compresses only *selected parts* of the KV cache, keeping each summarization job small and preserving accuracy — versus the standard "one huge span at a threshold" approach.
- **Summarization Queue piggybacking on stalls**: summarization requests are launched from a dedicated queue while the corresponding agentic request is stalled at the head of the main request queue; the queue harvests the compute/memory headroom released by head-of-line stalls.
- **Predictive admission**: the server issues a summarization only when it predicts the summary will complete before the corresponding agentic request is finally scheduled to execute — avoiding wasted work and stale summaries.
- **Measured gains**: against state-of-the-art asynchronous summarization at high load, Aggron cuts **P99 program latency by 27–31%** and raises **throughput by 1.34–1.40×**.

## Technical Approach
Three mechanisms compose: (1) fine-grained compression policy — frequent, small, selective cache summarization per turn rather than rare, bulk compression; (2) queue architecture — a Summarization Queue decoupled from the main request queue, deliberately fed only with spare capacity exposed by head-of-line stalls; (3) a completion predictor gating summarization admission so summaries are useful by the time the stalled request resumes.

## Results
- P99 program latency: −27% to −31% at high load vs asynchronous summarization baselines.
- Throughput: +1.34× to +1.40×.
- Accuracy retained via per-turn selective compression (summaries stay lightweight).

## Relevance to Our Domain
For anyone operating agentic inference platforms (vLLM/SGLang-class engines serving tool loops), Aggron is a concrete scheduling pattern: turn *wasted* stall capacity into cache-compression work, and use completion prediction to keep speculative work useful. It complements eviction/quantization approaches (MosaicKV, KV cache offloading) by attacking the *when and where* of compression rather than the *how*.

## References
- Paper: https://arxiv.org/abs/2611.26435
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26435
- Related: [[explanation-mosaickv-dynamic-2d-kv-cache-compression]], [[reference-moe-core-expert-offloading-residency]] (llm-serving)
