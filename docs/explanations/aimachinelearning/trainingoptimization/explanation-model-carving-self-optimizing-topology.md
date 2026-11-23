---
title: 'Model Carving: Training Transformers That Optimize Their Own Topology'
diataxis: Explanation
domain: ai-machine-learning
topic: training-optimization
source: arXiv
source_url: https://arxiv.org/abs/2611.27962
date: 2026-11-23
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- explanations
---
# Model Carving: Training Transformers That Optimize Their Own Topology

**Authors:** Kaden Zheng, Pratyusha Sharma — arXiv:2611.27962 (November 2026)

## Overview
Model Carving collapses architecture choice and weight training into **a single run**: learnable scalar gates on every attention/MLP sublayer let the training loss itself remove components, "freeing" a smaller, heterogeneous network out of the dense one as it trains. The thesis: architecture, like weights, should be learned rather than fixed in advance.

## Problem Statement
Standard Transformers train a fixed, uniform set of attention and MLP sublayers in the same order at every layer, optimizing only the weights inside. This uniformity is convention, not principle — the best architecture for a task may be smaller, non-uniform, and more efficient. Today, architecture design (NAS/pruning/distillation) and training are separate processes.

## Key Contribution
- **Learnable per-sublayer scalar gates** that let the training loss delete the model's own components during training, yielding a heterogeneous final topology.
- Validated at real pre-training scale: standard Transformers **140M → 2.7B** and looped Transformers **140M → 1.3B**.
- At equal training compute, carved models beat dense models trained with up to **1.7× more compute** on validation loss.
- Carved models beat **size-matched** models made by pruning or distillation — for edge deployment, carve during training rather than compress afterwards.
- The advantage grows with scale and transfers to downstream tasks (few-shot evaluation, generation).

## Technical Approach
Every sublayer (attention, MLP) gets a learnable scalar gate. Gradient descent on the training loss drives gates toward zero, removing components; the surviving network is smaller and non-uniform. Because removed sublayers simply stop running, carved models cost up to **34% fewer FLOPs per token** and decode up to **1.6× faster** with no quality cost.

## Results (paper-reported)
- Lower validation loss than dense baselines trained with up to 1.7× the compute.
- Outperforms pruning- and distillation-derived size-matched models.
- Up to 34% fewer FLOPs/token, up to 1.6× faster decoding.

## Relevance to Our Domain
For teams serving or fine-tuning models on constrained hardware, carving is a cheaper path to small models than NAS-style search or post-hoc compression — architecture search folded into the training run you were paying for anyway.

## See Also
- [[MemOnce: A Scalable Memory Architecture for Large Language Models]] (explanation)
- [[IsoMoE: Placement-Invariant Hybrid CPU-GPU MoE Inference with Lossless 12-bit Experts]] (how-to)

## References
- Paper: https://arxiv.org/abs/2611.27962
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27962
