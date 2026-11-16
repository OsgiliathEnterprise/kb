---
title: Natural-Language Specs for LLM C-to-Rust Translation — What Works and What
  Doesn't
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.17581
date: 2026-11-16
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# Beyond Source Code: Natural-Language Specifications for LLM-Based C-to-Rust Translation

> Corrected 2026-11-16 by KB Zookeeper: the first intake version mis-attributed the paper ("Edinburgh — Zhiyuan Li, Mark Harman, Jianfeng Ren"; "10 projects, ~80 files, 10 human participants"; a human-in-the-loop spec-refinement workflow). The actual paper is an automated three-setting evaluation study. Replaced with facts verified against the arXiv abstract page; diátaxis changed from how-to to explanation accordingly.

## Overview

"Beyond Source Code" (Biruk Tadesse, Lawrence Arkoh, Marcelo D'Amorim, Wesley K. G. Assunção; arXiv:2611.17581, 12 Nov 2026, cs.SE) asks whether **natural-language specifications** are a better input to LLM-based C→Rust translation than raw source code. Hypothesis: direct code translation makes LLMs preserve C-specific implementation choices — producing Rust that is functionally correct but verbose, `unsafe`-reliant, and non-idiomatic.

## Study Design

| Property | Detail |
|---|---|
| Corpus | **300 C programs** from the **IBM CodeNet** dataset |
| Models | GPT-5.2 and GPT-4o-mini |
| Settings | **code-only**, **specification-only**, **code-and-specification** |
| Metrics | functional correctness, maintainability, complexity, idiomaticity, unsafe-construct usage, cost |

## Key Findings (from the abstract)

- **Code-only**: highest test pass rate (**98.6%**) but Rust that mirrors C implementation patterns.
- **Specification-only**: most idiomatic, compact Rust — **~6× fewer `unsafe` blocks**, **2.4× fewer Clippy style warnings** — but **test pass rates as low as 86%** (best model) when specs are used without validation.
- **Spec + iterative test-based validation/refinement**: raises spec-only pass rate to **95.3%**.
- **Code-and-specification**: best balance — **98.3%** test pass rate with maintainability close to spec-driven output.

## Practical Takeaways

1. Don't feed only code if you care about idiomatic Rust: specs buy large idiomaticity/`unsafe`-hygiene wins.
2. Specs without a validation loop are dangerous: they silently encode misreadings, dropping correctness ~12 points. Attach automated tests and iterate on the spec — not just the code — until pass rates recover.
3. If one-shot quality matters, pass both code and validated spec.

## Relevance to Our Domain

A general principle for our AI-assisted-development coverage: *invest in the intermediate natural-language artifact*, but only with test-grounded validation — human review is not part of this study's loop, so budget for test infrastructure instead.

## References

- Paper: https://arxiv.org/abs/2611.17581
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17581
