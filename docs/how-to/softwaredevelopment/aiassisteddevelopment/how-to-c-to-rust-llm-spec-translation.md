---
title: C-to-Rust Translation — Iteratively Generating Natural-Language Specs to Drive
  LLM Porting
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
# How to Drive LLM C-to-Rust Translation with Iteratively Generated Natural-Language Specs

## Overview

This Edinburgh paper (Zhiyuan Li, Mark Harman, Jianfeng Ren et al.) tackles a gap in LLM-based C-to-Rust migration: code translation quality depends heavily on the *natural-language specification* given to the model, and most legacy C code has none. Their answer: don't wait for humans to write specs — **generate them from the code itself, iteratively refine them with human feedback, then use them to drive translation**.

## When to Use This

You are porting legacy C (no or stale documentation) to Rust with an LLM, and direct translation produces code that compiles but misrepresents intent. Attaching a good spec measurably improves both translation correctness and human usability of the result.

## Procedure

1. **Extract initial specs from code.** Prompt the LLM to produce natural-language descriptions of each C function's behaviour, working from the implementation and its context — no documentation required.
2. **Iterate with human-in-the-loop refinement.** Developers review and correct the generated specs; the loop repeats, each round sharpening pre/post-conditions, edge cases, and data invariants. The spec is the human leverage point, not the code.
3. **Translate against the refined spec.** Feed (C code + approved spec) to the LLM to generate Rust; the spec constrains semantics and reduces silent behaviour drift.
4. **Validate and feed back.** Compilation and test failures are routed back as feedback for both spec and code repair, not just code patches.

## Evidence Base

Evaluated on **10 real-world open-source projects (~80 files)** with **10 participants**, measuring translation quality and usability against baselines without spec generation.

## Pitfalls

- **Spec hallucination**: an unreviewed generated spec can encode the LLM's *misreading* of the C code — translation then confidently reproduces the wrong semantics. The human refinement loop is mandatory, not optional.
- Specs written at the wrong abstraction level (restating code) add no value; corrections should push toward intent and contracts.

## Relevance to Our Domain

Provides a concrete, reproducible workflow for AI-assisted migration projects — and a general principle for our AI-assisted-development coverage: *invest in the intermediate natural-language artifact*, because it is where human oversight compounds across translation, review, and repair loops.

## References

- Paper: https://arxiv.org/abs/2611.17581
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17581
