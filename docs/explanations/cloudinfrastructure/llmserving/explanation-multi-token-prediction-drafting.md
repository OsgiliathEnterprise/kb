---
title: Efficient and Robust Drafting with Multi-Token Prediction
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.25813
date: 2026-11-23
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Efficient and Robust Drafting with Multi-Token Prediction

## Overview
This paper presents G-MTP, a heavily optimized Multi-Token Prediction drafting architecture that bolts a single shared drafting head onto an existing backbone LLM to accelerate speculative decoding. Its three architectural ideas target the actual cost centers of drafting — semantic anchoring, prefill/KV overhead, and full-vocabulary projection — rather than inventing a new drafting paradigm.

## Problem Statement
Speculative decoding splits generation into a cheap drafting phase and a parallel verification phase, so the drafter must simultaneously be lightweight and accurate enough to track the target model's predictions. Existing drafters either duplicate the backbone's compute (prefill, full-vocabulary decoding) or lose accuracy, especially under domain shift.

## Key Contribution
- **Single shared drafting head** extending an existing backbone LLM, avoiding a separate draft model.
- Three core optimizations:
  1. **Target activation injection** — the drafter is anchored on the target model's activations to ground its semantic planning.
  2. **Zero-copy KV-cache cross-attention** — drafts attend over the target's KV cache without copying, bypassing prefill compute and reducing memory overhead.
  3. **Clustered vocabulary projection** — replaces full-vocabulary decoding with an efficient clustered projection, cutting the dominant cost of draft token scoring.
- **Parameter-efficient fine-tuning recipes** that keep the drafter aligned with the backbone under domain shift, needing up to 1.83× fewer target forward passes than fine-tuning the backbone alone.

## Technical Approach
The design principle is cost displacement: every component that would normally recompute something the target model already computed (prefill KVs, activations, full-vocab logits) is replaced by a reuse or approximation mechanism. Zero-copy cross-attention over the shared KV cache means drafting adds almost no prefill cost; the clustered projection makes per-token draft scoring cheap without collapsing acceptance rates.

## Results
Evaluated on the Gemma 4 model family:
- Server-side: out-of-the-box speedups up to **3.1×**.
- On-device / memory-constrained: up to **2.3× on H100** and **2.2× on a smartphone GPU** for smaller models.
- Domain adaptation: PEFT recipes align drafter and backbone with 1.83× fewer target forward passes than backbone-only tuning.

## Relevance to Our Domain
Complements the KB's speculative-decoding line (NarrowSpec, SpecSearch, Callo) from the drafter-architecture angle: the concrete takeaway for serving stacks is that drafting cost concentrates in prefill re-computation and vocabulary projection, and both can be eliminated by reusing the target's own KV/activations. The PEFT alignment recipes matter for production serving where domain shift erodes draft acceptance over time.

## References
- Paper: https://arxiv.org/abs/2611.25813
- Related: [[explanation-narrowspec-narrow-draft-width-speculative-decoding]], [[explanation-specsearch-hardware-aware-speculative-decoding]]
