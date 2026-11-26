---
title: 'Budget Internalization: Fixed-Budget RLVR Trades Test-Time Scaling for In-Budget
  Accuracy'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.26172
date: 2026-11-22
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# Budget Internalization: Fixed-Budget RLVR Trades Test-Time Scaling for In-Budget Accuracy

## Overview

**Budget internalization** is an unintended side-effect of how RLVR is usually run: training reasoning models with a *fixed rollout cap*. This paper shows the cap reshapes model behaviour, not just training cost — after training, models use few tokens beyond the training budget, beat their base model near that budget, but then **stop improving and fall below the base model at larger budgets**. The rollout cap becomes a *learned constraint* that caps test-time scaling itself.

## Problem Statement

Reasoning models normally get more accurate when allowed to generate longer answers at test time (test-time scaling). RLVR pipelines routinely train with a fixed rollout cap to control cost. Nobody systematically asked what that cap does to the *deployed* scaling curve. This paper isolates the effect and traces its cause.

## Key Findings

- **The effect**: post-RLVR models plateau at the training budget; beyond it, their accuracy degrades below the untrained base model. Observed across **Qwen3.5-4B, Gemma4-E2B, Nemotron-3-Nano-4B** on two training tasks (mathematical reasoning; diverse procedurally generated problems), and it **transfers** from math training to science and coding tasks.
- **Objective-level ablations (Qwen3.5-4B)**: most training-objective changes recover little scaling. Stronger KL regularization and lower training-data truncation preserve more scaling — but stronger KL costs in-budget accuracy. Forcing an answer on truncated training rollouts removes budget internalization *and* most of the in-budget gain.
- **Cause — length-censored post-training, not RL**: SFT on *artificially truncated* traces reproduces budget internalization; SFT on naturally short traces does not. The effect therefore attaches to length-censored post-training generally, not to an RL-specific term.

## Practical Implication

A rollout cap is not a neutral cost knob: it **trades low-budget gains for lower performance when additional inference compute is available**. Teams with token headroom at inference should question the rollout cap used in post-training, and teams that need test-time scaling should reduce training-time length censoring (KL/truncation trade-offs above).

## Relevance to Our Domain

Directly conditions our agent-training and llm-serving guidance: budget caps chosen for training cost silently cap the accuracy ceiling of deployed reasoning agents, and the fix lives in the post-training recipe, not the inference harness.

## References
- Paper: https://arxiv.org/abs/2611.26172 (cs.LG, cs.AI — Zavidnyi, Kovrigin, Puchkova, Gelvan, Titov, 2026-11-19)
- Related in vault: [[how-to-jet-just-enough-exploration-tuning]] (deliberate budget shaping as a goal, vs this paper's cautionary finding)
