---
title: Do Verifier Judgments Survive Abstraction? Measuring Verification Transport
  for LLM Agent Evaluation
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.18471
date: '2026-11-16'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Do Verifier Judgments Survive Abstraction? Measuring Verification Transport for LLM Agent Evaluation

## Overview
LLM-as-judge evaluation usually hides one variable: the verifier only ever sees agent traces at *one* level of representation. In practice, teams compress traces for cost or context-window reasons — environment outputs, action parameters, tool schemas get progressively abstracted away. The paper reframes judge reliability as a measurement problem: how much of a verifier's judgment **transports** as the trace representation degrades? It introduces *verification transport* — measuring verifier judgments across an explicit abstraction ladder and using agreement against a full-trace reference as the transport metric.

## Problem Statement
Judge agreement measured at full trace fidelity says nothing about agreement at the compressed representations actually used in CI dashboards and regression tests. Without a transport metric, evaluation pipelines silently degrade: cheaper trace views may quietly change which agent runs pass or fail.

## Key Contribution
- **Verification transport** as a formal evaluation-stability metric: judgments compared across abstraction levels via agreement with a full-trace verifier.
- **Abstraction ladder**: a controlled set of trace representations for tau2-bench airline tasks, each successively removing environment outputs, action parameters and tool schemas.
- **Three-model audit** (GPT-4o, Claude Sonnet 4.5, Gemini 2.5 Flash) showing transport varies dramatically by judge:
  - GPT-4o: near-perfect agreement with itself at full traces (pairwise Cohen's κ = 0.998, 98.8% raw agreement) — but agreement with the full-trace reference **collapses to 29.5%** at the heaviest abstraction.
  - Gemini 2.5 Flash: only **39.7%** full-trace agreement on tau2-bench, and its scores drift substantially across ladder levels.
  - Cross-judge stability is low: three-model pairwise κ between **0.166 and 0.411**.
- **Failure modes**: majority voting over ladder levels does **not** fix transport errors.
- **Mitigation**: a lightweight **verification-transport score** (based on task-critical metadata preservation) correlates strongly with observed agreement (Spearman ρ = 0.821) — a practical pre-flight check for trace pipelines.

## Relevance to Our Domain
Our agent regression suites use LLM judges over compressed traces to keep costs sane. This paper gives the vocabulary, the audit method, and a cheap screening score (verification-transport score) to decide *before* trusting a dashboard whether the chosen trace abstraction preserves verdicts. Related: [[reference-agentworld-executable-agentic-benchmark]], [[reference-mlagentops-bench]].

## References
- Paper: https://arxiv.org/abs/2611.18471
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18471
