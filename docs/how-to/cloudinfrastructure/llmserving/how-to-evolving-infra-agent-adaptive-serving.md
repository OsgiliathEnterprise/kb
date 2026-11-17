---
title: 'Evolving Infra: Agent-Adaptive LLM Serving at Scale'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.12304
date: '2026-11-17'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Evolving Infra: Agent-Adaptive LLM Serving at Scale

## Overview
How to operate a large LLM serving fleet that **adapts itself to agent workloads** instead of forcing them into a one-size-fits-all configuration. Evolving Infra, deployed on the ByteDance Seed serving fleet, is a closed-loop framework that treats serving parameters as *infrastructure that evolves*: a proposal agent generates configuration changes, a simulation layer evaluates them, and only validated changes ship to production.

## Problem Statement
Agentic workloads now dominate LLM inference demand, and their traffic characteristics (bursty, tool-call interleaved, long sessions, mixed prefill/decode ratios) differ sharply from chat traffic. Serving parameters tuned for general traffic are mismatched to them, and traffic keeps shifting under operator-defined assumptions — static tuning decays.

## Procedure (the closed loop, as deployed)
1. **Characterize agent traffic** across dimensions of the serving stack (request mix, session structure, latency sensitivity per workload class).
2. **Generate candidate optimizations with LLM agents** — the proposal agents read fleet telemetry and propose changes to serving parameters and scheduling policy.
3. **Evaluate proposals in simulation** before touching production; the simulation layer screens candidates for predicted fleet-wide benefit and regression risk.
4. **Promote only validated changes** through the staged rollout, closing the loop: each shipped change updates fleet behavior, which the agents observe for the next cycle.

## Results
- Serves **trillions of tokens per day across 100K+ GPUs**.
- **+23% serving capacity improvement** observed in production after the agent-driven optimization loop shipped changes.
- Operational effect: the framework keeps serving aligned with how agents actually execute as the pattern changes, rather than waiting for operators to notice drift.

## Gotchas
- The loop's safety rests on the simulation layer being trustworthy — a proposal agent is only as good as the simulator that vetoes it.
- Capacity here is fleet-wide goodput, not per-request latency; per-workload SLO regressions must be gated separately.

## References
- Paper: https://arxiv.org/abs/2611.12304
- Related: [[ROCm InferaSim: Cut LLM Serving Trial Costs and Deploy the Best Configuration]], [[ServerBench: How can your coding agents design specialized LLM serving systems?]]
