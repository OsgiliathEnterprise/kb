---
title: ScholarCatalyst — Benchmark for Retrieving the Papers That Inspire New Research
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2610.02202
date: 2026-10-04
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# ScholarCatalyst — Benchmark for Retrieving the Papers That Inspire New Research

## Overview

ScholarCatalyst is a retrieval benchmark that measures a capability where human scientists still clearly outperform AI systems: sensing which buried prior idea a new problem actually needs. The authors built it by asking 184 lead authors of 207 recent computer-science papers to label which candidate papers did (or could have) advance their completed projects, each with a detailed rationale — an automated pipeline makes this author annotation scalable. The retrieval task: given only the initial research question and the literature available when the project began, retrieve those catalyzing papers.

## Problem Statement

Even as AI systems make progress on open problems, scientists remain far ahead at *sensing* which prior work a new problem needs — an intuition that is hard to formalize but critical for scientific agents. Existing retrieval benchmarks measure topical relevance or citation proximity; none capture the counterfactual "this paper would have advanced this project" judgment that separates expert literature navigation from keyword matching.

## Key Contribution

- **Author-grounded ground truth**: 184 lead authors label which candidate papers catalyzed (or could have catalyzed) their projects, with detailed rationales — a gold standard no citation-based or embedding heuristic can replicate.
- A **time-controlled retrieval task**: retrieve the catalyzing papers using only literature available when the project began, preventing leakage from later work.
- A sobering **negative result** for current agentic search: an agent that calls the same retriever as a tool does *no better* than plain embedding retrieval (0.42 vs 0.48 Recall@20), and even an agent built on Claude Fable 5.1 — which may have seen the completed papers during training — reaches only 0.51 R@20.

## Technical Approach

The pipeline scales author annotation automatically, then constructs a retrieval task with author-provided judgments as ground truth. Systems are evaluated under strict temporal controls (only pre-project literature is searchable). The paper compares embedding retrieval against agentic search that wraps the same retriever in an LLM loop, isolating whether the *agentic wrapper* adds value over the underlying retriever.

## Results

- Agentic search: **0.42 Recall@20** vs embedding retrieval's **0.48** — the agent calling its own retriever as a tool underperforms direct use.
- Claude Fable 5.1-based agent: **0.51 R@20**, despite possible training-time exposure to the target papers.
- Conclusion: current models lack "expert intuition for searching broad corpora"; new training recipes are needed before scientific agents can take a half-formed idea and point to the prior research it needs.

## Relevance to Our Domain

For anyone building research-assistant or literature-survey agents, ScholarCatalyst is both a benchmark and a cautionary tale: wrapping a retriever in an LLM agent loop does not automatically beat the retriever alone on expert-judged relevance tasks. The author-annotation pipeline is also a reusable methodology for building gold-standard retrieval datasets where "relevant" means "would have advanced this specific project," not just "topically similar."

## References

- Paper: https://arxiv.org/abs/2610.02202
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.02202
