---
title: 'NarrowSpec: Draft Hidden Width Need Not Match the Target in Speculative Decoding'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.23835
date: 2026-11-19
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# NarrowSpec: Draft Hidden Width Need Not Match the Target in Speculative Decoding

## Overview
Speculative decoding pairs a cheap draft model with one verification pass of the target model, and the emerging family of *hidden-state readers* (DFlash, EAGLE-3) copies the target's hidden width into the drafter. This paper (arXiv:2611.23835) demonstrates that this inheritance is unnecessary: the draft's **entire residual stream can run at ½ or ¼ of the target's width** while largely preserving token acceptance, yielding end-to-end decoding speedups with no configuration where the narrow draft loses.

## Problem Statement
Drafter-side computation (its residual stream, projections, and vocabulary mapping) is pure overhead in speculative decoding — the target's single verification pass is what guarantees output quality. Existing hidden-state-reading drafters pay for a full-width stream "because the target is full width", wasting the one place where shrinking is free.

## Key Contribution
- **Width decoupling**: the draft residual stream width is an independent design axis; half or quarter width is sufficient for high acceptance rates.
- **Fused output adapter**: when the drafter borrows the target's vocabulary projection (as DFlash does), the trained output adapter algebraically folds into that borrowed projection, producing a *single narrower* projection whose logits are unchanged up to floating-point rounding.
- **Real-system validation**: two drafter families (DFlash, EAGLE-3) × two quantized targets — Qwen3-8B (NVFP4) and GPT-OSS-20B (MXFP4) — served in SGLang on a B200 and a DGX Spark (GB10).

## Technical Approach
Train the drafter with a narrowed residual stream, then at serving time collapse the narrow-to-vocab adapter into the target's shared embedding/vocabulary projection. The result is less memory traffic and fewer FLOPs per draft step while the verification semantics of speculative decoding stay exactly intact.

## Results
| Setting | B200 | DGX Spark (GB10) |
|---|---|---|
| Batch 1, temp 0 | 1.06–1.12× | 1.13–1.44× |
| Batch 32 → max fit | up to 1.21× | up to 1.21× |

Crucially, **no narrow draft is slower than its full-width counterpart** — the change is a free-or-better win across batch sizes.

## Relevance to Our Domain
Complements our speculative-decoding coverage (SpecSearch's hardware-aware strategy selection, Callo's invalidated-KV drafting): NarrowSpec shrinks the *drafter architecture* itself rather than the scheduling policy. The disproportionate GB10 (DGX Spark) gains — up to 1.44× — make this directly useful for desktop/edge inference clusters where draft-side memory bandwidth is the bottleneck, and it pairs naturally with NVFP4/MXFP4 target deployments.

## References
- Paper: https://arxiv.org/abs/2611.23835
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23835
- Related: [[explanation-specsearch-hardware-aware-speculative-decoding]], [[explanation-callo-invalidated-kv-speculative-decoding]]
