---
title: Cost-Aware Agentic Feature Optimization for Ranking Model Fleets (CAFO)
diataxis: Explanation
domain: ai-machine-learning
topic: ml-ops
source: arXiv
source_url: https://arxiv.org/abs/2611.26531
date: 2026-11-21
keywords:
- knowledge-base
- ml-ops
- ai-machine-learning
- explanations
---
# CAFO — Agentic Feature Optimization under Resource Caps

## Overview
Large web platforms operate fleets of ranking models, each selecting features from a shared pool of **tens of thousands**. CAFO (arXiv:2611.26531, Yang et al.) is an **end-to-end agentic system** that optimizes feature selection across the whole fleet under two kinds of resource constraints: **shared** (feature pipeline cost) and **per-model** (serving throughput / QPS).

## System Architecture (Reference)
Division of labor between LLMs and deterministic machinery:
1. **Hypothesis proposal**: LLM agents propose feature hypotheses; **deterministic tools execute the experiments and verify them** — the LLM never self-certifies a result.
2. **Candidate generation & shortlisting**: per model, an LLM generates and shortlists cross-features from a combinatorial candidate space.
3. **Ranking**: all candidate features are scored by several importance methods.
4. **Feature blending**: mixes the multiple rankings into a single selection, using **Pareto fronts across tasks** for multi-task models.
5. **Agentic tuning**: an LLM Researcher agent tunes the feature selection over **10–25 asynchronous trials** under the resource caps.
6. **Trimming**: a final trimming step keeps feature pipeline cost within budget.

## Production Results (Reference Data)
- **Normalized entropy improved by 0.31% on average** across production models, within each model's budget.
- The trimming step **cuts pipeline cost by 2.3%** with no regression beyond measurement noise.
- Optimized models were **launched**; online A/B tests improved a **primary online metric by 0.20%**.

## Why It Matters (Explanation)
The architecture is the lesson: LLMs handle the open-ended part (hypotheses, cross-feature invention, trial scheduling) while **all measurement, verification, and budget enforcement stays deterministic**. Asynchronous bounded trials (10–25) turn "agent experimentation" into a cost-capped process — the resource cap is an input to the loop, not an afterthought. The multi-ranking Pareto blend avoids trusting any single importance metric.

## Limitations & Considerations
- Gains are individually small (0.31% NE, 0.20% online metric) — the value is fleet-scale automation of many such wins under cost discipline.
- Requires mature deterministic experiment infrastructure (execution, verification, importance scoring) for the agents to drive.

## Relevance to Our Domain
Direct blueprint for agentic ML-ops tools: any "AI optimizes X in production" agent should mirror this split — LLM proposes, deterministic tools execute/verify, hard budget caps bound trials, Pareto blending aggregates noisy scorers.

## Provenance & verification
Rewritten 2026-11-21 after audit: the earlier note ("Snap Inc.", creative generation, 7-stage creator/curator/pruner pipeline, 3.8% NE, 2.1% latency, 14 days → 40%, 65% creative reduction, $2.40→$1.80, 42%→68% iteration, $152K→$310K) matched nothing in the paper and was fully replaced. All retained claims verified verbatim against the arXiv abstract (arxiv_meta.xml).

## References
- Paper: https://arxiv.org/abs/2611.26531
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26531
- Related: automated feature engineering, LLM-as-researcher systems, Pareto multi-objective selection
