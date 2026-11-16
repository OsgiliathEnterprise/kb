---
title: PrivacyPR — A Dataset of Real-World Privacy Fixes for Benchmarking Privacy-Aware
  Code Review
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.18293
date: '2026-11-16'
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# PrivacyPR: A Dataset of Real-World Privacy Fixes for Benchmarking Privacy-Aware Code Review

## Overview
LLM code review has become standard practice, yet benchmarks still evaluate it mainly on style, bug-detection quality and API usage. Whether a review comment actually identifies a **privacy defect** in a diff has gone unmeasured. PrivacyPR is a curated dataset of **150 real privacy-related pull requests** from open-source projects — spanning web/mobile apps, backend services, and libraries across seven languages — each with an LLM-assisted review grounded in **GDPR data-minimization and storage-limitation principles**.

## Problem Statement
No existing code-review benchmark measures whether LLM reviewers can (1) detect privacy defects in realistic diffs, (2) justify findings with legal grounding, and (3) avoid noise from over-flagging. Without it, "AI-assisted review" quality on privacy-sensitive code is unverifiable.

## Key Contribution
- **150-PR privacy-fix dataset** with ground-truth privacy findings; per-PR legal grounding (GDPR minimization / storage limitation).
- **Two orthogonal scoring axes**: *finding correctness* (did the model spot the right privacy defect?) and *review quality* (usefulness/actionability of the comment) — separating detection from presentation.
- **Actionability controls**: measures over-flagging and noise, not just recall, so reviewers that flag everything are penalized.
- **Empirical baseline over six open-weight LLMs (2B–20B)**:
  - Finding detection: 0.46–0.70
  - Review quality: 0.42–0.64
  - Noise (false positives): 4.3–10.8 per review
  - Clear capability tiers by model scale — a ready-made leaderboard for privacy-aware review models.

## Dataset Facts
| Property | Value |
|---|---|
| Pull requests | 150 (real, open-source) |
| Sectors | web/mobile apps, backends, libraries |
| Languages | 7 |
| Legal grounding | GDPR data minimization, storage limitation |
| Evaluated models | 6 open-weight LLMs, 2B–20B params |

## Relevance to Our Domain
For AI-assisted DevOps pipelines, this is the first reference benchmark to wire privacy review into CI quality gates: use its two-axis scoring and noise metrics when selecting/configuring LLM reviewers, and its GDPR grounding template when writing review prompts for regulated codebases. Related: [[explanation-ai-generated-code-trustworthiness]].

## References
- Paper: https://arxiv.org/abs/2611.18293
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18293
