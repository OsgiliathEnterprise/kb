---
title: When Both Sides Adapt — User Adaptivity and Prompt Endogeneity in LLM Evaluation
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.17239
date: 2026-11-16
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# When Both Sides Adapt: The Challenges of Evaluating Interactive LLM Systems

> Corrected 2026-11-16 by KB Zookeeper: the first intake version ("proposer/solver ELO co-adaptive evaluation, Jun-Ping Jiang et al., University of Tokyo/Tohoku") did not match arXiv:2611.17239 and was replaced with facts verified against the arXiv abstract page.

## Overview

This paper (Hannah Li, Columbia Business School; arXiv:2611.17239, 12 Nov 2026, **stat.ME** — a statistics/methodology paper, not an adversarial-benchmark systems paper) studies **user adaptivity and prompt endogeneity** in interactive LLM systems: users observe model responses and then change their prompting strategy and the type/difficulty of subsequent tasks — so *the model's responses influence the prompts on which the model is later evaluated*.

## Problem Statement

In live deployments, evaluation data is not exogenous. Offline benchmarks assume a fixed prompt distribution; live A/B tests let users adapt to each arm. Comparing models across these settings silently compares different quantities.

## Key Contribution

- **Two estimands**: the **common-distribution effect** (performance of models on the *same* prompt distribution) vs the **induced-distribution effect** (each model judged on the prompt distribution its own behaviour induces).
- **Offline benchmark evaluation and live A/B testing target different estimands**: standard difference-in-means estimators converge to the common-distribution and induced-distribution effects, respectively.
- **Ranking reversals**: the two comparisons can rank models differently and change deployment recommendations; the paper characterises when reversals occur and gives a **sufficient condition guaranteeing agreement** — a practical heuristic for judging whether offline evaluation reproduces the live-experiment decision.
- In a **stylized linear interaction model**, user adaptivity **increases estimation variance**.
- Unification: adaptivity is a common mechanism behind familiar evaluation pathologies such as **reward hacking and novelty effects**.

## Relevance to Our Domain

Foundational for designing model-selection and regression pipelines: offline eval and production A/B can legitimately disagree, and neither is "wrong" — they measure different estimands. The agreement condition gives a cheap pre-check before trusting offline decisions, and variance inflation argues for larger live experiments once users adapt.

## Deep Dive: The Two-Turn Ranking Reversal Example

The paper's canonical worked example (email-writing assistant, two turns, routine vs. difficult tasks) makes the reversal concrete:

| Metric | Model M0 | Model M1 | Outcome |
|---|---|---|---|
| Turn 1 baseline (routine) | 90% usable (10% excellent) | 90% usable (80% excellent) | Equal basic success; M1 better tone |
| Turn 2 induced workload | 80 routine / 10 difficult | 10 routine / 80 difficult | Users trust M1 with complex tasks |
| Turn 2 observed success | 83.3% usable | 72.2% usable | M0 faces easy prompts, M1 hard ones |
| **Aggregate A/B result** | **86.65%** | **81.10%** | Live A/B selects M0 despite lower capability |
| Common-distribution benchmark | 30% on difficult tasks | 70% on difficult tasks | Offline eval correctly selects M1 |

M1 dominates or ties M0 on *every* task tier, yet because its better turn-1 completions cause 80% of its users to escalate to difficult tasks (vs. 10% for M0), the compositional shift penalizes the superior model in aggregate live metrics. This is a classic Simpson's-paradox-style failure of classical experimental-design assumptions in interactive settings.

## Practical Implications for Evaluation Pipelines

- **Never treat offline and live results as estimating the same quantity.** Log which estimand each pipeline reports.
- **Stratify live A/B metrics by task type/difficulty** before drawing model-preference conclusions — aggregate satisfaction conflates capability with induced task mix.
- **Budget larger live experiments once users adapt** (variance inflation in the stylized linear interaction model).
- Use the paper's **sufficient condition for agreement** as a cheap pre-check: if it holds, offline evaluation reproduces the live decision and the live test may be unnecessary.

## References

- Paper: https://arxiv.org/abs/2611.17239
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17239
- CASRAI editorial summary (worked example and table above): https://casrai.org/news/adaptive-user-evaluation-interactive-llm-systems-2026
