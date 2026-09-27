---
title: Coding Agents for Generalized Task and Motion Planning — LLM-Synthesized Planners
  Beat Hand-Engineered Ones
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2609.30233
date: 2026-09-27
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Coding Agents for Generalized Task and Motion Planning Problems

## Overview

Task and motion planning (TAMP) — deciding *what* a robot should do and *how* to move to do it — remains hard even with full observability, because discrete decisions are tightly coupled to geometric, kinematic, and dynamic constraints. "Generalized" TAMP methods exploit regularities across problem instances so that work done on one instance transfers to new ones, but they demand substantial domain-specific engineering. This paper (Merler et al.) asks a different question: **can coding agents just write the generalizing program themselves?** Given a task description and simulator access, each agent develops a reusable planning program within a fixed synthesis budget; the frozen program is then evaluated on unseen instances.

## Problem Statement

Hand-engineered generalized planners are effective but expensive to build per domain. The open question: do frontier coding agents (Claude Code Opus 5, Codex GPT-5.6 Sol / GPT-6 Astra) — given only a task description and simulator access — synthesize programs that generalize across instances as well as or better than expert-built planners?

## Key Contribution

- **Large-scale empirical comparison**: 980 generated programs evaluated on 100 held-out instances each (98,000 evaluation episodes) across 28 simulated environments from KinDER and PDDLStream, with object counts beyond the original benchmarks.
- **Agents outperform hand-engineered baselines**: mean success of 56–95% for agent-synthesized programs versus 47% for planners (on the 16 environments where a planner exists), and agents also beat one-shot generation and an LLM-based generalized-planning baseline.
- **Scaling behavior**: as object counts grow, agent programs maintain higher success than the planner while using roughly an order of magnitude less computation per instance on average.
- **Behavioral analysis from logs**: agents use environment interaction to calibrate physical models, test edge cases, and refine strategies — i.e., they do genuine empirical work rather than pure code generation.
- **Full reproducibility**: all code and the complete prompts given to the agents are released.

## Technical Approach

Each agent receives a task description plus simulator access and a fixed synthesis budget. It chooses how to interact with the environment (running candidate programs, observing outcomes) while developing a program; at the end the program is frozen and evaluated on held-out instances it has never seen. The comparison spans three agent configurations against hand-engineered planners, one-shot LLM generation, and an LLM-based generalized planning baseline — all under identical evaluation conditions.

## Results

- Mean success: 56–95% (agents) vs. 47% (planner), on the 16 environments with a planner available.
- Agents maintain higher success than the planner as object counts grow, at ~10× less per-instance computation.
- All three agent configurations outperform one-shot generation and the LLM-based generalized planning baseline.

## Relevance to Our Domain

This is strong evidence for the "coding agents as general-purpose problem solvers" thesis in our AI-assisted development coverage: the same agentic loop (interact → hypothesize → test → refine) that works on software bugs transfers to robotics planning, where the "tests" are simulator rollouts. Two takeaways for agent-architecture design:

1. **Interaction is the differentiator** — agents that can run their candidate programs against a real environment substantially outperform one-shot generation; budgeting for environment access matters more than model scale alone.
2. **Frozen-program evaluation as methodology** — freezing the synthesized artifact and testing on held-out instances is a clean way to separate "the agent learned the domain" from "the agent memorized the test set"; worth adopting when evaluating any agentic code synthesis pipeline.

## References

- Paper: https://arxiv.org/abs/2609.30233 (Merler, Li, Roy, Liang, Wang, Huang, Silver — 2026)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.30233
