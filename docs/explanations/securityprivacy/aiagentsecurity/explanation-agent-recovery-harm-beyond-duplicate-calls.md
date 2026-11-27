---
title: 'Agent Recovery Gone Wrong: Measuring Harm Beyond Duplicate Calls'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.31554
date: '2026-11-27'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Agent Recovery Gone Wrong: Measuring Harm Beyond Duplicate Calls

**Authors:** Artem Trofimov, Boris Novikov (arXiv 2611.31554, submitted 2026-11-23, primary cs.AI)

## Overview
Code-executing LLM agents submit blocks of code that issue several API writes; when a block fails *after some writes have already taken effect*, the agent rewrites the block and continues. Trofimov & Novikov measure what that recovery loop actually does to external state when the failure arises naturally from the agent's own code: on recorded AppWorld trajectories, **a stratification-weighted 24.6% of confirmed partial executions are followed by a harmful recovery whose violation persists to the end of the run** — and duplicate-call detectors, the standard mitigation, catch only 41% of the harm.

## Problem Statement
Partial execution is invisible to the agent: some writes landed, the error message doesn't say which. Existing safety thinking focuses on duplicated effects from retries, but it was unknown how often recovery harms state in other ways — data deletion, wrong first-time writes — in *natural* (not injected) failure conditions.

## Key Contribution
- **First naturalistic measurement of recovery harm**: stratified random sample of 200 candidate episodes across **ten models** (AppWorld agents); **145** partial executions confirmed by database state; **30 of 143** confirmed partial executions with determinable outcome followed by harmful recovery that persists → weighted estimate **24.6%**.
- **Harm taxonomy**: two thirds of harmful recoveries duplicate an effect; the rest **delete user data or make wrong first-time writes** (e.g., ordering the wrong product) — harms no duplication detector was built for.
- **Detection gap quantified**: a repeated-call rule finds **75% of duplications but only 41% of all harm**.
- **Two idempotency-identity sources tested**: (1) model-supplied operation identifiers do *not* detectably reduce harm (small pilot, 17 episodes, one local model) because the model issues a *new* identifier for the same operation; (2) identity derived from call content, evaluated counterfactually, would have matched every harmful write in **14–18 of 30** harmful recoveries — but zero of the wrong-first-time-write cases — and would also have flagged task-required writes in **30 episodes** (unacceptable false-positive profile for a blunt gate).
- Derives **design requirements for safer agent recovery** from these measurements.

## Technical Approach
The study mines recorded AppWorld trajectories (a stateful app-simulation benchmark with a checkable database). Ground truth = database state confirms partial execution. Harm = recovery action whose violation persists at run end. Interventions evaluated: naive repeated-call detection; model-issued idempotency keys; content-derived operation identity (counterfactual replay on the sample).

## Results
| Measure | Value |
|---|---|
| Confirmed partial executions | 145 / 200 sampled episodes |
| Harmful persistent recoveries | 30 / 143 determinable (24.6% weighted) |
| Duplication share of harm | ~2/3 |
| Repeated-call rule coverage | 75% of duplications, 41% of all harm |
| Model-supplied idempotency keys | No detectable harm reduction |
| Content-derived identity | Catches 14–18/30 harmful writes; 0 wrong-first-writes; matches required writes in 30 episodes |

## Relevance to Our Domain
For agent infrastructure and DevSecOps automation (deploys, infra-as-code, API-writing agents): **retries-after-partial-failure are a top-tier state-safety risk that duplicate-call guards mostly miss** — 59% of real harm is invisible to them. Design rules: (1) side-effecting tool interfaces need transactional semantics or write journals that let the agent *query* what landed before rewriting a block; (2) don't trust model-generated idempotency keys — derive identity from call content but pair it with human/programmatic adjudication (its false-positive profile bars auto-blocking); (3) "wrong first-time write" is uncatchable by replay-based detectors — only pre-execution validation (dry-run / policy check) addresses it; (4) adopt persistence-to-end-of-run as the harm criterion in agent evals, not per-step violations.

## Caveats
- AppWorld simulation domain (app workflows); transfer to production APIs unmeasured.
- Idempotency-key pilot is small (17 episodes, one local model) — negative result is indicative, not conclusive.

## References
- Paper: https://arxiv.org/abs/2611.31554
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.31554
- Related in vault: security-privacy/ai-agent-security/ (The Detour Is the Danger / ARGUS — recovery-time security downgrade)
