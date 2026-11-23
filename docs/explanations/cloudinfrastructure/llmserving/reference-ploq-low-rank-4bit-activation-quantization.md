---
title: 'PLoQ: A Prompt-Specific Low-Rank Basis for 4-bit Quantization of LLM Activations'
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
# PLoQ: A Prompt-Specific Low-Rank Basis for 4-bit Quantization of LLM Activations

**Authors:** Faraz Tahmasebi, Michael Pellauer, Hyoukjun Kwon, Sitao Huang


## Overview
PLoQ is a prompt-adaptive low-rank decomposition scheme for 4-bit activation quantization in LLM serving. It targets the structural cause of low-bit activation damage — a small number of dominant directions that dictate the quantization range — by extracting those directions **per prompt**, quantizing them separately, and restoring them inside the layer's GEMM, all without modifying the weights.

## Problem Statement
State-of-the-art mixed-precision activation quantization isolates dominant directions in a high-precision subspace using a transformation calibrated **offline** and folded into the weights. That design has two structural limits: (1) the subspace is fixed for all prompts, so each prompt's few *unique* dominant directions stay unprotected; (2) folding into weights is impossible wherever no weight matrix can absorb the transformation.

## Specification
| Aspect | Detail |
|---|---|
| Regime | 4-bit weights, activations, and K/V cache; 1/8 of channels at 8 bits (~4.2 bits/activation average) |
| Core mechanism | Prompt-adaptive low-rank decomposition of activations, applied **before** quantization |
| Basis estimation | From each prompt **during prefill**, then reused throughout decoding |
| Restore path | Dominant components quantized separately and restored within the layer's GEMM |
| Weight modification | **None** — works where weight-folding schemes are ruled out |
| Evaluated models | 6 Llama and Qwen models, 1B–70B parameters |
| Context lengths | Up to 8k tokens (16k on two models) |

## Benchmarks & Overhead
- Outperforms state-of-the-art mixed-precision quantization at the **same bit width** on all six models.
- Recovers **up to 46 %** of the perplexity that the SOTA still loses to 4-bit activations.
- Latency overhead on Llama-3.1-8B at 8k tokens: **+4 % prefill, +8 % decoding**.

## Notes for Practice
- The per-prompt basis is computed once at prefill and reused for the whole decode phase — the cost model is prefill-amortized, which is why decoding overhead stays at 8 %.
- Because nothing is folded into weights, PLoQ is applicable to layers/architectures where weight-absorbable transformations are impossible — the differentiator versus offline-calibrated subspace methods.

## Relevance to Our Domain
Governs memory/quality trade-offs for self-hosted inference: ~4.2-bit average activations with single-digit-percent latency overhead makes 4-bit K/V cache + activations viable for long-context serving on our GPUs. Candidate for the llm-serving benchmark track.

## References
- Paper: https://arxiv.org/abs/2611.27092 (cs.LG, cs.CL, cs.DC, cs.PF; published 2026-11-20; Tahmasebi, Pellauer, Kwon, Huang)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27092
