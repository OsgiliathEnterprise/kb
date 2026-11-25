---
title: 'Norn: Context-Length-Aware Optimization of Weight and KV Cache Placement for
  Offloaded LLM Inference'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.32295
date: 2026-11-25
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Norn: Context-Length-Aware Optimization of Weight and KV Cache Placement for Offloaded LLM Inference

## Overview
Norn is a single-GPU inference method for models that exceed GPU memory, where both weights and the KV cache are partially offloaded to host memory. Its key observation is that weight offloading and KV-cache offloading impose *opposite* PCIe traffic patterns over a request's lifecycle: decode phases are weight-dominated (many small reads, KV reads shrinking with the attention window), while long prompts are KV-dominated (prefill is a burst of KV transfers, weight reads amortized). Norn profiles offline, precomputes placement plans per context length, and switches plans as the context grows — cutting decode latency by 30–37% and prefill latency by 33–77% on consumer and datacenter GPUs.

## Problem Statement
When LLMs outgrow even high-end GPU memory, offloading weights and the growing KV cache to host memory is the standard fallback, but it introduces large PCIe transfer overhead. Prior systems optimize *either* weight offloading *or* KV-cache placement, and none accounts for how the workloads differ across the request lifecycle and context lengths: decode is weight-read-heavy, prefill of long prompts is KV-transfer-heavy.

## How-to: Optimize Offloaded Inference with Norn
1. **Profile offline.** On your target GPU, measure the per-placement behavior of weights and KV cache — the cost of keeping each resident vs. streaming it over PCIe — across context lengths.
2. **Precompute placement plans.** For each context-length bucket, derive the optimal split: which layers' weights stay on-device, whether KV stays on-device, and which prefill strategy to use.
3. **Switch plans as context grows.** During serving, move between precomputed plans when the context crosses bucket boundaries, so decode phases run weight-resident and long-prompt prefills keep KV on-device.
4. **Chunk long prefills for memory-bounded models.** Split prefill into KV-prefill chunks and weight-prefill chunks, overlapping the two so neither PCIe stream idles.
5. **Overlap KV writes with weight reads.** Schedule concurrent PCIe transfers to hide transfer latency behind compute.
6. **Overlap plan switching with layer prefetch.** Bring the next plan's layers in while the current plan still executes, so transitions are invisible to tokens.
7. **Add a KV-cache compression stage for extreme settings.** When memory pressure is highest, compress KV to shrink the on-device footprint further.

## Technical Approach
Norn's engine is offline profiling + runtime plan switching. Because decode and prefill stress different PCIe directions, the placement that minimizes transfers depends on the phase and on context length; Norn encodes that dependency as a plan table and reacts to context growth. Three scheduling mechanisms (chunked prefill overlap, concurrent KV-write/weight-read overlap, plan-switch/layer-prefetch overlap) remove transfer stalls, plus an optional KV compression stage for tight memory budgets.

## Results
Evaluated on consumer-grade and datacenter GPUs:
- Time-to-first-token **down 33–77%**.
- Decode latency **down 30–37%**.
- **Up to 4.5×** higher energy efficiency.
- **Up to 8.8×** reduction in memory footprint.

## Relevance to Our Domain
Offloaded inference on consumer/single GPUs is the cheapest tier of our inference portfolio; Norn gives an actionable recipe (profile → plan table → phase-aware overlap) instead of ad-hoc offload flags. Its energy-efficiency results also feed GPU-finops accounting (see TokenJoule). Pairs naturally with ModelLess: Norn governs weight+KV placement within a live deployment, ModelLess governs weight residency across sleep/wake cycles.

## References
- Paper: https://arxiv.org/abs/2611.32295
- Related: cloud-infrastructure/llm-serving/explanation-modelless-multi-tier-serverless-llm-inference.md
- Related: cloud-infrastructure/llm-serving/explanation-aggron-agentic-kv-cache-compression.md
