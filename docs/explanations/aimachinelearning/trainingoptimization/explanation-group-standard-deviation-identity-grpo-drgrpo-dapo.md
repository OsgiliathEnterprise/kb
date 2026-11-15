---
title: The Group-Standard-Deviation Identity — GRPO, Dr. GRPO and DAPO Are Three Settings
  of One Dial
diataxis: Explanation
domain: ai-machine-learning
topic: training-optimization
source: arXiv
source_url: https://arxiv.org/abs/2607.00152
date: 2026-11-15
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- explanations
---
# The Group-Standard-Deviation Identity — GRPO, Dr. GRPO and DAPO Are Three Settings of One Dial

## Overview
Verifiable-reward RL for LLM reasoning is dominated by three methods marketed as three different fixes: GRPO, Dr. GRPO ("GRPO Done Right") and DAPO. This paper shows they are one knob in three positions. All three operate on a single quantity — the **standard deviation of the correctness marks within a prompt's sampled group**. Understanding that number is not a normalization footnote; it is where the learning signal lives.

## Problem Statement
When a model is trained with RLVR, it samples many answers per prompt and an automatic checker marks each right or wrong. The group's pass/fail spread measures *disagreement*: it is maximal at a 50/50 split and zero when the group is unanimous. Each method treats this number differently — GRPO **divides** the advantage by it, Dr. GRPO **drops** the division, DAPO **discards** zero-variance groups — and the literature presents these as unrelated design choices, obscuring that they are three settings of the same dial.

## Key Contributions
- **Unification theorem**: GRPO / Dr. GRPO / DAPO are three operations on one scalar (the group standard deviation) — not three algorithms.
- **The group-standard-deviation identity**: for binary (right-or-wrong) rewards, the group disagreement term is *exactly* the magnitude of the training update. A split group teaches the most; a unanimous group teaches nothing and contributes zero.
- **Curriculum consequences**: the identity dictates which prompts deserve sampling weight and how many samples each prompt needs — hardest-value prompts are the mixed-outcome ones.
- **Empirical confirmation** on a large real difficulty dataset (Big-Math) and in a controlled training run, validating that the "harmless normalization step" is the decisive control surface.

## Technical Approach
Reformulate the three loss functions around the group std of verifier marks: identify the single term each method manipulates (divide / no-divide / filter), prove equivalence-class behaviour under binary reward, and derive the update-magnitude identity analytically. Validation is on Big-Math difficulty strata plus a matched controlled training run, examining where gradient mass is actually allocated.

## Results
- Analytic identity holds for 0/1 rewards: update size ∝ group std ⇒ unanimous groups are silent.
- Big-Math difficulty analysis matches the theory's predicted weighting of prompts by outcome disagreement.
- Controlled training run confirms that the dial, not the framing trick, governs where learning happens.

## Relevance
For anyone tuning RLVR pipelines, this collapses three hyperparameter debates into one question: *how do you treat zero-variance groups?* Practical corollaries — dynamic sampling budgets should target prompts near 50% pass rate, and dividing-vs-not-dividing by group std is a choice about update magnitude, not numerical hygiene.

## Sources
- arXiv: https://arxiv.org/abs/2607.00152
- Code and data: https://github.com/bay-yearick-lab/grpo-standard-deviation-identity
- Related: [[howto-negative-only-policy-optimization-one-sided-rewards]]
