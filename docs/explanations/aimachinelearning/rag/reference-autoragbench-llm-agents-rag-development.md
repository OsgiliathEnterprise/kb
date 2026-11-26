---
title: 'AutoRAGBench: A Benchmark for LLM Agents Automating RAG System Development'
diataxis: Explanation
domain: ai-machine-learning
topic: rag
source: arXiv
source_url: https://arxiv.org/abs/2611.25582
date: 2026-11-22
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

## Enrichment (KB Zookeeper, 2026-11-24 — verified against arxiv.org/html/2611.25582v1)
- **Authors/affiliations**: Hang Zhang*, Yuzhi Pan*, Ziyao Zhong*, Chaokun Wang et al. — School of Software, **Tsinghua University** + **Sina Weibo Corp** (*equal contribution). Submitted to IEEE.
- **Task design**: the 9 tasks span **five categories**; corpora cover domains such as **news and medicine**, with question types including **multi-hop reasoning and fact verification** — deliberately diverse because effective RAG strategy varies by corpus/question type.
- **Anti-cheat isolation protocol** (why the numbers are attributable): each build runs in a **fresh container with its own workspace**; the **test set stays outside the container**; agents may use only provided task data — no downloading external corpora/datasets; all development trajectories and submissions are **audited for leaked test answers or external data**.
- **Answer-model confound control**: each test question is answered by **five held-out answering models** independently, all using the *same retrieved evidence* from the agent's system; scores are averaged across models and **system rankings are checked for stability** against the answering model. Retrieval latency is also measured.
- **Trajectory scoring detail**: within each build, the last observed development score is compared against the first and best comparable scores — measuring both overall progress and **whether earlier gains persist** (vs. thrashing).
- **Additional baselines**: GPT-6.1 Sol + Codex CLI exceeds **Reference RAG by 9.7 points** and the composite Human-SOTA by **11.7 points** under their protocol, and **outperforms automated search over predefined RAG pipelines** (AutoRAG-style config search) in adapted comparisons — the open-code-space advantage over closed search spaces.
