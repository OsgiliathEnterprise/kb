---
title: 'JET: Just-Enough Exploration Tuning for Efficient Tool-Calling Agents in Repository-Level
  Question Answering'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.22539
date: '2026-11-18'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- how-to
---
# JET: Just-Enough Exploration Tuning for Efficient Tool-Calling Agents in Repository-Level Question Answering

## Overview
Choi, Han & Lee identify **over-exploration** in repository-level QA agents: LLM agents keep invoking tools (grep, read, search) even after the gathered context already suffices to answer. Worse, standard SFT on expert trajectories *propagates* the experts' over-exploration into the student model. **JET (Just-Enough Exploration Tuning)** is a fine-tuning recipe that trains the agent to stop exploring and answer the moment evidence is sufficient — cutting tool calls by 11–33% (self-generated trajectories) or 18–28% versus SFT (expert trajectories) while retaining nearly all answer quality.

## When to Use This
You fine-tune a tool-calling agent for repo QA (or similar gather-then-answer workloads) and see wasted tool round-trips inflating latency and inference cost — especially when distilling from expert traces that themselves over-explore.

## Steps (the JET recipe)
1. **Collect trajectories** — either expert demonstrations or the agent's own rollouts on repo-level QA tasks.
2. **Locate the sufficiency step** — for each trajectory, determine the earliest step at which the accumulated tool observations already contain enough information to answer the question correctly.
3. **Truncate at sufficiency** — cut the trajectory there, discarding the redundant later tool calls.
4. **Insert a rationale** — append a short explanation at the truncation point stating *why* the gathered evidence already justifies answering now.
5. **Weighted fine-tune** — fine-tune the model on these truncated trajectories with a **higher loss weight on the rationale tokens**, so the stop-when-sufficient judgment is the strongly-learned signal.
6. **Evaluate on both regimes** — measure tool-call count and answer score separately on self-generated vs expert-derived trajectories; JET should cut calls in both while keeping score.

## Concrete Results
- Two repo-level QA benchmarks, two open-weight **8B** models.
- Self-generated trajectories: **11–33% fewer tool calls**, score largely preserved.
- Expert trajectories: **18–28% fewer tool calls than vanilla SFT**, retaining most of SFT's score gain.
- Lower inference cost in both settings.

## Relevance to Our Domain
A cheap, reproducible efficiency lever for the coding-agent stacks we cover: over-exploration is directly observable in our own agent traces (repeated identical greps, re-reads of unchanged files). The truncate-at-sufficiency + rationale-upweighting pattern is a template applicable beyond repo QA — any tool loop with a definable "enough evidence" predicate. Related: [[explanation-modharness-rl-evolving-harness-programs]].

## References
- Paper: https://arxiv.org/abs/2611.22539
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22539
