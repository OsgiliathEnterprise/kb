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

## Verified Details (added 2026-10-10)

- **Scale**: 894 queries total — 207 `core_query` instances plus 687 `subfield_query` instances — over a retrieval corpus of **190,896 papers** (references resolved from the source papers plus ~181K additional arXiv papers from 2020–2024 across major CS categories). Each query also ships with hard-negative documents: related to the query but *not* credited by the authors.
- **Topical similarity is a weak signal**: catalyst papers are no more similar to the query than related papers the authors explicitly rejected — which is why repeated agent queries through a similarity-based retriever don't help (42% vs 48%).
- **Retriever comparison**: general-purpose dense retrievers perform best, yet place only ~39% of author-identified inspiration papers in the top 20 for CoreQ; scientific-document retrievers (SPECTER2, OpenScholar) trail by ≥16 points on CoreQ and ≥27 on SubQ at Recall@20.
- **Data pipeline**: needs only a source paper's arXiv ID to produce author-reviewable draft data (arXiv API metadata + full-text parse → one-hop citation graph), so the benchmark can be refreshed with newly published papers as older instances leak into newer models' training data — keeping it ahead of model knowledge cutoffs.
- **Code & project page**: [github.com/stanford-iris-lab/ScholarCatalyst](https://github.com/stanford-iris-lab/ScholarCatalyst) · [ohmyksh.github.io/project/ScholarCatalyst/](https://ohmyksh.github.io/project/ScholarCatalyst/)

## Relevance to Our Domain

For anyone building research-assistant or literature-survey agents, ScholarCatalyst is both a benchmark and a cautionary tale: wrapping a retriever in an LLM agent loop does not automatically beat the retriever alone on expert-judged relevance tasks. The author-annotation pipeline is also a reusable methodology for building gold-standard retrieval datasets where "relevant" means "would have advanced this specific project," not just "topically similar."

## References

- Paper: https://arxiv.org/abs/2610.02202
- Code: https://github.com/stanford-iris-lab/ScholarCatalyst · Project page: https://ohmyksh.github.io/project/ScholarCatalyst/
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.02202
