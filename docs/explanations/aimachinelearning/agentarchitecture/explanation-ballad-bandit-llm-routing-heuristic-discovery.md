---
title: Ballad — Bandit-Based LLM Routing for Automated Heuristic Discovery
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.17241
date: 2026-11-15
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Ballad — Bandit-Based LLM Routing for Automated Heuristic Discovery

## Overview

Ballad reframes a practical question for agentic search systems: when an LLM-driven evolutionary loop mutates candidate solutions, which model should you call at each step? Across NP-hard combinatorial optimization tasks, the authors show empirically that paying for the biggest frontier model does not consistently produce better heuristics than cheaper open-weight or freely hosted models. Ballad is an online bandit algorithm that learns, during the run, how to orchestrate a heterogeneous pool of LLMs so the ensemble matches or beats the best single model — while cutting API cost by up to ~65%.

## Problem Statement

Automated heuristic discovery (AHD) systems use LLMs to iteratively mutate and refine solution code. The naive policy — always invoke the strongest model — is both expensive and empirically unjustified. But adaptive selection is hard here for a subtle reason: one model's output seeds the context of later calls, so reward signals are non-stationary and entangled across the population of heuristics, violating the independence assumptions of classical multi-armed bandit settings.

## Key Contribution

- An empirical debunking: no consistent quality advantage for larger, costlier LLMs in heuristic discovery across multiple NP-hard problems.
- **Ballad**, a bandit-based routing policy with three mechanism choices tailored to the entangled-reward setting:
  1. **Rare-high-score selection policy** — favors models that produce rare top-performing heuristics rather than models with stable average scores (risk-seeking credit for outliers).
  2. **DAG-based credit propagation** — rewards flow backward through the *genealogy* of the heuristic population (which model's output was an ancestor of a champion), untangling entangled rewards.
  3. **Stale-observation discounting** — old rewards decay so the policy tracks each model's current utility, handling non-stationarity.
- Cost results: matches the best single LLM in hindsight and sometimes surpasses every individual model, with up to **65.6% API cost reduction** versus always using the strongest model.

## Technical Approach

The search proceeds as a population-based loop: at each mutation/refinement step, the router samples which model from the pool to invoke. Each heuristic records its parent model in a lineage DAG; when a heuristic scores well, credit propagates along its ancestry. The selection distribution weights rare high performers, and per-model value estimates discount older observations over time. Evaluated over five NP-hard combinatorial optimization problems with a pool of four models spanning capability and cost tiers.

## Relevance to Our Domain

LLM routing is a core agent-infrastructure concern: every multi-step agent workflow pays per token and inherits this entangled-reward structure (each step conditions the next). Ballad's recipe — genealogy-based credit assignment, outlier-favoring selection, temporal discounting — transfers directly to any agentic pipeline that mixes frontier and self-hosted models, and offers a principled alternative to static "route by task difficulty" heuristics.

## References

- Paper: https://arxiv.org/abs/2611.17241
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17241
