---
title: 'CoordRoute: Coordinated Multi-Model Routing for Maximum Compute-Budget Utility'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.34161
date: 2026-11-25
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# CoordRoute: Coordinated Multi-Model Routing for Maximum Compute-Budget Utility
**Authors:** Boning Huangfu, Boxiao Du, Chen Chen

## Overview
Model routing sends each request to one of several LLMs of different sizes. In practice requests share a *fixed compute budget* — a spending cap on rented model APIs or the capacity of a private GPU cluster — yet most routers decide each request in isolation, so per-request optima are not optimal overall. CoordRoute advocates **coordinated routing**: allocating the budget *across* requests to maximize total satisfaction, along a predict–plan–rectify route.

## Problem Statement
Three challenges make cross-request budget allocation hard at inference time:
- a request's gain from each model is uncertain before generation;
- later arrivals are unknown when the current request must start;
- observing answers during generation to correct course consumes budget itself.

## Key Contribution
CoordRoute addresses each challenge with a dedicated mechanism:
- **Predict — relative demand prediction.** Instead of predicting absolute gain/cost per model, compare candidate models through past requests that led to the same routing choices, sidestepping pre-generation uncertainty.
- **Plan — lookahead solver.** When choosing a model for the current request, charge each choice for what its compute could have earned for later (anticipated) requests — turning the unknown-future problem into an opportunity-cost calculation.
- **Rectify — budget-aware runtime correction.** During generation, drop or upgrade in-flight requests at the same price the planner used, and inspect answers only when inspection itself pays off, so course-correction doesn't eat the budget it protects.

## Technical Approach
The predict-plan-rectify loop is the conceptual core: prediction is *relative* (same-choice history), planning is *charging* (opportunity cost against later requests), rectification is *price-consistent* (same price as the plan, pay-per-look inspection). This separates routing quality from budget adherence in a way per-request greedy routers cannot.

## Results
On the **Azure Conversation** and **BurstGPT** traces, CoordRoute improves total satisfaction by **18.72%** over the strongest existing router.

## Relevance to Our Domain
A concrete architecture for cost-controlled LLM gateways serving many agents/workloads under a fixed spending cap or private-cluster capacity: shift from "best model per request" to coordinated allocation that prices each choice against the future queue, with in-generation upgrade/downgrade as the safety valve. The relative-demand trick is reusable wherever absolute gain prediction is unreliable but historical routing decisions are logged.

## References
- Paper: https://arxiv.org/abs/2611.34161
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34161
