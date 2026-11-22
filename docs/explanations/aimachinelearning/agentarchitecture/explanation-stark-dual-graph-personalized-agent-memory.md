---
title: 'STARK: Moving towards Personalized Agents That Truly Learn and Remember'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.25705
date: '2026-11-22'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# STARK: Moving towards Personalized Agents That Truly Learn and Remember

## Overview

STARK is a **dual-graph long-term memory architecture** for personalized agents. Its core move: treat user events not just as nodes to be recalled, but as **edges connecting behavioral insights** — so the memory stores not only *what happened* but *how each experience shaped the user's behavioral patterns*, instead of leaving the "why" to be re-derived by the LLM on every query.

## Problem Statement

Current agent memory architectures capture what happened and leave the reasoning of why it happened to be derived later by the underlying LLM, and they **silo knowledge within individual users** — one user's experience never informs another's, and cold-start users get nothing. Long-horizon personalization also pays a retrieval tax: repeatedly traversing episodic history to re-infer insights that should have been consolidated once.

## Architecture: Two Graphs

- **Episodic Graph** — records interactions as episodes linked **temporally, causally, and semantically**.
- **Insight Graph** — represents **LLM-extracted behavioral signals, scored by how many events support them**, with insights connected *by the very events that led to them* (events-as-edges).
- **Inference**: behavioral knowledge is retrieved **directly from insight nodes**, grounded by their supporting event-edges — no repeated episodic traversal.
- **Cross-user transfer**: the event-as-edge structure projects naturally into a **relational embedding space**, so users in shared contextual circumstances can transfer knowledge — enabling inference of missing insights for **cold-start users**.

## Results

- **LongMemEval** (information extraction): **+1.48 judge score** over state of the art.
- **LoCoMo** (open-domain questions): **+0.93** over SOTA.
- **LongLaMP** (public abstract-generation, cross-user transfer): open-ended judge scores **+0.7** and **ROUGE-L +3** at **5% graph sparsity**.

## Relevance to Our Domain

Directly relevant to our agent-infrastructure coverage: the insight-scored-by-supporting-events design is a concrete pattern for turning raw agent logs into durable, queryable behavioral knowledge, and the relational projection offers a principled route to personalization without per-user cold-start data.

## Context & Related Work

- **Benchmark landscape**: the LongMemEval line is moving fast — **LongMemEval-V2** (arXiv:2605.12493, https://arxiv.org/abs/2605.12493) extends the original suite toward harder long-term agent-memory evaluation; STARK's +1.48 judge-score delta is measured against the SOTA on the original LongMemEval, so results should be re-checked when V2-style evaluations become standard.
- **Graph-native memory** is an active parallel track: e.g., a graph-native **bitemporal memory store** for agents (arXiv:2607.26520, https://arxiv.org/abs/2607.26520) explores time-travelling episode/insight separation. STARK's distinguishing bet is *events-as-edges* — support-count-scored insight nodes — which simultaneously cuts the retrieval tax and enables the relational projection used for cold-start transfer.
- Practical caveat: the Insight Graph depends on **LLM-extracted** behavioral signals, so insight quality inherits the extractor's failure modes (hallucinated patterns, stale insights as user behavior drifts); support-count scoring mitigates but does not eliminate this.

## References
- Paper: https://arxiv.org/abs/2611.25705 (cs.CL, cs.AI, cs.IR — Aryan Jain, Abhishek Jha, Anish Nediyanchath, Promod Yenigalla, 2026-11-19)
- LongMemEval-V2: https://arxiv.org/abs/2605.12493
- Graph-native bitemporal memory store: https://arxiv.org/abs/2607.26520
- Related in vault: [[explanation-jetriever-utility-memory-retrieval]] (retrieval side of agent memory)
