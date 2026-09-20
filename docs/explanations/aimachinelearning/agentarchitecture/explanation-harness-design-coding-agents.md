---
title: 'An Empirical Study of Harness Design for Coding Agents'
diataxis: Explanation
domain: aimachinelearning
topic: agentarchitecture
source: arXiv
source_url: https://arxiv.org/abs/2609.20804
arxiv_id: "2609.20804"
date: 2026-09-20
keywords:
- knowledge-base
- agentarchitecture
- aimachinelearning
- explanations
visibility: public
---

# An Empirical Study of Harness Design for Coding Agents

## Overview

A coding agent's performance depends less on the model alone than on the *harness* — the execution loop and surrounding machinery that turns raw model capability into long-horizon software-engineering results. This paper is one of the first to decompose a harness into its individual components (planning, action space, context management) and measure each in isolation, rather than evaluating harnesses as monolithic black boxes. The result is a modular, component-level understanding of what actually drives coding-agent performance — and which design choices are worth their complexity.

## Problem Statement

Existing work evaluates coding harnesses end-to-end, so it's impossible to tell whether a given improvement comes from better planning, a richer action space, or smarter context management. Without component-level attribution, teams can't make informed trade-offs: should you invest in an elaborate summarization pipeline, a predefined tool set, or a larger context window? This paper fixes the execution loop and varies exactly three components to answer that question empirically.

## Key Contribution

- A **lightweight coding harness** with a fixed execution loop but three independently varied components: planning, action space, and context management — enabling clean ablations.
- **176 matched settings** across four models on SWE-Bench Verified and Terminal-Bench 2.1, spanning five context-management strategies, four context-window budgets, and targeted planning/action-space ablations.
- A **trajectory-level analysis** that explains *why* each component has its effect: context management extends trajectories without changing behavior, planning changes where trajectories stop, and action space changes the granularity at which code is written.

## Technical Approach

The harness holds the execution loop constant so that only the three components vary. Context-management strategies are compared head-to-head (rule-based elision, LLM summarization, staged combinations) under different window budgets. Planning is ablated on/off; action space is varied between predefined tools and a bash-only interface. Trajectory-level analysis then attributes performance differences to specific behavioral changes rather than treating the harness as opaque.

## Results

- **Context management** becomes increasingly valuable as the context-window budget tightens, with most of its benefit coming from *preventing context-overflow failures* (not accuracy).
- **Staging rule-based elision before LLM-based summarization** is the strongest overall efficiency strategy; making elided content recoverable adds machinery that models rarely use and yields no accuracy gain.
- **Planning** shifts role with model strength: an *accuracy scaffold* for weaker models but a *cost saver* for stronger ones, with little change in accuracy either way.
- **Predefined tools** help models with weak bash proficiency; bash-capable models operate effectively with a bash-only interface at substantially lower cost, especially on command-line-centric tasks.

## Relevance to Our Domain

This is a design guide for anyone building or tuning coding-agent harnesses. The headline lesson: don't bolt on complexity (recoverable elision, elaborate planning) without evidence it helps — much of the value comes from simple overflow prevention and matching the action space to the model's native strengths. It also reframes "planning" not as a universal accuracy boost but as a model-strength-dependent trade-off between accuracy scaffolding and cost reduction. The modular framework is directly reusable for evaluating future harness components.

## References
- Paper: https://arxiv.org/abs/2609.20804
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.20804
