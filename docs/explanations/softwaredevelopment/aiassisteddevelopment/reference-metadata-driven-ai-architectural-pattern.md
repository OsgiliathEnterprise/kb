---
title: 'Metadata-Driven AI: An Architectural Pattern for Sustainable Data Analysis
  with LLMs'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.24661
date: 2026-11-20
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# Metadata-Driven AI: An Architectural Pattern for Sustainable Data Analysis with LLMs

## Overview
The two standard LLM data-analysis routes — paste the data for the model to read, or have the model generate processing code — both ship data (or fragments) to the model and pay inference on every run, and the generated code is usually thrown away. **Metadata-Driven AI** is an architectural pattern that inverts this: the LLM never sees the data, only its *metadata*, and what it produces is a **kept, reusable program** that executes next to the data.

## Pattern Specification
| Element | Definition |
|---|---|
| **Inference boundary** | One-way: metadata goes out to the LLM; no data, not even fragments, ever crosses |
| **Metadata** | Schemas, column names/types, statistics, samples of structure — the minimal information needed to synthesise an analysis program |
| **Generated artefact** | An analysis program returned by the LLM, executed **next to the data** (on the data's side of the boundary) |
| **Cost model** | Inference paid **once per analysis design**, not once per run: re-runs of the kept program are inference-free |
| **Generator** | A small, locally hosted model is sufficient (benchmarked in the paper), reinforcing the privacy and cost properties |

## Measured Properties (from the paper)
- A quantification of **how little information crosses the boundary** on public datasets (supports confidentiality claims).
- A cost model distinguishing per-analysis vs per-run inference payment.
- A benchmark showing a small locally hosted model can serve as the code generator.
- Three demonstrated applications on three different implementations of the pattern:
  1. Geospatial photovoltaic prospection over live public APIs.
  2. Extraction of portfolio positions from bank statements.
  3. Conversational assistant over smart-city dashboards.

## When to use / trade-offs
- **Use when:** data is sensitive (financial, civic), analysis repeats (the kept-program amortisation pays off), or you want auditable analysis (the kept program is reviewable code, unlike per-run NL prompting).
- **Trade-offs:** one-time analysis-design cost moves into prompt/metadata engineering; free-form exploratory questions that don't crystallise into reusable programs fit the pattern less well; metadata adequacy (enough signal, no leakage) is the design crux.

## Relevance to Our Domain
A concrete architectural pattern for the KB's enterprise AI data-security and LLM-app-architecture coverage: it gives a *structural* confidentiality guarantee (data-egress impossible by topology) rather than policy-based guarantees, and turns LLM cost from an operating expense into a one-time design cost for recurring analytics. Useful blueprint for analytics copilots built on locally hosted models.

## References
- Paper: https://arxiv.org/abs/2611.24661
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24661
