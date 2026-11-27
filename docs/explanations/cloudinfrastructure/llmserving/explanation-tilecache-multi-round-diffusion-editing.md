---
title: 'TileCache: Serving Multi-Round Diffusion Image Editing with Compressed Activation
  Caches'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.20246
date: '2026-11-19'
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

## Design Details (enriched 2026-11-19)
- **Authors/venues**: Yuyang Tian, Desen Sun, Shuncheng Jie, Sihang Liu (U. Waterloo, Cheriton) + Lishan Yang (George Mason); arXiv v1 2026-11-15 (cs.DC), to be open-sourced on acceptance.
- **Why the cache is the bottleneck** (measured): uncompressed activation cache at 1024×1024/50 steps is **107.4 GB for FLUX.2** and **87.3 GB for Qwen-Image-Edit-2511** per session — a 400 GB host cache holds only 3–4 sessions. Activation reuse cuts FLUX.2 edit latency 83.9→29.1 s (RTX 6000 Ada) and 21.5→10.5 s (H100) from host RAM, but SSD fetches add 6.5–7.3 s of exposed transfer.
- **Streaming two-dimensional compression**: (1) *across denoising steps* — maintain a running sum + a few projections per block, updated incrementally so raw activations are discarded immediately after each step (this is what avoids the >100 GB buffering); (2) *across transformer blocks* — store each block as a residual vs. the reconstructed previous block. Key trick: sums/projections are **linear**, so the residual's statistics come from subtraction — residual activations are never stored. Achieves up to **25× compression** (107 GB → 4.3 GB), which is what lets an edit colocate on an 80 GB H100 alongside a running request. Compressed format stays randomly addressable for masked (tile-aligned) selective decode.
- **Compression-informed scheduler**: placement filters GPUs by remaining memory for activations + cache buffers, estimates incoming completion time and added delay to running requests, gates colocation on a **delay budget τ = 2×** single-request latency; every few minutes it compares slowdown of the edit vs. initial-generation classes and adjusts latency budget/delay penalty to prioritize whichever class is falling behind. Against a baseline *with the same compressed caches*, still +14% arrival rate and **+32% fairness** on 4×H100.
- **Evaluation setup**: FLUX.2 base, distilled FLUX.2, Qwen-Image-Edit; 4×H100, 70% edit-request mix; baseline is KVTC (activation-compression serving); quality via masked-area PSNR on MagicBrush (TileCache beats KVTC by up to +4.0 dB at 4.5× compression, advantage growing with denoising steps); simulator validated against real GPU runs. Host-cache sensitivity: hit rate falls 96%→32% as host cache shrinks 800 GB→50 GB.

## Relevance to Our Domain
Extends our LLM-serving cache literature from autoregressive KV caches to **diffusion activation caches** — same serving principles (compression + cache-aware scheduling + SLO-aware admission) apply to a different artifact. A useful design study for any GPU serving platform that mixes interactive (edit) and cold-start (generation) request classes. Related: [[explanation-callo-invalidated-kv-speculative-decoding]], [[reference-xm-sparse-sparse-attention-serving-scale-up-memory-pools]], [[reference-kvcompass-prefix-cache-discovery]].

## References
- Paper: https://arxiv.org/abs/2611.20246
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.20246
