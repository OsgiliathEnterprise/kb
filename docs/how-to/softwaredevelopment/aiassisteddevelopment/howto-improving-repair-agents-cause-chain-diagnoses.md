---
title: Improving Repair Agents with Cause-Chain Diagnoses
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: 'arXiv: Improving Repair Agents with Cause-Chain Diagnoses (arXiv:2611.30574)'
source_url: https://arxiv.org/abs/2611.30574
date: 2026-11-24
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# Improving Repair Agents with Cause-Chain Diagnoses (How-to)

## Overview

This paper (cs.SE, November 2026) tackles the **diagnosis step that precedes any repair**: starting from the same information a developer gets from a bug report, a repair agent must first figure out *how* the program fails before it can fix it. The authors' remedy is not a stronger planner but better *diagnosis input*: **FORECAST** infers a **cause chain** — a short sequence of execution features (conditions, data flow) inferred from comparing passing and failing test runs that explains how failing runs diverge — and appends it to the issue text the agent receives.

## Problem Statement

Repair agents resolve a growing share of real-world issues, but they share the developer's cold-start problem: the bug report alone doesn't say how the program fails. Without that causal picture, agents must localize the fault themselves, and repair success is bounded by that first step rather than by code-generation ability.

## How-to: Add Cause-Chain Diagnoses to a Repair Agent

1. **Collect passing and failing test executions** for the reported issue — the same tests the CI already produces.
2. **Infer the cause chain with FORECAST-style differential analysis**: compare the executions and extract a short sequence of execution features (conditions, data-flow relations) that explains where and why the failing runs diverge from the passing ones.
3. **Append the cause chain to the issue text** given to the agent. Because the diagnosis rides inside the issue, **any agent that builds its prompts from the issue works unmodified** — no harness or planner changes required.
4. **Evaluate on the same benchmark you use for the agent**: the paper's protocol (all 300 SWE-bench Lite issues × 5 repair agents × 2 models, plus repeated runs) shows how to price the diagnosis step against the resolution-rate gain it buys.

## Key Contribution

- **FORECAST**: infers cause chains from passing/failing test executions and injects them into the agent's issue prompt — an agent-agnostic diagnosis boost.
- Demonstrates that **diagnosis quality at the input stage** is a first-order lever on Agentic SWE repair success, independent of the agent itself.
- Robustness: gains **persist across repeated runs** and even for agents that already run the tests the diagnosis is derived from (the diagnosis is not just leaked test access).

## Results

Evaluated on **all 300 SWE-bench Lite issues**, with five repair agents and two models:

| Model | Resolved without diagnosis | With cause-chain diagnosis |
|---|---|---|
| Claude Haiku 4.5 (commercial) | 48.5% | **70.9%** |
| Qwen3.5 (open-weight) | 31.2% | **56.1%** |

Every agent resolved significantly more issues with the diagnosis; notably, **the open-weight model *with* diagnosis surpasses the commercial model *without* it**.

## Relevance to Our Domain

Our AI-assisted-development topic already covers coding-agent harness design and verification layers; this paper adds the diagnosis-input dimension: better FL output shapes the repair loop itself. It also aligns with our cause-chain/telemetry notes on fault detection — the same "explain the chain, don't just point" principle applied to bug fixing.

## References

- Paper: https://arxiv.org/abs/2611.30574
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30574 (not yet indexed at time of writing)
- Related in vault: [[explanation-harness-design-coding-agents]], [[explanation-claude-code-verification-layer]]
