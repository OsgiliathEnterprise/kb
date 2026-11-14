---
title: 'Experience-Handoff RL: Recursive Self-Improvement in Structured Environments'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.16409
date: 2026-11-14
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# Experience-Handoff RL (ERL): Training Agents that Get Better at Training Agents

## Overview

Recursive self-improvement (RSI) requires that an agent's experience actually *improves its successors* — each generation should train better than the last. The paper identifies a bottleneck that stops this from happening in current LLM-agent pipelines: **experience decay across the training boundary**. Behaviors that work at test time do not transfer as *trainable advantage* into the next round of RL, so gains evaporate generation after generation. The proposed fix is **Experience-Handoff RL (ERL)**: instead of handing off raw trajectories, each round produces **task-agnostic, reusable training guidance** that conditions the *next round's* behavior-cloning data, policy initialization, and exploration.

## Problem Statement

In multi-round self-improvement loops, round N's policy may score higher than round N−1, but round N+1's training run does not start from a better *training setup* — same naive init, same undirected exploration. Empirically, the authors show a **standard GRPO pipeline suffers a capability ceiling** in this setting: improvements plateau because experience is not converted into durable training assets.

## Key Contribution

- **Diagnosis**: names and demonstrates *experience decay across the training boundary* as the concrete failure mode blocking RSI in RL-trained LLM agents (not the test-time capability itself).
- **Method — ERL**: augment each RL round's outputs with a compact, **task-agnostic guidance artifact** that is fed forward into the next round at three points: (1) which behavior-cloning data to generate, (2) how to initialize the policy, (3) where to explore. This makes each generation's *training process* smarter, not just its policy.
- **Result on science environments**: on SciToolBench (the paper's scientific-tool-use evaluation), ERL achieves **16.46% over base** and **8.98% over standard GRPO**, while *improving across successive self-improvement rounds* instead of plateauing.
- **A second result in code environments** — the RSI loop with ERL guidance also compounds gains on coding tasks (reported as sustained round-over-round improvement).

## Technical Approach

Baseline loop: GRPO-style RL rounds on verifiable-reward environments (SciToolBench scientific tool use, plus code environments). ERL inserts a "handoff" step: after each round, meta-level analysis extracts which behaviors, data distributions, and exploration patterns produced the advantage, encodes them as task-agnostic guidance, and uses them to shape the next round's BC corpus, weight init, and exploration schedule. The guidance — not the raw rollouts — is the unit of cultural transmission between generations.

## Relevance to Our Domain

This is the training-side complement to agent-memory self-evolution (see the MAPE note in agent-architecture): one evolves what the agent *knows*, ERL evolves how the agent is *trained*. For anyone building self-improving agent pipelines — including our own skills/cron cascade — the transferable lesson is to persist **meta-level guidance** (what worked in training) alongside artifacts, because raw experience alone decays at the next boundary. The observed GRPO ceiling is also a caution for naive "keep RL-ing on our own logs" plans.

## References

- Paper: https://arxiv.org/abs/2611.16409 (cs.AI, submitted 2026-11-12)
- Related: GRPO (DeepSeekMath, arXiv:2402.03300); SciToolBench; MAPE (arXiv:2611.17068)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16409
