---
title: FedBrew — Paper-Faithful Federated Learning with Scientific Checks
diataxis: How-to Guide
domain: ai-machine-learning
topic: ml-reproducibility
source: arXiv
source_url: https://arxiv.org/abs/2611.17129
date: '2026-11-13'
keywords:
- knowledge-base
- ml-reproducibility
- ai-machine-learning
- how-to
---
# FedBrew: Paper-Faithful Federated Learning with Scientific Checks

## Overview
Federated learning (FL) experiments routinely produce plausible-but-wrong numbers because implementation drift from the intended protocol is silent: a subtly wrong data partition, aggregation weight, RNG seed, or checkpoint resume does not crash the program — it just changes the result. FedBrew (Dadras & Yurtsever) is a research codebase that makes protocol faithfulness a checked property, with assertions on scientific conditions, not just software correctness. Particularly relevant as AI coding agents now write experiment code that "runs green" while violating the paper's protocol.

## Problem Statement
Small errors in configuration, client data partitioning, aggregation rules, randomness, evaluation, or checkpoint recovery propagate into reported comparisons without any runtime failure. Standard unit tests check code, not whether the *experiment* matches the *protocol*.

## How to Run Paper-Faithful FL Experiments with FedBrew
1. **Declare the protocol as configuration.** Encode the intended experimental conditions (partition scheme, aggregation rule, seeds, eval protocol) so they are machine-checkable rather than implicit in code paths.
2. **Enable configuration checks** at startup — reject runs whose settings contradict the declared protocol before any GPU time is spent.
3. **Use identifiable client partitions.** FedBrew tags client data so checks can verify partitions are *disjoint and exhaustive* (no leakage, no dropped data) — the most common silent FL bug class.
4. **Verify aggregation.** Assert that aggregation weights match the prescribed rule (e.g., FedAvg client-weighting) on every round, instead of trusting the reduce step.
5. **Guard numerics and recovery.** Checks reject non-finite client model states and validate checkpoint recovery so interrupted runs resume scientifically identical to uninterrupted ones.
6. **Keep self-describing run records.** Every run emits records tying reported results to the exact software/scientific conditions that produced them — inspectable provenance for every number.
7. **Extend safely (researchers or coding agents).** The same check suite gates new algorithms, datasets, models and tasks, giving AI agents clear extension points with automated scientific validation.

## Results / Artifacts
13-page paper, open code: https://github.com/DadrasAli/fedbrew (cs.LG + cs.SE). Positioned explicitly for both practitioner and agent-driven development workflows.

## Relevance to Our Domain
The "checks of scientific conditions" pattern generalizes beyond FL to any experimentation pipeline in our ML-Ops coverage — including agent-generated code, where a coding agent satisfying unit tests can still silently break the experimental protocol. A concrete reference implementation for guardrails we advocate in AI-assisted dev notes.

## References
- Paper: https://arxiv.org/abs/2611.17129
- Code: https://github.com/DadrasAli/fedbrew
- Related: how-to-swe-prime-trajectory-selection-for-coding-agent-sft, explanation-masagent-malicious-agent-teams (agent-written code risks)
