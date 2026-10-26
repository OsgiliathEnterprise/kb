---
title: 'More Memory, Worse Agents: Error Reproduction and Anti-Persistence in LLM
  Agent Memory'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: 'arXiv: More Memory, Worse Agents: Error Reproduction and Anti-Persistence
  in LLM Agents (arXiv:2610.27406)'
source_url: https://arxiv.org/abs/2610.27406
date: 2026-10-25
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# More Memory, Worse Agents: Error Reproduction and Anti-Persistence

## Overview

LLM agents can improve across tasks without any parameter updates by storing experience from their own runs in external memory and reusing it to guide later decisions. The design question this paper (cs.AI, Oct 2026; 31 pages) tackles: **should memory retain only observed trajectories and outcomes, or also the rules, summaries, and skills inferred from them?** The headline result is counterintuitive — persisting abstractions often makes agents *worse* — and the paper names the mechanism: **error reproduction**.

## Problem Statement

Retaining inferred abstractions (skills, summaries, rules) lets agents reuse strategies without re-deriving them from raw trajectories. But an error in a stored abstraction propagates through retrieval and reuse into later decisions — and worse, it *shapes the execution trajectories those decisions produce*, which then become the basis for new abstractions that reproduce the original error. The paper calls this feedback loop **error reproduction**: errors are regenerated through a cycle of abstraction → execution → re-abstraction, extending their persistence far beyond direct reuse of the faulty knowledge. More memory, in this regime, means more machinery for errors to replicate themselves.

## Key Contribution

- **A named failure mode**: error reproduction — self-sustaining error propagation through the abstraction–execution–re-abstraction cycle, distinct from simple stale-knowledge retrieval errors.
- **Anti-Persistence**, a memory design that inverts the default: **accumulate trajectories and outcomes persistently, but reconstruct task-specific guidance on demand** and discard it after execution.
- **An adaptive selector**: uses prior outcomes to decide *whether and how* to synthesize guidance for a given task — not every task needs synthesized guidance, and synthesis quality varies.
- **Design principle**: separate *experience accumulation* (safe to persist) from *abstraction persistence* (dangerous to persist). Synthesized guidance is ephemeral by construction, which prevents it from being directly reused as a stored object — though the paper is explicit that indirect feedback through retained trajectories remains possible.

## Results

Across different benchmarks and backbone models, Anti-Persistence achieves **higher overall held-out success and the lowest average LLM-call cost** among the evaluated memory designs — the on-demand synthesis is cheaper than persisting and retrieving abstractions, and avoids the error-reproduction failure mode that hurts the persist-abstractions baselines.

## Relevance to Our Domain

This is a concrete data point for the memory-architecture notes in this topic (Claude's unified memory, LemmaLog's datalog memory, contradiction-judge memory auditing): the safe thing to persist is *evidence* (trajectories, outcomes), while *conclusions* should be recomputed per task. The cost result matters operationally — persistent-abstraction pipelines pay for synthesis once and retrieval always, while Anti-Persistence pays inference only when the selector says it is worth it. Any long-running agent we run with a skill store should treat this as the default design: store what happened, re-derive what it means.

## References

- Paper: https://arxiv.org/abs/2610.27406
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.27406
