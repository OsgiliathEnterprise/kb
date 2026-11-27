---
title: 'Maco-RL: Scaling Agent Capabilities with Mixed-Task Reinforcement Learning'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.34703
date: '2026-11-27'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# Maco-RL: Scaling Agent Capabilities with Mixed-Task Reinforcement Learning

**Authors:** Jiacheng Zhang, Qixing Zhou, Haiyang Wang, Qipeng Gu, Shuzhe Wu, Feiyang Pan, Lue Fan, Dandan Tu, Zhaoxiang Zhang (arXiv 2611.34703, submitted 2026-11-25, primary cs.LG)

## Overview
Mixed-task reinforcement learning (MixRL) trains **one unified policy across multiple task domains** instead of training per-domain specialists and distilling them back together. Zhang et al. propose **Maco-RL**, a scaling recipe for MixRL that fixes its three practical blockers: training instability across domains, wasteful rollout-compute allocation, and difficulty adding new domains continually.

## Problem Statement
Scaling MixRL for agent post-training fails on three axes: (1) gradient contributions drift between task domains, destabilizing training, especially with asynchronous rollouts (off-policy skew); (2) rollout compute is not allocated well between samples the policy has already mastered and frontier samples; (3) adding a new domain mid-training tends to erode previously acquired capabilities.

## Key Contribution
- **Quota-based asynchronous rollout scheduler**: each task domain gets a rollout quota, balancing gradient contributions across domains and mitigating off-policy effects from asynchrony — this is what stabilizes multi-domain training.
- **Tri-Buffer Sampling (TBS)**: an orthogonal compute-allocation axis that buckets samples by mastery level and budgets rollouts per buffer, sustaining frontier exploration while preserving mastered skills (anti-forgetting during RL).
- **Empirical scaling evidence**: on five benchmarks, Maco-RL lifts Qwen3.5-27B's overall score 43.6 → 54.2, then to 60.1 under continual domain expansion — matching the frontier held by Qwen3.8-27B and pushing it further by +5.7.
- Maco-RL **beats single-task RL while using less policy-update compute**, supporting MixRL as a practical, compute-efficient post-training paradigm.

## Technical Approach
Two orthogonal mechanisms wrap a standard agentic RL loop. The scheduler enforces per-domain rollout quotas on the asynchronous rollout workers, so no domain starves or floods the gradient mix. TBS maintains three buffers keyed by per-sample mastery and allocates rollout budget across them, so compute flows toward frontier samples without abandoning consolidation of near-mastered ones. Continual expansion is handled by adding a domain's quota rather than retraining from scratch.

## Results
- Qwen3.5-27B: 43.6 → 54.2 (mixed-task RL) → 60.1 (continual expansion), across five agent benchmarks.
- Reaches/exceeds the Qwen3.8-27B frontier (+5.7 beyond it).
- Lower policy-update compute than per-domain single-task RL baselines.

## Relevance to Our Domain
Our KB tracks agent post-training recipes (JET, CARE-OPD, SWE-growth, SPLICE). Maco-RL is the systems-side counterpart: when you operate an agent-training platform, the interesting knobs are rollout scheduling and compute allocation across domains, not just reward design. The quota-scheduler + tri-buffer pattern is directly reusable for any heterogeneous agentic RL pipeline (SWE + browsing + SQL, etc.) and for ML-Ops dashboards that need per-domain gradient/throughput accounting.

## References
- Paper: https://arxiv.org/abs/2611.34703
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34703
- Related in vault: ai-machine-learning/agent-training/ (JET, CARE-OPD, SPLICE, CrossEnv)
