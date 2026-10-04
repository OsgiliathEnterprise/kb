---
title: MoE-CORE — Coordinated Expert Offloading and Residency for Memory-Constrained
  MoE Inference
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2610.01950
date: 2026-10-04
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# MoE-CORE — Coordinated Expert Offloading and Residency for Memory-Constrained MoE Inference

## Overview

MoE-CORE is a system that coordinates expert offloading and residency to run Mixture-of-Experts (MoE) inference on memory-constrained devices. Sparse expert activation cuts compute, but the *weights* of all experts can still exceed limited device memory; offloading makes inference feasible on a compact AI appliance but puts host-to-device transfers directly in the inference path. MoE-CORE's job is to schedule which experts live where and when they move so that transfer cost does not dominate latency.

## Problem Statement

MoE models activate only a subset of experts per token, reducing compute — yet the full expert weight set can exceed device memory on compact appliances. Naive offloading makes inference possible but exposes host-to-device transfers to the critical path, and existing approaches (e.g., vLLM Prefetch) do not coordinate residency with routing well enough under tight memory caps. The gap: a system that jointly manages *which* experts are resident, *how much* cache each layer gets, and *when* to prefetch — under an explicit device-memory budget.

## Key Contribution

- **Coordinated offloading + residency**: stages complete expert layers in alternating buffers during prefill; during decode it combines nonuniform layer-wise cache capacity, domain-informed initialization, routing-history-aware replacement, and cross-layer prefetching.
- A **main configuration that executes router-selected experts exactly**, plus an optional score-based substitution path for eligible low-score misses (approximate execution when memory is too tight).
- Large measured latency gaps versus vLLM Prefetch under matched output caps on real MoE models.

## Technical Approach

During prefill, complete expert layers are staged into alternating buffers so decode can stream them without stalling. During decode, each layer gets a nonuniform cache capacity (not one-size-fits-all), initialized from domain knowledge; replacement decisions use routing history to keep likely-needed experts resident; and cross-layer prefetching moves upcoming experts ahead of demand. The main path executes exactly the router-selected experts; when memory is exhausted, an optional score-based substitution serves eligible low-score misses approximately rather than blocking on a transfer.

## Results

- Mean time-per-output-token (TPOT) **38.0–44.8 ms** for MoE-CORE vs **1268.9–1269.1 ms** for the evaluated vLLM Prefetch configuration on DeepSeek-V4-Flash-W4A8; on GLM-5.2-W4A8C8, **206.6–220.5 ms vs 5941.5–5941.8 ms** (under 1K/128-token output caps).
- Under an 84 GB NPU-memory cap, the best measured DeepSeek GSM8K configuration reaches **TPOT 21.5 ms** using approximate expert substitution plus multi-token prediction (MTP) at depth 2.

## Relevance to Our Domain

For teams serving large MoE models on memory-constrained accelerators (NPUs, compact appliances), MoE-CORE is a concrete reference design: alternating-buffer prefill staging, nonuniform per-layer cache with routing-history-aware replacement, and cross-layer prefetching — plus an approximate-substitution escape hatch when exact execution doesn't fit. The headline result (orders-of-magnitude lower TPOT than vLLM Prefetch under the same caps) is a useful benchmark for anyone evaluating offloading strategies in LLM serving stacks.

## References

- Paper: https://arxiv.org/abs/2610.01950
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.01950
