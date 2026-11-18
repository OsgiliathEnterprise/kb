---
title: 'TileCache: Serving Multi-Round Diffusion Image Editing with Compressed Activation
  Caches'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.20246
date: '2026-11-18'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# TileCache: Serving Multi-Round Diffusion Image Editing with Compressed Activation Caches

## Overview
Tian, Sun, Jie et al. tackle serving **multi-round diffusion image editing**, where users iteratively refine an image and each round can reuse intermediate activations from previous rounds. Reuse cuts compute but retaining activations across rounds brings heavy memory and bandwidth costs. TileCache is a serving system that compresses the reusable activations *and* schedules around the asymmetry between cheap edits and expensive initial generations, sustaining **>2× the request arrival rate at 90% SLO attainment** over the state-of-the-art baseline.

## Problem Statement
Three coupled challenges:
1. **Cache construction**: compressing only after an edit finishes means buffering **>100 GB of activations per request** in the meantime — the compression step itself becomes the bottleneck.
2. **Selective reuse**: future masked edits need only a *subset* of cached activations, so the compressed format must remain randomly addressable.
3. **Scheduling asymmetry**: cached edits run much faster than initial generations, so naive queue policies starve one class or the other.

## Key Contribution
- **Compression-informed serving**: compress activations incrementally during generation rather than in one post-hoc pass, keeping the per-request buffering footprint manageable while preserving selective (tile/mask-aligned) decode for masked edits.
- A **joint scheduler** that balances fast edit requests against slow initial generations to protect SLOs for both classes.
- End-to-end evaluation vs the state-of-the-art image-editing serving baseline with image quality preserved.

## Results
- **>2×** sustainable request arrival rate at 90% SLO attainment.
- Edits complete **2.4–4.5×** faster; initial generations **1.3–2.2×** faster than baseline.
- No measurable image-quality loss from activation compression.

## Relevance to Our Domain
Extends our LLM-serving cache literature from autoregressive KV caches to **diffusion activation caches** — same serving principles (compression + cache-aware scheduling + SLO-aware admission) apply to a different artifact. A useful design study for any GPU serving platform that mixes interactive (edit) and cold-start (generation) request classes. Related: [[explanation-callo-invalidated-kv-speculative-decoding]], [[reference-xm-sparse-sparse-attention-serving-scale-up-memory-pools]], [[reference-kvcompass-prefix-cache-discovery]].

## References
- Paper: https://arxiv.org/abs/2611.20246
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.20246
