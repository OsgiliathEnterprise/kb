---
title: PoEM — Predicting RL Post-Training Outcomes Without Running the RL
diataxis: Explanation
domain: AI-LLM
topic: LLM-Models
source: arXiv
source_url: https://arxiv.org/abs/2609.30226
date: 2026-09-27
keywords:
- knowledge-base
- LLM-Models
- AI-LLM
- explanations
---
# PoEM: Predicting RL Outcomes from Existing Policies

## Overview

Post-training foundation models with reinforcement learning is expensive, sometimes unstable, and must be re-run from scratch whenever the reward changes or multiple rewards are combined. PoEM (Hamidieh, Daras, Torralba — MIT) asks whether you can **predict what RL on a new reward would produce without actually running it**, using only models already post-trained on other rewards. The answer is yes: log-space policies from RL training span an approximately low-rank subspace across rewards, so the target policy can be approximated as a linear combination of existing ones — with coefficients estimable from just the reward or basis-policy outputs on samples.

## Problem Statement

Every new reward function (or mixture of rewards) currently triggers a full RL post-training run: costly GPU time, instability risk, and no way to preview the outcome before committing. If the space of achievable policies is low-dimensional across rewards, then a small library of already-trained policies could serve as a basis for predicting — or even directly constructing — the policy for any new reward combination.

## Key Contribution

- **Linearity result**: if a new reward is a linear combination of existing rewards, the resulting RL policy in log-space is a linear combination of the corresponding log-policies (a clean theoretical anchor).
- **Empirical low-rank structure**: even when rewards are *not* linearly related, log-policies from RL training still span an approximately low-rank subspace across rewards — the key empirical discovery that makes prediction possible.
- **Coefficient estimation without running RL**: the combination weights can be estimated using only reward-model outputs or basis-policy outputs on a sample set — no additional RL training required.
- **Cross-modal validation**: the approach is validated on synthetic and real rewards spanning both text and image modalities.

## Technical Approach

Given a library of models post-trained on known rewards (the "basis policies") and a new reward function, PoEM estimates coefficients that express the target log-policy as a combination of basis log-policies. The estimation uses only forward-pass outputs (reward scores or policy logits) on a sample set — no gradient steps through an RL loop. The result is an approximate target policy obtainable by combining existing model outputs, turning "run RL for N hours" into "evaluate M small models and mix their outputs."

## Results (verified details)

- Target RL policies approximated without any additional RL training across synthetic and real rewards; no model parameters are updated at inference time — PoEM is purely an inference-time composition step.
- Validated in both text and image modalities (language models via weighted log-mixture of base + basis policies; diffusion models via the analogous composition).
- **Policy-space rank gap**: on a basis of n=20 adapters trained on Qwen3-0.6B for distinct programmatic rewards, the stacked weight updates are nearly mutually orthogonal (median pairwise cosine ≈ 0.02) and full-rank in parameter space (effective rank ≈ 19.4), yet the centered log-ratio matrix has effective rank only ≈ 6.3 — about three times smaller. The basis is doing n different things in weights but spans a low-dimensional subspace in log-likelihood space, which is what makes small calibration sets sufficient for coefficient regression.
- **Coverage score**: before decoding, PoEM checks whether the target policy's log-ratio lies near the span of the experts' log-ratios (measured on held-out reward, without needing the target policy). Rewards with low coverage stay far from the RL outcome at every temperature tried — a cheap pre-flight check for "can this basis reach that reward?"
- **Holdout validation**: each expert of P-GRPO, P-DPO and RM-Div is held out in turn and predicted from the others; PoEM beats both the reference model and the top single expert on combined rewards.
- The low-rank subspace property holds even for non-linearly-related rewards (part of the shared structure is response length), though approximation quality degrades as reward geometry moves further from the spanned subspace.

## Pipeline in practice

Given a target reward: (1) score a small calibration set under the new reward and the basis policies, (2) fit composition weights via linear regression on reward-space or policy-space outputs, (3) check the held-out coverage score, (4) compose the basis at inference time. The whole loop replaces an RL run with forward passes over existing models.

## Relevance to Our Domain

For ML-Ops teams running LLM post-training pipelines, this is a cost-reduction pattern worth tracking: **a policy library becomes an asset you can query instead of retrain**. Practical implications:

1. When evaluating candidate reward combinations (e.g., mixing alignment + correctness + format rewards), PoEM-style prediction gives a cheap preview before committing to full RL runs — useful for reward-design iteration loops.
2. The low-rank structure suggests that diverse post-training runs are not independent assets; a small, well-chosen basis set may cover most of the reachable policy space, which has implications for model-zoo management and serving cost.
3. Caveat: this predicts *policy outputs*, not training dynamics — it cannot tell you whether an actual RL run on the new reward would be stable or converge, only where it would land if it did.

## References

- Paper: https://arxiv.org/abs/2609.30226 (Hamidieh, Daras, Torralba — 2026)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.30226
