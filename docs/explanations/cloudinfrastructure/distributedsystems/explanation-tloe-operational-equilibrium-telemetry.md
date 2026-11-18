---
title: 'Top-Level Operational Equilibrium: When is the response of a distributed system
  predictable from its own telemetry?'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.20780
date: 2026-11-18
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# Top-Level Operational Equilibrium: When is the response of a distributed system predictable from its own telemetry?

## Overview

Systems across the edge-cloud continuum are continuously adapted — scaled, re-routed, given more or less capacity — and every adaptation rests on an expectation of how the system will respond. Yet operators **cannot tell from the telemetry they already collect whether that response is predictable**. This paper defines **top-level operational equilibrium (TLOE)**, an equilibrium notion for a running system stated *relative to the controls its operator declares*, and turns "is this system's response predictable from passive telemetry?" into a property with testable conditions.

## Problem Statement

Given a running system and a planned small control change (shift load, add capacity to a stage), can the response be predicted from passive telemetry alone? Telemetry answers this only when the system sits in a special regime — TLOE — and today operators have no way to know whether it does. The paper makes the regime explicit and characterizes when it holds.

## Key Contribution

- **TLOE**, defined relative to declared controls, with **three conditions**: (1) stationarity with time-scale separation, (2) sufficiency of a top-level aggregate for the controls, (3) time-reversibility of that aggregate.
- **Derivation, not choice, of the aggregate**: an aggregate satisfying conditions 2–3 exists **iff the minimal sufficient statistic of the controls is time-reversible** — so the coarsest admissible aggregate is derived rather than chosen.
- **Fluctuation-response predictability**: under the first two conditions, the response to a small control change follows from passive telemetry via the **steady-state fluctuation-response identity**, with a **conjugate observable fixed by the control type**: total work-in-progress for a load change, stage occupancy for a capacity change.
- **Exact results for exponential single-server chains with Poisson input**: TLOE holds exactly for **load control at every stable throughput**, but **never for capacity control of the first or last stage**.
- Diagnostic findings on reference models: a per-stage conjugate **overestimates early response ~3×**; blocking between stages breaks both conditions weakly; a **hysteretic autoscaler leaves no admissible aggregate at any reaction time computed**.
- **Per-condition tests**, plus the negative result that a static sufficiency test with an estimated top-level conjugate **has no power**, and quantified telemetry window lengths needed by the prediction and reversibility tests.

## Technical Approach

The framework treats predictability as a property of a triple — running system, declared controls, candidate top-level aggregate — rather than of the system alone. Sufficiency says the aggregate carries everything the controls need; time-reversibility is the structural property that licenses a fluctuation-response identity, letting passive telemetry substitute for active probing. The chain analysis (exponential single-server stages, Poisson input) provides exact held/never-held boundaries; reference-model experiments then probe what breaks the conditions (inter-stage blocking, hysteresis in autoscaler feedback) and how long a telemetry window each test requires.

## Results & Honest Limits

- Load control on stable-throughput Jackson-style chains: predictable from passive telemetry, exactly.
- First/last-stage capacity control: not predictable under TLOE — no admissible aggregate.
- Hysteretic autoscaling destroys the admissible aggregate entirely at every computed reaction time.
- **Evidence is on reference models; real telemetry validation is left to future work.**

## Relevance to Our Domain

Reframes observability as a *predictability certificate*: before trusting a dashboard to answer "what will happen if I scale this stage?", check TLOE's conditions — and beware the two silent killers it identifies, per-stage conjugates that 3× overestimate early response and hysteretic autoscalers that make prediction impossible. Directly relevant to autoscaling policy review, incident prediction, and capacity-change SOPs in kubernetes/observability topics.

## References

- Paper: https://arxiv.org/abs/2611.20780 (submitted 2026-11-16, cs.DC)
- Related: `cloud-infrastructure/incident-response` notes — prediction regimes this framework certifies or denies
