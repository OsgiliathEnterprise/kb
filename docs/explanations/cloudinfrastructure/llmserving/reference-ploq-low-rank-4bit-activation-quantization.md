---
title: 'PLoQ: Near-Full-Precision Low-Rank Corrected 4-bit Activation Quantization
  for LLM Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.27092
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# PLoQ: Near-Full-Precision Low-Rank Corrected 4-bit Activation Quantization for LLM Serving

## Overview
Reference for PLoQ, a W4A4 (4-bit weights **and** 4-bit activations) post-training quantization scheme for LLM serving built around the finding that **activation quantization error is the dominant performance bottleneck** — weight quantization is the easier half. PLoQ keeps the base quantizer simple and adds a rank-corrected compensation layer.

## Problem Statement
Existing W4A4 schemes compensate *jointly* for weight and activation error, entangling two very different error sources. Low-bit activation quantization is intrinsically harder: activations exhibit **cross-layer activation drift** and **per-group outlier amplification**, which jointly cause severe precision loss that joint compensation under-parameterizes.

## Specification
| Aspect | Detail |
|---|---|
| Regime | Post-training quantization, W4A4 (4-bit weights + 4-bit activations) |
| Base quantizer | Asymmetric Uniform Quantization (AUQ) — deliberately simple |
| Error treatment | Activations-only compensation (weights left to the base quantizer) |
| Compensation layer | Low-rank correction; rank adapts to the difficulty of each linear projection |
| Orthogonality | **GPTQ** may be stacked on top for the weight side; PLoQ targets activation error only |
| Target phenomena | Cross-layer activation drift, per-group outlier amplification |
| Memory footprint | Near-full-precision quality at 4-bit weights and activations |

## Benchmarks
Evaluated on **Mistral-7B, Llama-3-8B, Qwen3-8B** across **7 downstream tasks**. Reported gains over state-of-the-art baselines:
- **+6.7 points** zero-shot average accuracy
- **+8.2 points** GSM8K
- **+4.2 points** MMLU

while retaining the memory savings of 4-bit weights and activations.

## Notes for Practice
- The rank-adaptive allocation is the key knob: hard projections (large activation error) get higher correction rank; easy ones stay cheap.
- Because it is activation-only, PLoQ composes with weight-side PTQ (GPTQ) rather than competing with it — relevant when comparing against joint-compensation baselines like OmniQuant-style schemes.

## Relevance to Our Domain
Governs memory/quality trade-offs for self-hosted inference: W4A4 with near-full precision would roughly halve activation memory versus W4A16 schemes on our serving GPUs. Candidate for evaluation in our llm-serving benchmark track.

## References
- Paper: https://arxiv.org/abs/2611.27092 (cs.LG, cs.AI, 2026-11-26)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27092
- Related: explanation-llm-serving-quantization.md, reference-llm-serving-benchmarks.md
