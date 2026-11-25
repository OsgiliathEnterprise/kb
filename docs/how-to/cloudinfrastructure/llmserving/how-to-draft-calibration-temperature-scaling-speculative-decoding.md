---
title: 'Draft Calibration for Speculative Decoding: Accelerating LLM Serving by Matching
  Draft and Target Distributions'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.33111
date: '2026-11-25'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Draft Calibration for Speculative Decoding: Accelerating LLM Serving by Matching Draft and Target Distributions

## Overview
Speculative decoding's speedup lives or dies on the draft acceptance rate, which is governed by the total-variation gap between the draft distribution *q* and the target distribution *p*. This paper observes that open-source draft models are systematically **underconfident** relative to their targets — they rank the top token correctly but assign it too little probability — and shows that a trivial post-hoc fix, temperature scaling applied to the draft distribution only, lifts mean acceptance length by up to ~10% at essentially zero serving cost.

## Problem Statement
Draft models are trained to imitate the target model, but even when they learn the top candidate token, their probability mass is flatter than the target's. Because acceptance in speculative decoding depends on the ℓ₁ distance ‖p − q‖₁, this consistent miscalibration directly throttles the acceptance rate — and hence the throughput gain — even when the draft's rankings are good.

## Key Contribution
- Empirical diagnosis: community open-source draft models are **correct but underconfident**, i.e., a systematic (not random) distribution mismatch with the target.
- A post-hoc calibration study for speculative decoding: standard temperature scaling vs. token-wise calibration and other general calibrators.
- Result: plain **temperature scaling on the draft** yields up to ~10% longer accepted drafts with almost no added compute, verified end-to-end with throughput analysis.

## How-to: Calibrate a Draft Model
1. Pick your (target, draft) pair used in a speculative-decoding server.
2. Verify the mismatch hypothesis before tuning: compare draft vs. target probabilities for tokens the draft ranks first. If the draft is consistently underconfident on tokens it gets "right", calibration will help.
3. Apply a **single scalar temperature** to the draft model's logits (q ← softmax(logits / T)) — do **not** touch the target; the target stays the verifier and correctness is preserved because verification still samples against *p*.
4. Tune T on a held-out task mix by measuring **mean acceptance length** (tokens accepted per verification step), not perplexity.
5. Confirm the acceptance-length gain converts into wall-clock throughput in your server (acceptance length gains translate nearly linearly when verification is not the bottleneck).
6. Optional: explore richer per-token calibrators for additional headroom — the paper's analysis indicates more room beyond scalar temperature, at the price of extra state/compute.

## Results
- Up to ~10% improvement in acceptance length from temperature scaling across tasks, with negligible per-step overhead.
- Throughput analysis confirms the acceptance-length gain converts into serving efficiency.
- Broader calibration families show further upside beyond the single-temperature recipe.

## Relevance to Our Domain
Draft-model quality is the dominant lever in speculative decoding deployments (see the KB's Medusa, hPack and prefill-only speculative decoding notes). This is a rare free lunch: a one-line inference change on the draft side with double-digit acceptance gains — worth adding to any vLLM/SGLang-style serving checklist.

## References
- Paper: https://arxiv.org/abs/2611.33111
- Related: [[how-to-prefill-only-speculative-decoding-throughput]], [[explanation-medusa-parallel-decoding-heads-7b]], [[explanation-hpack-hybrid-draft-parallel-verification]]
