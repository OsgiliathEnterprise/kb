---
title: 'Dependable Long-Horizon LLM Agents: A Trajectory-Centered Empirical Study
  of Where Errors Enter and Which Controls Reach Them'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.13254
date: '2026-11-17'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Dependable Long-Horizon LLM Agents: A Trajectory-Centered Empirical Study of Where Errors Enter and Which Controls Reach Them

## Overview
A trajectory-centered **empirical reliability study** of long-horizon LLM agents. The unit of analysis is a whole execution trace, annotated with **30 error labels organized by stage** — the paper's core empirical question is two-fold: *where in a trajectory do errors actually enter*, and *which reliability controls can actually reach those points*.

## Study Design (lookup material)
- **30-label error taxonomy**, each label tied to a trajectory stage (perception/grounding, planning, action execution, state update, verification/termination...).
- **Manual trace annotation protocol** — human annotators label long-horizon executions, not final outcomes only.
- Analysis cross-tabs two axes: the stage where an error **enters** vs the control (guardrail, verification step, recovery mechanism) that could intercept it.

## Main Empirical Findings
1. **Most failures are not model-reasoning failures** — they originate in **scaffolding** (the harness around the model: tool plumbing, state handling, environment feedback), not in the LLM's reasoning core.
2. **Error distributions are stable across model classes** — the *shape* of the failure distribution persists across different underlying models, i.e. it is a property of agent architectures/scaffolds, not model quality.
3. **Most existing agent controls do not cover the observed error paths** — the controls teams actually deploy (retries, output validation, guardrails) intercept a minority of the stages where errors enter, leaving dominant failure paths unguarded.

## How To Use This
- **Prioritization table for agent reliability work**: fix scaffolding (tool contracts, state consistency, environment feedback fidelity) before swapping in a smarter model — model swap doesn't move the dominant failure mass.
- **Control-placement audit**: map your current guardrails onto the 30-label stage taxonomy; any stage with observed error entries and no reaching control is your coverage gap.
- The stability-across-models result makes the taxonomy a reusable evaluation lens for any long-horizon agent stack.

## References
- Paper: https://arxiv.org/abs/2611.13254
- Related: [[Agents, Think Only When it Helps]], agent guardrail stack notes in this topic
