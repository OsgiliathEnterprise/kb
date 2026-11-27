---
title: 'Verification Transport: Measuring Judgment Stability in LLM-Agent Evaluation'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.18471
date: '2026-11-17'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Verification Transport: Measuring Judgment Stability in LLM-Agent Evaluation

## Overview
LLM-based verifiers are usually evaluated for accuracy on a single representation of a trajectory. But in deployed agent systems, the same execution is observed through composed tools, delegation boundaries, and compacted histories — representations that change the **observability** of the evidence rather than the task itself. This paper introduces **Verification Transport**: a reliability test that measures whether verifier decisions remain stable under abstraction-induced observability changes.

## Problem Statement
When a trajectory is compressed, tool chains are collapsed, or sub-agent work is delegated, the judge sees a different view of an identical frozen execution. If verdicts drift across those views, an agent's evaluation score reflects the observer's representation rather than the agent's behavior — and no standard benchmark measures that.

## Key Contribution
- Formalizes **Verification Transport** as a first-class reliability property of LLM-agent evaluation.
- Controlled matched-view methodology: native, abstracted, and restored views of the **same frozen execution**, holding task, realized trajectory, outcome, ground-truth labels, evaluation criteria, verifier model, and prompting constant.
- Scale of the audit: **4 agent-evaluation benchmarks, 7 verifier backbones, 4 verification protocols, 3 abstraction boundaries** (including PlanRewardBench and AgentDojo, 754 trajectories).

## Results
- Substantial transport failure, up to **~31%** under macro abstraction and delegation.
- **Failure-mode split**: direct verification protocols fail with incorrect verdicts, while evidence-grounded and deliberative protocols fail through abstentions when observability is limited. **Lower transport failure rates do not necessarily imply greater reliability** — a protocol that abstains "survives" abstraction by refusing to judge.
- **Provenance restoration recovers 85.5% of transport failures** when the corresponding execution provenance can be restored; recovery drops when provenance is lossy or unavailable. This makes provenance plumbing (keeping the native view recoverable) the highest-leverage fix.

## Paper Metadata (enriched 2026-11-17)
- Full title: *"Do Verifier Judgments Survive Abstraction? Measuring Verification Transport for LLM Agent Evaluation"* — Disha Sheshanarayana, Sai Linisha Reddy Goli (Manipal University).
- arXiv:2611.18471 [cs.CL], submitted 2026-11-13; DOI 10.48550/arXiv.2611.18471.
- **Accepted at the NeurIPS 2026 Workshop "Who Verifies the Agents? Toward Reliable Agent Development"**.

## Relevance to Our Domain
Agent evaluation stacks routinely judge compressed trajectories (sub-agent reports, tool summaries). If judge stability is not measured, leaderboard-style claims and regression gates silently measure the abstraction layer. Practical takeaway: treat transport failure as a standing regression test, keep a native view in the loop, and remember that abstention is the dominant failure mode of evidence-grounded verifiers. Related: [[explanation-evidence-bound-multiagent-verification]].

## References
- Paper: https://arxiv.org/abs/2611.18471
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18471
