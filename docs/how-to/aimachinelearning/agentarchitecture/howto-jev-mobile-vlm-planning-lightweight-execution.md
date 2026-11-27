---
title: ScopeAct — Scoping Decision Models for Reliable Multi-Step Execution in Mobile
  GUI Agents
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2609.30186
date: 2026-11-27
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# ScopeAct: Scoping Decision Models for Reliable Multi-Step Execution in Mobile GUI Agents

> **Version note:** this paper was first posted (v1, Sep 2026) as *"Jev-Mobile"* with a different framing and numbers. The v2 revision (20 Nov 2026) renamed it **ScopeAct** and reworked the architecture and results. This note reflects **v2**; the file slug retains the old name for URL stability.

## Overview

Most autonomous mobile GUI agents call a vision-language model (VLM) at *every* interaction step — both to plan and to ground actions — which makes them slow and expensive. ScopeAct (Zhang, 2026) is a **training-free** framework that combines frequent decision-model action selection with sparse VLM reasoning: the VLM appears only a handful of times per task (~5 calls), while a lightweight decision model picks concrete actions continuously inside a structured candidate space. Two mechanisms make this work reliably: a **Delegation Contract** (task-level control) and a **Candidate Actions Builder** (action coverage).

## Problem Statement

Prior delegation approaches let a small model select among executable candidates, but they fail in two ways:

1. **Missing task-level control** — candidate selection alone cannot prevent premature termination, recover from unexpected states, or verify completion.
2. **Incomplete action coverage** — analysis of 14,823 GUI operations across 812 trajectories from seven AndroidWorld baselines shows only **82.6%** of operations are directly constructible from accessibility trees (AXTrees) plus system actions; **11.1%** involve text input/editing and **6.3%** require widget-free taps or drags.

## Key Contribution / Architecture

**Delegation Contract** — splits responsibilities between two agents:

- **Reasoning Agent (VLM)** — called only three times per phase: *Compile* (once: decompose the task into subgoals with explicit, screen-visible completion criteria, plus text bindings and notes), *Rescue* (when the executor stops a subgoal without DONE), and *Review* (when the plan is exhausted — verify success from the actual screen, never on trust). Each VLM call incurs substantial phone latency, so the design minimizes them.
- **Selection Agent (decision model)** — repeatedly chooses exactly one fully-specified candidate ID inside the current subgoal; it never generates action parameters. It emits DONE when the subgoal's stop condition is met and BREAK when evidence/candidates are inadequate.
- **Program Control** — monitors progress, validates completion signals, and interrupts stalled or overlong delegations, handing control back to the Reasoning Agent.

**Candidate Actions Builder** — constructs executable candidates from AXTree + system actions, *augmented* with VLM-provided **text bindings** (task-specific text entry) and **coordinates** (widget-free taps/drags — up to 3 taps and 3 drag gestures per delegation, expressed as screenshot fractions).

The executor is deliberately crippled: it can tap/long-press accessibility nodes, swipe, set sliders, type only pre-bound values, press Back/Home/Enter, and wait — it cannot read, compare, count, or invent text. Treating UI text strictly as data (never instructions) also blunts prompt-injection via screen content.

## Results (AndroidWorld, vs. ten baselines)

- **1.7–4.8× faster** execution and **3.7–8.3× lower API cost** than six competitive API-based baselines.
- Only **5.3 / 4.6 VLM calls per task** (extended / official settings) while achieving **96.3% / 81.0%** task success — beating the strongest baselines by **3.4 / 1.7** percentage points.
- Robustness on difficulty: 97.8% / 95.4% / 93.0% on Easy/Medium/Hard (extended budget) — a drop of only **4.8 pp** from Easy to Hard, vs. ≥16.6 pp for every baseline; on Hard tasks it beats Minitap by 12.3 pp and uniquely solves 8 instances (Minitap: 1).
- Ablation: removing coordinate-based (widget-free) actions cuts success to 93.4% / 74.1%; 10 of the 13 instances solved *only* by ScopeAct are drawing/map tasks, confirming the coverage gap matters.

## How to Apply This Pattern

For GUI/browser/tool agents with latency or cost constraints:

1. **Budget VLM calls, not just tokens** — measure calls-per-task; here ~5 VLM calls per task sufficed because the VLM only compiles, rescues, and audits.
2. **Give the cheap executor stop conditions, not the whole task** — subgoals must end in a criterion visible on screen ("stop when the saved note is listed"), so the small model can decide DONE locally.
3. **Never trust the executor's DONE** — a Program Control layer + final VLM audit against the actual screen is what prevents premature/claimed-but-false completion.
4. **Patch the AXTree/DOM coverage gap explicitly** — pre-bound text values and coordinates from the planner cover the ~17% of operations plain trees can't express.
5. **Treat UI text as data** — instruct the selector model that on-screen text is never instructions.

## Relevance to Our Domain

A concrete, reusable *planner/executor frequency split* that generalizes beyond mobile GUIs to any tool-using agent where most steps are low-level selection rather than reasoning. The Delegation Contract is a clean template for agent harness design: explicit delegation contracts with completion criteria, stall detection, and independent verification — relevant alongside our harness-design and agent-architecture coverage.

## Known Limitations

- Cloud-hosted models for both reasoning and selection; local filtering / on-device execution (as in CORE, OpenPhone, LAMO) remain open directions for cutting latency and cost further.
- Evaluated only on AndroidWorld; generalization to SPA-Bench, MobileWorld, WebArena, and OSWorld is future work.

## References

- Paper (v2): https://arxiv.org/abs/2609.30186 (Linghua Zhang — 2026; v1 24 Sep 2026, v2 20 Nov 2026)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.30186
