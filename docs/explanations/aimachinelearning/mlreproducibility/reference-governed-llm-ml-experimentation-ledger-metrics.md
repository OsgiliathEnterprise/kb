---
title: 'Evaluating Governed LLM-Driven ML Experimentation: Lifecycle, Provenance,
  and Failure Metrics'
diataxis: Explanation
domain: ai-machine-learning
topic: ml-reproducibility
source: arXiv
source_url: https://arxiv.org/abs/2611.23678
date: 2026-11-19
keywords:
- knowledge-base
- ml-reproducibility
- ai-machine-learning
- explanations
---
# Evaluating Governed LLM-Driven ML Experimentation: Lifecycle, Provenance, and Failure Metrics

## Overview
Autonomous agents that run ML experiments are typically judged only by the best score they reach — which says nothing about *how* that score was reached. This paper (arXiv:2611.23678) proposes and operationalizes **process evaluation** for LLM-driven experimentation: a governed harness with a control plane and an append-only trial ledger, plus governance metrics computed from that ledger, validated across 1,445 trials on six ML tasks.

## Purpose
Provide a specification-style reference for evaluating agentic ML-experimentation systems on their experimental *process* — edit discipline, failure retention, and traceability — alongside their outcome scores.

## Harness Architecture (Reference)
| Component | Responsibility |
|---|---|
| **Control plane** (not the LLM) | Owns each trial's lifecycle end-to-end |
| **Edit-scope checker** | Verifies the agent stayed within files it was allowed to edit |
| **Keep/discard decider** | Makes retention decisions outside the proposing LLM |
| **Append-only ledger** | Exactly one record per trial; source of truth for all metrics |
| **Reproducibility hashes** | Reveal silent state failures (e.g. broken resets) |

## Governance Metrics (Reference)
- **Invalid-action rate** — fraction of proposed actions violating the contract.
- **Repeated-bad rate** — recurrence of known-bad proposals (ablations show its dependence on memory is task-dependent).
- **Provenance completeness** — every keep/discard decision traceable to its evidence.

## Validated Scope
- Six ML tasks, from synthetic logistic regression to language-model training; the **same contract applied unchanged**.
- **1,445 trials total; ledgers released** so every reported number can be recomputed.

## Failure Modes the Ledger Exposed (invisible to task scores)
1. A no-memory arm where **all 120 trials failed** while the score narrative continued.
2. A benchmark adapter whose bounded proposal space silently ran out.
3. A **reset failure** caught only by reproducibility hashes; affected campaigns were rerun.
4. Matched counterfactual: a success-only logging loop left **43 of 50 trials unrecorded**; the governed ledger recorded all 50.

## Relevance to Our Domain
A concrete blueprint for our MLOps and agent-architecture notes: treat the experiment harness — not the model — as the trust boundary. The three governance metrics and the append-only-ledger pattern are directly adoptable in our automated-ML pipelines and in our broader "verifier/process integrity" theme.

## References
- Paper: https://arxiv.org/abs/2611.23678
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23678
- Related: [[how-to-agent-evaluation-framework]]
