---
title: 'Metadata-Driven AI: An Architectural Pattern for Sustainable Data Analysis
  with LLMs'
diataxis: Explanation
domain: AI-LLM
topic: GenAI-App-Frameworks
source: arXiv
source_url: https://arxiv.org/abs/2611.24661
date: '2026-11-22'
keywords:
- knowledge-base
- GenAI-App-Frameworks
- AI-LLM
- explanations
---
# Metadata-Driven AI: An Architectural Pattern for Sustainable Data Analysis with LLMs

## Overview
**Metadata-Driven AI** is an architectural pattern for LLM-assisted data analysis that (1) never lets data cross the inference boundary — only **metadata** reaches the LLM — and (2) converts each natural-language analysis request into a **kept, reusable program** that runs next to the data. Inference is therefore paid **once per analysis, not once per run**, and sensitive data never enters the model.

## Problem Statement
The two mainstream ways to analyze data with LLMs both have structural costs:
- **Data-to-model** (paste data/fragments into the prompt): data exposure, context limits, inference billed every run.
- **Model-writes-code**: the generated code is usually **discarded after the answer**, so each re-run repays inference, and data fragments still transit the model context.

## Pattern Specification
| Element | Detail |
|---|---|
| **Inference boundary** | One-way: only metadata (schemas, column names/types, statistics, samples of structure — not values) crosses to the LLM |
| **LLM output** | A program (e.g. transformation/analysis code) conforming to the metadata contract |
| **Execution site** | Next to the data, inside the trusted boundary |
| **Artifact lifecycle** | Program is **kept and reused**; inference cost amortized per analysis, not per execution |
| **Generator requirement** | Validated feasible with a **small, locally hosted model** (benchmark in the paper) |

The paper supplements the pattern with a **cost model**, a measurement of how little information crosses the boundary on public datasets, and three applications built on different implementations of the pattern:
1. **Geospatial photovoltaic prospection** over live public APIs;
2. **Portfolio-position extraction from bank statements**;
3. **Conversational assistant over smart-city dashboards**.

## Why It Matters (Analysis)
The pattern decouples three concerns usually tangled in "chat with your data" designs: **privacy** (data never leaves), **cost** (inference amortized via program reuse), and **auditability** (the kept program is inspectable, unlike per-run prompt outputs). Its local-small-model result suggests the generator need not be a frontier cloud API when the task is metadata-conditioned code generation.

## When to use / trade-offs
- **Use when:** data is sensitive (financial, civic), analysis repeats (kept-program amortisation pays off), or you want auditable analysis (the kept program is reviewable code, unlike per-run NL prompting).
- **Trade-offs:** one-time analysis-design cost moves into prompt/metadata engineering; free-form exploratory questions that don't crystallise into reusable programs fit the pattern less well; metadata adequacy (enough signal, no leakage) is the design crux.

## Relevance to Our Domain
A clean, citable **architecture-style entry** for our GenAI application frameworks and system-design coverage: a privacy-by-construction alternative to RAG/prompt-stuffing for structured data analytics, with an explicit cost model — useful when designing internal data-analysis tooling where data governance blocks prompt-based approaches.

## References
- Paper: https://arxiv.org/abs/2611.24661 (arXiv:2611.24661, submitted 2026-11-18; cs.SE; 29 pages)
- Authors: Renaud Pawlak, Armen Sulejmani, Jordi Cabot
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24661
