---
title: 'Spool: Low-Latency Streaming Inference for Hybrid Vision-Language Models'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.23228
date: '2026-11-18'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Spool: Low-Latency Streaming Inference for Hybrid Vision-Language Models

## Overview
Visual accessibility agents and robotics need to answer questions about **recent video within a bounded window** (e.g., the last two minutes of frames). Hybrid VLMs — which interleave full-attention layers with linear recurrent layers such as Gated DeltaNet (GDN) — look attractive for this workload, but maintaining a sliding window is expensive in a way attention KV-cache eviction is not: recurrent layers fold **all past frames into a single shared state**, so expiring an old frame normally means re-running the whole window through the backbone. Spool is a training-free framework that makes sliding-window eviction cheap by exploiting the algebraic structure of the recurrent update.

## Problem Statement
In attention layers, removing an expired frame is a per-token KV-cache delete. In linear recurrent layers the state is an aggregate — there is no per-frame entry to delete. Naive windowing therefore forces full replay of the surviving window whenever the oldest frame expires, inflating time-to-first-token (TTFT) for latency-sensitive streaming agents.

## Key Contribution
- **Affine-composition insight**: the recurrent update is affine in the state with input-dependent coefficients, so each frame's effect can be represented as a **state transformation that composes associatively**.
- **Per-frame transformation caching**: Spool caches these transformations and recomposes them as the window advances, dropping expired frames from every recurrent layer's state **without replaying frames through the backbone**.
- **Exactness profile**: removal is exact within each layer; like KV eviction in attention, expired frames can retain residual influence through cached inputs computed by earlier layers.
- **Systems work**: a dedicated data structure and GPU kernels keep caching and composition overhead low.

## Technical Approach
No retraining: Spool sits on top of existing hybrid VLMs. The serving engine stores, per frame, the affine map the GDN-style update applies to the recurrent state; the live state is reconstructed by composing the transformations of frames still inside the window. Because composition is associative, window slides become prefix/suffix recompositions rather than full sequences of forward passes.

## Results
Across **five open-source hybrid VLMs and four video reasoning benchmarks**:
- Lowest **p95 TTFT in all 20 model–benchmark combinations**.
- Geometric-mean reduction of **6.6×** versus the faster of two recent vLLM baselines.
- Average accuracy **improvement of 2.3 percentage points** (eviction-by-replay alternatives are not more accurate).

## Relevance to Our Domain
Hybrid attention + GDN architectures (Qwen3.5/3.6/3.8, Qwen3-Next, Kimi-Linear, GLM-5.3-Flash class models) are becoming the default for long-context and streaming serving; cache systems like LMCache already need dedicated recurrent-state objects for them. Spool shows that **state eviction, not just KV eviction, is the next serving bottleneck** for video/robotic agent products, and that the fix is algebraic (associative state transformations), which any hybrid-aware serving stack will want. Related: [[explanation-velserve-tail-calibrated-scheduling]], [[reference-gemma4-shared-kv-cache-paged-serving]].

## References
- Paper: https://arxiv.org/abs/2611.23228
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23228
