---
title: Cost-Aware Agentic Feature Optimization System for Fleet-Scale Ranking Models
diataxis: How-to Guide
domain: ai-machine-learning
topic: ml-ops
source: arXiv
source_url: https://arxiv.org/abs/2611.26531
date: 2026-11-21
keywords:
- knowledge-base
- ml-ops
- ai-machine-learning
- how-to
---
# Cost-Aware Agentic Feature Optimization System for Fleet-Scale Ranking Models

## Overview
This paper (arXiv:2611.26531) reports a production system deployed on **Snap's fleet-scale ranking infrastructure** that automates feature engineering with LLM agents. The problem it solves is specific: in a large recommender fleet, ranking models are maintained separately per creator, yet many creators share audience, content, and demand characteristics — so a feature proven on one creator is a natural, low-cost hypothesis for another. Manually exploring this cross-creator transfer at fleet scale is infeasible.

## When to Use
You operate a fleet of per-segment models (per-creator, per-region, per-tenant) with a shared production A/B measurement layer, and you want agentic automation of feature discovery under explicit compute/cost budgets.

## Procedure
1. **Generate transfer hypotheses.** Mine a historical model-configuration corpus to propose cross-creator feature transfers — features evaluated on a source creator become candidates for a target creator with similar audience/content/demand profiles.
2. **Shortlist.** Filter candidate features with lightweight screeners (expected lift, redundancy against existing features).
3. **Rank.** Score shortlisted candidates with cheap offline signals before any expensive evaluation.
4. **Blend.** Combine complementary features into candidate feature sets rather than testing them only in isolation.
5. **Tune.** Optimize hyperparameters jointly with the selected feature sets.
6. **Prune.** Apply budget-constrained model selection: the agent chooses which candidate configurations advance to the expensive stage (retraining + production A/B) given compute costs.
7. **Measure in production.** Every promoted candidate passes through the production A/B measurement layer — the offline proxy never replaces online validation.

## Key Contribution
- Treats feature discovery as **cost-aware optimization**: each stage of the funnel is ordered by evaluation cost, and the agent allocates budget across stages.
- Exploits the fleet structure (many similar per-creator models) as a prior for transfer, which single-model feature-engineering agents cannot use.
- Validated at real fleet scale with production A/B, not offline-only replay.

## Verification
- Improvement is measured with the production A/B measurement layer as ground truth.
- Compute cost per improvement is tracked explicitly (the "cost-aware" half of the title) — expect a cost/quality curve, not a single lift number.

## Relevance to Our Domain
A rare production-grade LLM-agent ML-ops deployment: the staged funnel (hypothesis → shortlist → rank → blend → tune → prune → A/B) is reusable for any automated-MLOps pipeline, and the budget-constrained promotion step is the practical answer to "agentic ML research systems burn unbounded compute."

## References
- Paper: https://arxiv.org/abs/2611.26531
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26531
- Related: automated feature engineering (AutoFeat-family), LLM agents for ML engineering (MLE-agent literature)
