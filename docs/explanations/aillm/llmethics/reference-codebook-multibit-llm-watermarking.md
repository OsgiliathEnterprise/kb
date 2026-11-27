---
title: Codebook Multi-bit LLM Watermarking (Look It Up) — Short-Text Attribution Scheme
diataxis: Explanation
domain: AI-LLM
topic: LLM-Ethics
source: arXiv
source_url: https://arxiv.org/abs/2611.16890
date: 2026-11-26
keywords:
- knowledge-base
- LLM-Ethics
- AI-LLM
- explanations
---
# Codebook Multi-bit LLM Watermarking (Look It Up) — Short-Text Attribution Scheme

## Paper Metadata

- **Full title**: Look It Up: Multi-bit LLM Watermarking via Codebook Search
- **Authors**: Jarosław Janas, Paweł Morawiecki, Josef Pieprzyk — Institute of Computer Science, Polish Academy of Sciences (Warsaw); second affiliation block on the title page: CSIRO, Marsfield, Australia (Josef Pieprzyk)
- **Submitted**: 2026-11-12 (v1) · cs.CR, cross-listed cs.AI, cs.CL · 16 pages, 8 figures, 6 tables
- **Venue**: submitted to IEEE Transactions on Information Forensics and Security (TIFS)
- **Code**: https://github.com/jaroslawjanas/llmw-codebook

## Overview

"Look It Up" proposes a watermarking scheme for attributing *short* LLM-generated texts to a specific source. Instead of embedding an n-bit payload directly, it maps the payload to a longer u-bit codeword from a precomputed secret codebook, embeds that codeword during generation via token-level logit biasing, and recovers it at extraction by matching the received bit sequence to the nearest codeword under Hamming (or Levenshtein) distance. The codebook lookup absorbs transmission noise, which is exactly what makes short generations decodable.

## Problem Statement

Multi-bit watermarking methods need long generations or expensive decoding to recover payloads reliably, making them impractical for short-form attribution (titles, snippets, chat replies). Short texts carry few watermarkable tokens, so per-bit decisions are noisy and direct payload decoding fails.

**Baseline contrast** (from the paper's Table I comparison, match rate = full hidden message correctly extracted, Llama 2 7B, 24-bit embedded message): prior direct-payload schemes degrade sharply with payload size in short texts — e.g. Yoo et al.'s watermark recovered a 16-bit message from a short text only ~74% of the time, dropping to ~30% at 24-bit payloads. The codebook lookup is what closes this gap at ~200-token generations.

## Scheme Specification

| Parameter / choice | Value / option | Notes |
|---|---|---|
| Payload sizes | 16–24 bits | Near-perfect recovery at 16–24 bits on ~200-token generations |
| Short generation | ~127 tokens | Strong performance on base models; weaker on instruction-tuned models |
| Embedding | Token-level logit biasing | Applied during generation |
| Codebook | Precomputed, secret, n-bit → u-bit expansion | Nearest-codeword match at extraction |
| Distance metrics | Hamming; Levenshtein | Levenshtein variant resists deletions & light paraphrasing |
| BCH variant | Algebraic code, no codebook storage | Generally lower robustness than stored codebook |
| Analyzed properties | Collision probability, codeword separation, extraction time, tokenization consistency, text quality | Paper's evaluation axes |

## Known Limitations

- **Instruction-tuned models + very short texts**: low-entropy output distributions reduce embedding reliability (the logit bias cannot move already-certain tokens).
- **Insertions and strong rewrites remain hard**; deletions and light paraphrase are handled by the Levenshtein decoder.
- Requires securing codebook distribution (except the BCH variant, which trades that away for robustness).

## Relevance to Our Domain

Provenance and attribution are prerequisites for any AI-content governance pipeline. This note is the lookup table for evaluating short-text watermarking: expected payload capacity at given token budgets, which decoder to pick for an expected edit channel, and the failure regimes (templated/low-entropy outputs) that should disqualify watermarking as a sole control.

## References

- Paper: https://arxiv.org/abs/2611.16890
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16890
