---
title: RL Can Only Reinforce What It Sees Succeed — Outcome-Reward RL Discovery Threshold
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.26084
date: 2026-11-21
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# RL Can Only Reinforce What It Sees Succeed — Outcome-Reward RL Discovery Threshold

## Overview
A controlled study of what outcome-reward RL can and cannot teach a language model. Using puzzle worlds where both the pre-training prior and the correct answer are *exactly known* — small language models trained from scratch on games played by a Bayesian player — the authors show RL cannot invent behaviors: it amplifies whichever actions happen to appear in successful rollouts, and whether a rare correct action gets learned at all is **predictable before training** from a single counting statistic.

## Problem Statement
When a rule learned in pre-training stops working, an agent must weigh prior knowledge against new observations. Does outcome-reward RL let a model *discover* the right action when the prior is wrong, or only sharpen what sampling already surfaced? Prior work can't isolate this because priors and ground truth are unknown in real corpora.

## Key Findings
- **RL converts hedging into decisions**: base models hedge in the direction their corpus did; RL resolves that hedging whichever way reward favors — it does not create new rules.
- **Discovery is all-or-nothing per run**: when the right action is rare, each training run either learns it everywhere or never; there is no partial diffusion across runs.
- **One statistic predicts takeoff**: the expected number of *groups of attempts in which the action wins*. ~35 such groups gives even odds of learning.
- **Robustness of the threshold**: holds for new and repeated problems, group sizes 4–256, across learning rates, optimizers, GRPO variants, and model sizes 1.3M–85M parameters — these shift the threshold value but never *what is counted*.

## Interpretation
Outcome-reward RL is a **selection** mechanism, not a generation mechanism: exploration before RL (or rollout design that guarantees winning groups) is what determines learnability. For agent training pipelines, the practical lever is ensuring the rare correct behavior occurs in enough winning groups during rollouts — increasing steps alone won't help what sampling never shows.

## Relevance to Our Domain
Grounds the KB's agentic-RL coverage (GRPO pipelines, agent evolution studies): the "RL unlocks latent capabilities" story has a hard, measurable floor — RL reinforces only observed successes. The pre-trainable discovery-count predictor is directly usable to budget rollouts for agentic RL tasks.

## References
- Paper: https://arxiv.org/abs/2611.26084
- Related: [[explanation-resolution-hypothesis-agent-evolution]] (selection-vs-generation theme in agent evolution)
