---
title: 'Kaer: Security-Aware Replanning for Multi-Agent Systems'
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.24839
date: 2026-11-19
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# Kaer: Security-Aware Replanning for Multi-Agent Systems

## Overview
In orchestrator-based multi-agent systems (MAS), the orchestrator plans, coordinates, and **dynamically revises the plan from agent feedback** — and that feedback path is an unguarded attack surface: a malicious agent can embed instructions in its feedback to **hijack the replanning process**. Kaer (Mallick, Rose, Laws, Oprea, Nita-Rotaru — Purdue/NC State) makes replanning safe by **never letting raw agent feedback reach the planner**, and by constraining how plans may be revised.

## Problem Statement
Existing MAS defenses cover per-tool access control or static pre-execution policy — the **replanning phase itself is unsecured**. An adversarial worker agent that reports a (real or fabricated) failure gets the orchestrator's attention at exactly the moment the plan is malleable.

## Key Contribution
- **Abstract failure templates**: diagnostics from agents reach the replanning procedure *strictly through fixed abstract templates* — free-form agent text cannot steer the planner.
- **Deterministic repair operators**: plan revisions are restricted to a fixed set of deterministic repair operators rather than open-ended LLM re-planning.
- **Policy-checked plans**: every revised plan must satisfy preset policies before execution.
- **Cintra benchmark**: simulated user tasks that require replanning, each paired with adversarial objectives targeting the replanning phase — measures both task completion and vulnerability to replanning exploits.

## Results
Evaluated on Cintra against **Magentic-One** (undefended MAS) and **ControlValve** (state-of-the-art defense):
- Kaer achieves **higher robustness than both**, while **maintaining utility comparable to ControlValve**.
- Cost: abstract failure templates **slightly constrain utility** on select tasks — the price of stripping free-form text from the feedback channel.

## Threat Model & Design Detail (verified against arXiv v1, 2026-11-26)

- **Trigger condition**: replanning matters when *tasks cannot be fully specified in advance* — precisely the regime where orchestrator MAS are deployed, so the vulnerable phase cannot simply be disabled.
- **Attack primitive**: malicious agents embed instructions **within their failure feedback**; reporting a real or fabricated failure is the entry point, landing at the moment the plan is most malleable.
- **Defense triad**: (1) diagnostics flow to the replanner strictly via **abstract templates**, (2) revisions restricted to **deterministic repair operators**, (3) every modified plan must satisfy **preset policies** before execution.
- **Cintra** measures two axes jointly: task completion rate *and* system vulnerability to replanning exploits by malicious agents.
- arXiv: submitted 2026-11-18, cs.MA (also cs.LG), CC BY 4.0, DOI 10.48550/arXiv.2611.24839.

## Why It Matters
- Identifies **replanning as a distinct, previously unsecured attack phase** in orchestrator MAS — an architectural gap that per-tool ACLs cannot cover.
- The design principle generalizes: *untrusted agent output should travel as typed, template-bound diagnostics, never as prose into a planning prompt*, and revisions should be drawn from a closed operator set.
- Pairs naturally with single-agent control-flow enforcement (SkillCFI): Kaer secures the **orchestrator feedback loop**, SkillCFI secures the **skill execution loop**.

## Related
- [[explanation-skillcfi-control-flow-integrity-agent-skills]] — CFI enforcement at the skill layer; complementary loop
- [[how-to-pipette-purple-team-prompt-injection-defense]] — training-time hardening vs. Kaer's architecture-level containment
- [[explanation-checkco-checkpoint-coordinated-load-balancing]] — orchestrated execution without the trust gap

## References
- Paper: https://arxiv.org/abs/2611.24839
- Primary class: cs.MA (also cs.LG)
- Baselines: Magentic-One, ControlValve; benchmark: Cintra
