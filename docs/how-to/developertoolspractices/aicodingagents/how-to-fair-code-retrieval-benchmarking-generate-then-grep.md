---
title: 'Embeddings vs. Grep: Rethinking the Dense Advantage in Code Search'
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.20455
date: 2026-11-17
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Embeddings vs. Grep: Rethinking the Dense Advantage in Code Search

## Overview

Code-search benchmarks show dense encoders far ahead of BM25, yet coding agents work well with plain `grep`. What is the "dense advantage" actually measuring? The authors build **Repo-Premium**, a realistic repository-level benchmark, and trace most of the advantage to evaluation artefacts rather than genuine semantic superiority.

## When to use this

You are choosing (or benchmarking) a retrieval backend for a coding agent's code-search tool — embeddings, BM25/lexical, or hybrid.

## Procedure

1. **Benchmark realistically**: rank *files* in *real, recent* repositories — Repo-Premium uses Python, JavaScript, TypeScript, Go, Rust and Java with pull requests from 2022–2026, both curated and *raw* (agent-style) queries, over a preregistered pool of 91 repositories. Avoid the classic traps: curated queries, aged code, and a handicapped BM25.
2. **Check your lexical baseline is fair**: two artefacts inflated the dense advantage — splitting files into chunks for BM25, and counting edited tests as relevant results.
3. **Before preferring dense, try generate-then-grep**: expand queries that lack the code's rare identifiers with **LLM-written identifiers**. This helps BM25 far more than dense retrieval, letting BM25 **match dense in every Python pool** — even on PRs opened *after* the LLM's release (no contamination).
4. **Don't try to predict per-query winners**: no method tested predicts which retriever wins a given query — so don't build a router on that hope.
5. **Adopt the three guidelines**: (a) measure dense gains against a *fair* lexical baseline; (b) **fuse dense with BM25**; (c) **add the code's own words to queries** that lack them.

## Results

- The dense advantage decomposes into evaluation choices + queries lacking rare identifiers.
- Generate-then-grep closes the gap entirely on Python pools.
- Benchmark: https://huggingface.co/datasets/hq-bench/repo-premium

## Relevance to Our Domain

Validates the grep-first retrieval many of our coding agents already use, and gives an evidence-based recipe for retrieval tooling decisions: fair baselines, hybrid fusion, and LLM-assisted query expansion instead of wholesale embedding replacement.

## References

- Paper: https://arxiv.org/abs/2611.20455 (cs.SE — Xue, Zhang, Liao, Qin, Mu, Yu)
- Related: `explanation-prince-bayer-agentic-rag-context-harness-engineering.md` (agent-architecture), `ai-machine-learning/rag/`
