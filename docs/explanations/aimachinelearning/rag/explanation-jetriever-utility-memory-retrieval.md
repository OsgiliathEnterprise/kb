---
title: 'Jetriever: Shifting Agent Memory Retrieval from Similarity to Utility'
diataxis: Explanation
domain: ai-machine-learning
topic: rag
source: arXiv
source_url: https://arxiv.org/abs/2611.21478
date: 2026-11-17
keywords:
- knowledge-base
- rag
- ai-machine-learning
- explanations
---
# Jetriever: Shifting Agent Memory Retrieval from Similarity to Utility

## Overview

A useful memory need not resemble the question it helps answer. Jetriever replaces embedding-similarity search over an agent's memory store with **full-pool utility scoring**: every stored memory is ranked by an LLM's (Jev's) decision score for how useful it is to the current question. The result is a large jump on indirect queries where the gold memory shares little surface text with the question.

## Problem Statement

Vector/BM25 retrieval assumes the relevant memory looks like the query. Agent memory breaks that assumption: the decisive past exchange may be phrased completely differently from the question it unlocks. Similarity search therefore silently drops the memories that matter most for indirect reasoning.

## Technical Approach

- **Utility, not resemblance**: score the entire memory pool per question with a decision-score model, discarding ANN/similarity shortlists.
- **Affordability as a design constraint**: full-pool scoring is made cheap enough to be practical (~USD 0.00834 per question on InMind, ~USD 0.03103 on MemoryAgentBench).
- **Separating finding from ranking**: the evaluation distinguishes retrieving the gold memory into the top-50 from placing it at rank 1.

## Key Results

- **InMind (125 indirect-query tasks)**: gold exchange ranked first in **84.8%** of cases, versus **1.6%** for matched BM25 and **0.0%** for MiniLM when indexing user turns.
- **Finding vs ranking (20-question comparison)**: Jev and Qwen3.5 9B each find 90% of gold exchanges by rank 50 (Laya: 30%), but at rank one Jev reaches 85% vs 40% — ranking, not recall, is where similarity search and weaker rankers fail.
- **MemoryAgentBench (60-question proportional sample)**: four-dimension score 55.4% vs 44.3% for ReFind on the same questions.

## Relevance to Our Domain

For agent memory and RAG infrastructure, this reframes the retrieval layer: with cheap utility scoring, the "which memories do I even need" problem and the "which do I retrieve" problem decouple. Practical recipe: use full-pool LLM scoring when the memory pool is small enough to afford, and always measure rank-1 hit rate, not just recall@k.

## References

- Paper: https://arxiv.org/abs/2611.21478
- Related KB notes: [[explanation-lemmalog-datalog-memory-for-llm-agents]], [[explanation-claude-unified-memory-architecture]] (agent-architecture)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21478
