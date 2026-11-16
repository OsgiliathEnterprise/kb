---
title: 'ModHarness-RL: Recasting Harnesses as Learnable and Evolving Programs for
  Agentic RL'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.18533
date: '2026-11-16'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# ModHarness-RL: Recasting Harnesses as Learnable and Evolving Programs for Agentic RL

## Overview
Agentic RL normally trains only the policy weights under a **hand-written harness** (the scaffold deciding what the model sees of its own interaction and what guidance it receives) that stays fixed throughout training — yet the right harness depends on domain, data and model, and drifts as the model trains. ModHarness-RL recasts the harness as **programs learned from data that evolve together with the model**, with no weight updates to the harness side.

## Problem Statement
A fixed harness encodes behavioural priors as rigid scaffolding chosen at design time. As the policy improves, the context-assembly and guidance logic that helped early in training becomes stale, and rewriting it by hand per domain/model is neither systematic nor inspectable.

## Key Contribution
- **Interaction recorded as structured State**: a set of typed blocks capturing the agent's trajectory, instead of an opaque message string.
- **Harness components as programs over State**: a *Compression* program assembles accumulated history into the model's context; a *Steering* program supplies guidance when behavior deviates.
- **Evolution loop during RL**: candidate programs are proposed from recent trajectories, **verified by execution**, and **replayed over past trajectories**, so the harness tracks the model's shifting behavior rather than freezing at design time.

## Technical Approach
Propose → execute-verify → replay: candidate Compression/Steering programs are generated from recent trajectories, must run without error, and are re-scored by replay over past trajectories before being adopted. Because harness logic is code over typed State blocks, it is diffable, testable and versionable independently of the policy.

## Results
Studied in depth on **CodeSearch**, with further analysis on **ALFWorld** and **BIRD SQL**, using models from **1.5B to 8B** parameters. The learned Compression and Steering mechanisms improve **held-out performance over a fixed-harness baseline in most settings** — evidence that a harness for agentic RL can be learned from the task's data and evolved with the model.

## Relevance to Our Domain
For agent infrastructure teams, this reframes "prompt + scaffolding engineering" as a trainable artefact: context-compression and steering logic become versioned, execution-verified, replay-benchmarked components — a pattern directly portable onto CI-style evaluation pipelines we already run for agents, even outside RL (e.g. offline harness regression). Related: [[explanation-experience-handoff-rl-recursive-self-improvement]].

## References
- Paper: https://arxiv.org/abs/2611.18533
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18533
