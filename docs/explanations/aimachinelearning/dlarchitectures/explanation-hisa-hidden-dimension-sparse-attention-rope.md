---
title: 'HiSA: Sparsifying the Hidden Dimension of RoPE Attention in LLMs'
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.26363
date: 2026-11-20
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# HiSA: Sparsifying the Hidden Dimension of RoPE Attention in LLMs

## Overview
Standard attention scores every query against every key with a complete dot product over the full hidden dimension. HiSA (Hidden Sparse Attention) asks whether that dot product must be computed completely at all, and shows it does not: by omitting entire feature-dimension slices of the query–key product according to a static, parameter-free rule derived from token positions and the RoPE rotation structure, LLMs trained from scratch match or *beat* dense attention while computing only about one third of the query–key products.

## Problem Statement
Sparse attention research overwhelmingly sparsifies over *tokens* (which keys a query attends to). The orthogonal axis — sparsity in the *hidden (feature) dimension* of the dot product itself — is far less explored, even though RoPE already rotates feature pairs position-dependently, suggesting some slices may carry little signal for particular query–key position combinations.

## Key Contribution
- A static, parameter-free sparsity rule on the feature axis of the QK dot product, grounded in the structure of rotary position embeddings: keys and queries decompose into parts that can be omitted per position pair.
- From-scratch training evidence that the partial dot product does not hurt — it *improves* performance over the complete product at ~33% of the QK compute.
- Inference benefits: faster decoding and a smaller memory footprint.
- An extension to FlashAttention-3 kernels for both training and inference.
- A motivating analysis: dense attention is found to *learn to suppress* exactly the score components that HiSA drops — the redundancy is already latent in trained models.
- Code: https://github.com/ambroise-b/hisa

## Technical Approach
Query and key projections stay intact; only the dot-product evaluation changes. Using RoPE's pairwise-rotation structure, the authors partition feature dimensions into components whose contribution depends on the query/key position offset, and skip components deemed negligible by a fixed positional rule. Because the pattern is static and parameter-free, no learned mask, router, or top-k selection is needed, which keeps the kernel regular and compatible with FlashAttention-style tiling.

## Results
- ~1/3 of query–key products computed during training, with equal or better perplexity/performance vs dense attention.
- Improved decode speed and reduced memory at inference.
- FlashAttention-3 kernel support for train and inference paths.

## Relevance to Our Domain
Feature-dimension sparsity is a genuinely new axis relative to our existing sparse-attention notes (token-level: DEXAttention; KV-cache: MosaicKV). It pairs directly with [[explanation-positional-embeddings-rope-nope-modern-llms]] — HiSA's rule only exists *because* of RoPE's structure — and is a candidate inference-cost lever alongside KV compression for our llm-serving coverage.

## References
- Paper: https://arxiv.org/abs/2611.26363
- Code: https://github.com/ambroise-b/hisa
- Related: [[explanation-positional-embeddings-rope-nope-modern-llms]], [[explanation-dexattention-distributed-sparse-attention]]
