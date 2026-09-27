---
title: Jev-Mobile — Decoupling VLM Planning from Lightweight Execution for Mobile
  GUI Agents
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2609.30186
date: 2026-09-27
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Jev-Mobile: Jev as an Executor for Mobile GUI Agents

## Overview

Most autonomous mobile GUI agents call a vision-language model (VLM) at *every* interaction step — both to plan and to ground actions — which makes them slow and expensive. Jev-Mobile (Zhang, 2026) inverts the frequency split: **low-frequency VLM planning + high-frequency lightweight execution**. The VLM specifies local goals; the accessibility tree defines a structured executable action space; and *Jev* — a fast typed decision model — repeatedly selects concrete actions within that space. Multiple GUI actions execute under a single VLM decision, cutting expensive inference while keeping interaction adaptive.

## Problem Statement

Step-wise VLM agents pay full VLM latency and API cost per tap/swipe/scroll. On long task sequences this dominates both wall-clock time and serving cost, even though most individual steps are low-level (pick the next widget from a known set) rather than genuinely requiring visual reasoning. The question: can you keep the VLM in the loop only for *goals* and delegate step-level action selection to a cheap model without losing task success?

## Key Contribution

- **Frequency-decoupled architecture**: VLM = goal specifier (rare), accessibility tree = structured action space, Jev = fast typed decision executor (every step).
- **Competitive accuracy at much lower cost**: on the full AndroidWorld suite, 79% task success vs. 78% for SeeAct-V and 84% for a Step-wise VLM baseline — i.e., near-parity with the expensive baseline.
- **Substantial efficiency gains among successful trajectories**: −32.7% mean end-to-end execution time and −73.4% mean model API cost relative to Step-wise VLM.

## Technical Approach

The design has three layers: (1) a VLM observes the screen and emits *local goals* (coarse intent, e.g., "open settings"); (2) the device accessibility tree is parsed into a structured action space — typed, enumerable actions rather than free-form pixel coordinates; (3) Jev, a fast decision model that maps natural-language state/goals to choices over finite option sets, selects concrete actions repeatedly until the goal completes. Because the action space is structured and typed, the cheap executor doesn't need visual grounding at every step — it reasons over widget names and types from the accessibility tree.

## Results (AndroidWorld)

| System | Task success | Mean E2E time (successful trajs.) | Mean API cost (successful trajs.) |
| --- | --- | --- | --- |
| Jev-Mobile | 79% | −32.7% vs Step-wise VLM | −73.4% vs Step-wise VLM |
| SeeAct-V | 78% | — | — |
| Step-wise VLM baseline | 84% | reference | reference |

## How to Apply This Pattern

If you're building GUI/browser agents with latency or cost constraints:

1. **Split planning from grounding by frequency** — reserve the expensive multimodal model for goal-level decisions; let a cheap typed decision model handle step selection.
2. **Use structured action spaces, not pixels** — accessibility trees (mobile) or DOM structures (web) give enumerable, typed actions that small models can select over reliably without vision at every step.
3. **Measure cost on successful trajectories only** — failed runs inflate mean latency/cost; report both overall success and per-successful-run efficiency to separate "works" from "affordable."

## Relevance to Our Domain

A concrete, reusable architecture pattern for agent infrastructure: the *planner/executor frequency split* generalizes beyond mobile GUIs to any tool-using agent where most steps are low-level selection rather than reasoning. It also validates typed decision models (Jev-style) as a practical middle layer between full LLM calls and hardcoded rules — relevant to our agent-architecture coverage alongside harness-design work.

## References

- Paper: https://arxiv.org/abs/2609.30186 (Linghua Zhang — 2026)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.30186
