---
title: 'CoordRoute: Coordinated Multi-Model Routing for Maximum Compute-Budget Utility'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.34161
date: 2026-11-26
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# CoordRoute: Coordinated Multi-Model Routing for Maximum Compute-Budget Utility

## Overview
Budget-aware routing normally picks a model per request to maximize utility minus cost — a greedy formulation that ignores cross-request interactions, so it misallocates tokens from the *service-wide* optimum. CoordRoute treats budget-constrained routing as **global token allocation across a model pool**: a predict-plan-rectify loop that hit its target budget within **±0.8%**, delivered **13% higher average utility** than the strongest baseline, and stayed robust when budget estimates shifted **30%**.

## Problem Statement
Per-request greedy routing optimizes each decision in isolation. But tokens compete for a shared budget across the whole workload; greedy choices interact, so the aggregate outcome drifts from what coordinated allocation would achieve. There was no routing layer that plans token counts across a model pool at inference time while keeping utility above a fixed quality floor.

## Key Contribution
CoordRoute is a three-stage online controller:
- **Predict** — estimate per-query response lengths via a lightweight regression; **quantile calibration** turns point estimates into uncertainty-aware token budgets.
- **Plan** — solve a **water-filling problem over the log-utility curves** of the available models to allocate the budget across the pool, subject to a minimum-utility constraint.
- **Rectify** — when a live response is about to deviate from its planned token budget, steer it with **inference-time budget control** so the realized spend matches the plan.

## Technical Approach
The water-filling formulation is the conceptual core: each model's marginal utility per token defines a curve, and the allocator equalizes marginal utility across models (subject to the floor), exactly like bandwidth allocation in networking. Prediction error is handled twice — conservatively at planning time (quantiles) and reactively at serving time (rectification). Evaluation spans five benchmark datasets and five model pools; the ablation studies the effects of prediction accuracy, budget over/under-provisioning, and the quality floor.

## Results
- Target budget met within ±0.8%.
- +13% average utility over the strongest baseline.
- Robust to 30% shifts in budget estimation — the controller absorbs planning error rather than amplifying it.

## Relevance to Our Domain
A concrete architecture for cost-controlled LLM gateways serving many agents/workloads under a monthly token budget: it turns "route to the cheapest model that works" into coordinated pool-level allocation with provable budget adherence. Directly applicable to our agent infrastructure's FinOps concerns and any multi-model serving layer.

## References
- Paper: https://arxiv.org/abs/2611.34161
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34161
