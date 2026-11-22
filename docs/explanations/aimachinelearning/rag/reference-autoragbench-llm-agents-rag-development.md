---
title: 'AutoRAGBench: A Benchmark for LLM Agents Automating RAG System Development'
diataxis: Explanation
domain: ai-machine-learning
topic: rag
source: arXiv
source_url: https://arxiv.org/abs/2611.25582
date: '2026-11-22'
keywords:
- knowledge-base
- rag
- ai-machine-learning
- explanations
---
# AutoRAGBench: A Benchmark for LLM Agents Automating RAG System Development

## Overview

AutoRAGBench is, to the authors' knowledge, the **first benchmark that evaluates LLM agents developing RAG systems from scratch in an open code space**: no starter code, no prescribed strategy — the agent analyzes task data, implements retrieval pipelines, and iteratively refines them from experimental feedback. Building effective RAG takes substantial expert engineering that varies by task and domain; AutoRAGBench measures how much of that loop today's agents can genuinely automate.

## Benchmark Specification (Reference)

| Parameter | Value |
|-----------|-------|
| Tasks | **9** RAG system development tasks |
| Setting | Open code space, build from scratch — no starter code, no prescribed strategies |
| Compute budget | **6 hours on a single H800 GPU** per task |
| Agent loop | Analyze task data → implement RAG pipeline → iteratively refine using experimental feedback |
| Configurations evaluated | **9 agent configurations** |
| Metrics | Effectiveness of resulting RAG systems + analysis of *development trajectories* (not just final scores) |
| Top result | **GPT-6.1 Sol with Codex CLI: 56.1 average** |
| Human baseline | Composite **Human-SOTA: 44.4 average** |
| Iteration result | Starting from a human-designed system on 7 tasks, GPT-6.1 Sol + Codex CLI improves by **+16.6 points on average** |

## Key Findings

- LLM agents **can automate effective RAG system development**: the best agent beats the composite human-SOTA baseline (56.1 vs 44.4).
- Agents also **improve on human designs** when given them as a starting point (+16.6 avg on seven tasks) — automation extends to the iterative-refinement phase, not just cold-start construction.
- Trajectory analysis distinguishes agents that converge from those that thrash — development process is scored alongside outcome.

## Relevance to Our Domain

Sets the current bar for "can an agent build my RAG stack?" — directly applicable to automating retrieval engineering for this KB's own corpus and for advising on RAG build-vs-buy decisions. The 6-hour/single-GPU budget framing is also a useful cost model for agent-run ML engineering tasks.

## References
- Paper: https://arxiv.org/abs/2611.25582 (cs.CL, cs.AI, cs.IR — Hang Zhang et al., 2026-11-19)
- Related in vault: ai-machine-learning/rag notes on hybrid search and retrieval evaluation
