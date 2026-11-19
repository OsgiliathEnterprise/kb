---
title: Re-Testing LLM-Based C-to-Rust Translations Against Their Original C
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.23839
date: 2026-11-19
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# Re-Testing LLM-Based C-to-Rust Translations Against Their Original C

## Overview
Nearly every modern C-to-Rust translator is LLM-based, and each one reports a success rate produced by *its own* correctness check. This paper (arXiv:2611.23839) audits that practice: it surveys **34 LLM-based C-to-Rust translators**, finds only one reports testing its own check, re-tests the eleven that released runnable C and Rust — and finds defects in **all eleven**.

## Problem Statement
A success rate is only as good as its check. If translators self-grade with untested verification harnesses, published correctness numbers may systematically overstate real translation quality — a benchmark-integrity problem for the whole memory-safety migration literature.

## Key Contribution
- **First independent re-test** of every releasable LLM C-to-Rust translator: running the original C and the translated Rust on generated inputs, comparing **every output**, and counting a divergence only where the C has no undefined behavior (avoiding false positives from UB).
- **Headline audit result**: 160 defects across the eleven releases, **93 outright errors on ordinary inputs**. The translators' own checks had accepted 86 of the defective translations.
- **Diagnosis of why checks miss**: for 81 of the accepted-defective cases, the released check *never compared the two programs on any input that exposes the defect*; for three of the remaining five, it compared only part of the output.

## Technical Approach
Classical differential testing with an UB guard: the original C program is the oracle, generated inputs drive both programs, and full output comparison is required for a pass. This inverts the usual evaluation flow — the check itself is the thing under test.

## Results & Recommendations
The authors' concrete advice for translator authors:
1. Compare **every output** with the C's on inputs the repair loop never saw.
2. Check that a verifier actually **reaches its assertion** (a vacuously-passing verifier is a false oracle).
3. Release **exactly what the check accepted** — no post-hoc substitutions.
4. Report **how the check itself was tested**.

## Relevance to Our Domain
This is a cautionary reference for our AI-assisted-dev and evaluation notes: self-reported pass rates from LLM translation/repair pipelines are untrustworthy unless the verifier is itself validated. The differential-testing-with-UB-guard recipe is directly reusable in our CI for any LLM-driven code transformation, and echoes our broader "verifier integrity" theme in agent evaluation.

## References
- Paper: https://arxiv.org/abs/2611.23839
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23839
- Related: [[explanation-coder-wiggum-empirical-test-fixing]]
