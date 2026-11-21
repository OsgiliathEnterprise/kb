---
title: 'BuggyMLE: Scaling Machine Learning Engineering Difficulty with Bug Injection'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.25088
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# BuggyMLE: Scaling Machine Learning Engineering Difficulty with Bug Injection — Benchmark Reference

## Overview
BuggyMLE is a scalable framework for synthesizing **repository-level MLE-agent benchmarks** by having agents inject controlled bugs into working ML repositories. It addresses two gaps: MLE benchmarks confined to single-file edits, and saturated repository-level SWE benchmarks. Its centerpiece difficulty tool, the Code Complexity Index (CCI), lets you *dial difficulty up deliberately*.

## Code Complexity Index (CCI)
| Property | Detail |
|---|---|
| Basis | 10 structural features: repository scale, dependency depth, patch size |
| Predictive power | R² = 0.951 for average solve rates across 8 public coding benchmarks |
| Top predictors | Patch size and complexity |

## BuggyMLE Framework Facts
- Agents inject controlled mutations into working ML repositories.
- Scale: **6,600+ bug-injected MLE repository variants**, ~**260K injected lines**, built from **222 source repositories**.

## BuggyMLE-Bench-Lite (key benchmark data)
| Property | Value |
|---|---|
| Nature | First difficulty-graded, repository-level variant of MLE-Bench Lite |
| Models evaluated | 14 |
| Top solve rate, easiest tier | 95% |
| Top solve rate, hardest tier | **9%** |

## Training-Curriculum Results
Fine-tuned Qwen3.5-9B on a 3-level difficulty curriculum over 200 additional ML repositories:
- Rivals frontier models on BuggyMLE-Bench-Lite.
- **Transfer beyond ML**: SWE-bench Lite resolve rate 24% → 33%; LiveCodeBench v6 pass@1 69% → 71%.

## How to Use This Reference
- When evaluating coding agents on realistic MLE work (multi-file edits, shell access, training debugging), prefer difficulty-graded suites over saturated SWE benchmarks; CCI is a cheap pre-filter for task difficulty.
- The bug-injection-as-benchmark-synthesis pattern generalizes: generate difficulty, don't wait for repos to become hard.

## Relevance to Our Domain
The KB tracks coding-agent evaluation heavily; BuggyMLE gives (a) a validated difficulty metric, (b) a headroom-preserving benchmark for MLE agents, and (c) evidence that difficulty-graded ML-engineering training transfers to general software engineering — a strong signal for agentic-dev training curricula.

## References
- Paper: https://arxiv.org/abs/2611.25088
