---
title: Sequential Anytime Valid Tests for Efficient Inference-Time Alignment
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.26413
date: 2026-11-21
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Sequential Anytime Valid Tests for Efficient Inference-Time Alignment

## Overview
Best-of-N (BoN) sampling with a reward model improves LLM outputs but applies the **same fixed budget to every prompt**, even though the computation prompts require varies widely. Heuristic early stopping has no statistical control over early-stopping errors. This paper (arXiv:2611.26413, Singh & Ray Chowdhury) derives **e-RWSC** — an **anytime-valid stopping rule** for BoN that takes an error tolerance α as input and halts only once an answer is **certified to hold a majority (θ_a > 1/2) under the generator's distribution**.

## Problem Statement
Fixed-N BoN over-samples easy prompts and cannot formally stop when evidence is sufficient. The paper's own baseline, **SPRT-RWSC** (Wald's SPRT applied to reward-weighted answer clusters), performs well empirically but **its guarantee fails**: the leading answer shifts during sampling and the run is continuously monitored, breaking Wald's fixed-alternative setup.

## Key Contribution
- **Reward-weighted self-consistency (RWSC) score**: candidates are aggregated by final answer into clusters, scored by the reward model — the scoring rule, not the test, drives speed.
- **e-RWSC**: for every answer the policy produces, maintain a **betting supermartingale (e-process)**; the RWSC scores drive the bets. Stop when a bet crosses the boundary set by α. This bounds the probability of **ever** certifying a non-dominant answer by α, **uniformly over time and across all answers** (anytime-valid).
- **Bounded bets**: the bet is clipped to stay in the admissible range [0, c/p†], keeping the supermartingale property under noisy/heavy-tailed rewards.
- **Cost scaling**: certifying a true dominant answer with margin θ_a⋆ takes **O(log(1/α) / d_KL(θ_a⋆ ‖ 1/2))** samples. Experiments across several LLMs, datasets, and reward models confirm the predicted 1/d_KL cost scaling and show e-RWSC achieving **higher accuracy at lower average token cost than the CITE baseline**.

## Why It Matters (Explanation)
Test-time compute is a first-class serving cost. e-RWSC turns the token budget into a **risk parameter**: the serving layer chooses α (how often it may certify a wrong answer) instead of guessing N. Crucially, validity is decoupled from scoring — any reward weighting accelerates certification without affecting the error bound. This maps directly onto per-request token budgets, latency/quality SLAs, and autoscaling verifier calls in LLM serving.

## Limitations
- Validity assumes exchangeable (i.i.d.-decoded) samples; prompt drift mid-run breaks the supermartingale.
- When no answer is near-certain (θ → 1/2), d_KL(θ‖1/2) → 0 and certification cost explodes — the method degrades to full N sampling on genuinely ambiguous prompts.

## Relevance to Our Domain
Concrete template for replacing fixed hyperparameters (N) with statistically valid stopping rules in agent pipelines: multi-sample answer selection, RAG answer voting, verifier-ensemble gating.

## Provenance & verification
Corrected 2026-11-21 after audit: authors corrected from "Xu & Wang" to Singh & Ray Chowdhury; "e-RWSC" expanded correctly as e-process over **Reward-Weighted Self-Consistency** (the previous "Ratio-Weighted Sequential Confidence" expansion was wrong); the "six benchmarks / −45% tokens" figure is absent from the paper and removed (kept: qualitative accuracy/cost gains vs CITE baseline + O(log(1/α)/d_KL) scaling, all verified in abstract and v1 PDF; bet clipping verified in v1 PDF).

## References
- Paper: https://arxiv.org/abs/2611.26413
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26413
- Related: e-values & confidence sequences (Waudby-Smith & Ramdas), Best-of-N alignment studies, CITE baseline
