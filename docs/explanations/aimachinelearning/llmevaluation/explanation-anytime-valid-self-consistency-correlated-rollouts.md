---
title: 'Realized versus Population Reliability: Anytime-Valid Self-Consistency Certification
  under Correlated Reasoning'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.26592
date: '2026-11-21'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Realized vs Population Reliability: Anytime-Valid Self-Consistency Certification under Correlated Reasoning

## Overview
Agbeyegbe & Agbeyegbe (arXiv:2611.26592, submitted 2026-11-19) deliver a statistical warning for self-consistency based LLM evaluation: the anytime-valid **e-process** certification for "model answers π* with probability at least p" assumes rollouts are **conditionally independent**, and real rollouts are not — they share reasoning prefixes and vary across prompts. Once correlation is modelled, the single-unit certification rule is secretly testing a *different*, weaker hypothesis than the one practitioners think they are buying.

## Problem Statement
Self-consistency: draw multiple rollouts from one prompt and check whether the modal answer hits the oracle π*. Anytime-valid e-processes let you stop early with Type-I control — but only under conditional independence of rollouts given model and prompt. Two realistic violations: rollouts from the same prompt share prefixes, and pass probability varies across prompts.

## Method & Key Concepts
- Models rollouts via **random-effects / intraclass correlation**: a latent per-prompt pass probability plus an **exchangeable equal-correlation increments representation with correlation ρ**.
- Splits the certification null hypothesis into two:
  - **Realized null** — about the specific rollouts actually drawn;
  - **Population null** — about the model's true per-prompt pass probability.
  The two **coincide only at ρ = 0**.
- A betting e-process remains **anytime-valid for the realized null**, but for the population null its crossing probability **inflates up to an asymptote π as the number of correlated rollouts grows**.
- Derives an **effective sample size that saturates at 1/ρ**: past that point, extra rollouts on the same prompt buy nothing for population claims.
- Restores validity with a **prompt-level e-process**; under a fixed rollout budget, the **optimal allocation is a single rollout on as many prompts as possible**.

## Empirical Results
- Simulation study over (π, p, ρ) configurations shows population-level miscoverage growing with ρ, matching theory.
- **Claude Haiku 4.5 rollouts**:
  - **GSM8K**: ρ̂ = 0.435, mean effect θ̂ = +0.96 — the correlation-induced gap stays dormant (effect far from threshold).
  - **AIME**: ρ̂ = 0.480, θ̂ = −0.15 (near-threshold) — the **single-unit rule crosses on 24% of prompts at nominal ε = 0.05**, while the prompt-level procedure achieves **0.00**.

## Practical Rules for Our Pipelines
1. Correlated within-prompt rollouts give **~1/ρ bits of real evidence** for population claims — N=8 rollouts at ρ≈0.5 are worth about 2 independent samples.
2. When certifying "accuracy ≥ p" claims: **spread rollouts across prompts (1 per prompt)** rather than stacking them on a few prompts.
3. The danger zone is **near-threshold regimes** (θ̂ close to the boundary): far from threshold, the flawed rule looks fine — failures appear exactly where decisions are made.

## Relevance to Our Domain
This is a methodology correction for every "self-consistency / majority-vote reliability" pattern in our agent-evaluation and LLM-judge notes (cf. judge-scoring topology, panel reliability work): anytime-valid claims must specify *which null* they control, and budget allocation across prompts beats depth within a prompt.

## References
- Paper: https://arxiv.org/abs/2611.26592
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26592
- Related: [[reference-llm-judge-scoring-topology]], [[explanation-verification-transport-llm-agent-evaluation]]
