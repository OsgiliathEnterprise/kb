---
title: Latent Lattice Language Models
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.21608
date: 2026-11-17
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# Latent Lattice Language Models

## Overview

Mainstream ways to add per-token compute are deeper/looped layers and latent reasoning steps; richer residual connections improve information *flow*. This work (NVIDIA-affiliated author team) takes a different axis: increase **computational capacity** — the number of active computational states a model maintains. The **Lattice of Latents** adds per-layer *horizontal* latent streams that recur along time, running alongside the usual vertical residual stream that flows through depth.

## Problem Statement

Scaling per-token computation currently trades off depth (latency), looping (instability), or SSM-style recurrent state (which mostly serves as internal memory for sequence mixing). What is missing is persistent, per-layer state that *actively conditions computation* rather than merely carrying history.

## Key Contribution

- The Lattice of Latents: a set of per-layer horizontal latent streams recurring across tokens, providing **companion computational states that persist across tokens**.
- Unlike hyper-connections/mHC/attention residuals (which add or reroute residual pathways through depth), and unlike hybrid Transformer–SSM recurrent states (internal memory for mixing), the lattice latents **directly condition** the vertical stream's attention, KV-cache writes, MLP computation, and decoding.
- Establishes persistent per-layer state as a **complementary scaling axis**, orthogonal to existing residual-stream enhancements.

## Results

Transformers trained on 20B FineWeb-Edu tokens:

- 406M-parameter Lattice model: validation perplexity **15.41 → 14.40** vs a parameter-matched Transformer.
- Composes with prior enhancements: base 15.41, Transformer + hyper-connections + input residuals 14.22, **+ Lattice → 13.61**.
- On Gated DeltaNet, Mamba-2, Triadic GDN and GDN-Mamba-2 hybrids it improves perplexity at every tested native state size; Lattice-GDN / Lattice-Triadic-GDN beat pure baselines with **4× larger native states**.

## Relevance to Our Domain

A concrete new axis in the architecture design space our team tracks (transformers, hybrids, MoE). Two practical observations: (1) the lattice stacks with known residual enhancements, so it is an increment, not a replacement; (2) smaller-state hybrids + lattice beating 4×-state baselines hints at cheaper long-context serving paths — relevant to our serving-cost workloads.

## References

- Paper: https://arxiv.org/abs/2611.21608 (cs.LG, cs.AI, cs.CL — Duggal, Wu, Freeman, Torralba, Zhang, Shechtman)
- Project page: https://shivamduggal4.github.io/latent-lattice-language-model/
- Related: `explanation-positional-embeddings-rope-nope-modern-llms.md`, `explanation-cnn-rnn-vs-transformer-for-sequential-data.md`
