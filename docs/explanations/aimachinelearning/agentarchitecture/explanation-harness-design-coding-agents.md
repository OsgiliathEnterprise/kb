---
title: An Empirical Study of Harness Design for Coding Agents
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2609.20804
date: 2026-09-20
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
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

## Experimental Setup — Details (enriched 2026-11-27 from paper full text)

*(Fan et al., UMass Amherst / Zoom Video Communications / Emory / UNC Charlotte; arXiv:2609.20804, 17 Sep 2026, cs.AI.)*

- **Models as capability probes**: three sizes of Nemotron-3 (30B, 120B, 550B) as a within-family capability axis, plus Mistral-Medium-3.5-128B as a cross-family comparison. Findings are framed as transferable diagnostics, not model-specific tuning.
- **Harness**: built from scratch around a ReAct loop (reason → action → observation). Permission handling, post-edit diagnostics, and stuck detection are held fixed as a common substrate so only the three ablated components vary.
- **Five context-management strategies**:
  - **T0** — no cross-turn compaction; terminates on context-window overflow.
  - **T1** — elides stale tool observations.
  - **T2** — T1 + external storage and a `recall_event` tool making elided content recoverable.
  - **T3** — LLM summarization without elision.
  - **T4** — staged: elision first, then LLM summarization if still needed.
- **Context-window budgets**: 32k / 64k / 96k / 128k tokens. Planning and action-space ablations run at 128k with T4, giving 176 matched settings total.
- **Trajectory analysis**: LLM-judge encoding of each action into fine-grained purpose codes (e.g. Explore-Setup, Investigate, Create, Modify, Environment-setup, eXecute, Test, Verify, Navigate, General), with explicit rules like "judge intent, not the leading token" and X (produce a result) vs T (invoke a real test framework) vs V (check an existing artifact).

## Practical Takeaways

1. Buy context-window budget before context-management machinery — managed strategies mostly matter at tight budgets, where their job is preventing overflow-induced termination so agents can reach code modification and verification.
2. If you do build compaction: **elision → summarization staging (T4)** is the sweet spot; recoverability (`recall_event`) is machinery models rarely use.
3. Treat planning as conditional: on-off decision depends on model strength (accuracy scaffold below a capability threshold, cost saver above it).
4. Match action space to the model's bash proficiency; on command-line-centric tasks, bash-capable models cut cost substantially with a bash-only interface.

## References
- Paper: https://arxiv.org/abs/2609.20804
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.20804
