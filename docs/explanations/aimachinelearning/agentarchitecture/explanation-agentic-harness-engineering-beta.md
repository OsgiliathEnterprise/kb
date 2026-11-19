---
title: 'Agentic Harness Engineering Beta: Requirement-Centered Evolution of Agent
  Harnesses'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.24924
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Agentic Harness Engineering Beta: Requirement-Centered Evolution of Agent Harnesses

## Overview
This paper introduces **AHE-Beta**, a requirement-centered loop for automatically evolving LLM agent harnesses. Prior harness-evolution methods mutate the harness and keep changes that improve benchmark scores, which tends to produce narrow, task-specific patches stuck in benchmark-specific local optima. AHE-Beta instead drives evolution from *user requirements* — including implicit ones surfaced through realistic multi-turn interaction — mirroring how real harness engineering is actually done.

## Problem Statement
Real-world harness engineering is steered by explicit and implicit user requirements, but existing automatic harness-evolution methods ignore those interaction needs and select changes solely by benchmark score. The result is overfitting to the benchmark rather than genuine capability improvement.

## Key Contribution
- A three-step evolution loop:
  1. **User-driven evaluation** — simulated users raise their requirements as issues while working with the harness over multiple turns.
  2. **Team-based modification** — requirements are implemented as generalizable changes rather than task-specific patches.
  3. **Requirement-driven selection** — a change is merged only when it resolves a *verified* requirement and passes review.
- Empirical validation on held-out tasks plus a **blind human A/B test**, closing the usual gap between benchmark metrics and real user preference.

## Technical Approach
The loop couples a user simulator (which files requirement issues from multi-turn sessions) with a modification team and a review/merge gate conditioned on requirement resolution — not just score deltas. This makes every accepted harness change traceable to a concrete user need.

## Results
- Held-out tasks: pass@1 rises from **21.9% → 33.3%** while using **40.8% fewer tokens** than the base harness; higher pass@1 than Claude Code, Meta-Harness, and vanilla AHE.
- Blind human A/B: real users preferred AHE-Beta in **31 of 48** valid pairs and rated it higher on all five dimensions — matching the user simulator's directional preference.
- Gains transfer without further evolution: +15.8% pass@1 on GLM-5.3 and +5.3% on DeepSeek-V4.1-Flash over the base harness.

## Relevance to Our Domain
Extends our agent-harness engineering thread ([[explanation-anatomy-of-an-agent-harness]], [[explanation-certified-execution-harness-petri-net-supervisor]]): the key insight is that benchmark-score-driven harness self-improvement overfits, while requirement-anchored selection generalizes — and that a user simulator's preferences can proxy real human A/B outcomes. For agent infrastructure, it suggests tracking harness changes as issue-tracked requirements with review gates, exactly like software teams.

## References
- Paper: https://arxiv.org/abs/2611.24924
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24924 (not indexed at ingest time)
