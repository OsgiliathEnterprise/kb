---
title: Anticipating Future Build Results with BuildPredictor
diataxis: Explanation
domain: developer-tools-practices
topic: ci-performance
source: arXiv
source_url: https://arxiv.org/abs/2611.26476
date: 2026-11-20
keywords:
- knowledge-base
- ci-performance
- developer-tools-practices
- explanations
---
# Anticipating Future Build Results with BuildPredictor

## Overview
Frequent CI integration is a double-edged sword: every commit triggers a full assemble-and-test cycle, and much of that compute is spent on builds that were going to fail (or trivially pass) anyway. BuildPredictor investigates predicting the outcome of a *future* CI build with machine learning, so that unnecessary build runs can be skipped and resources saved. The proposed model is deliberately simple — a random forest over commit- and history-derived features — and performs well both per-project and across projects.

## Problem Statement
CI costs scale with commit frequency, yet a large share of builds are wasted effort for minimal or doomed changes. Prior work on build-failure prediction is fragmented on feature choices; this study evaluates which feature families actually matter and how interpretability trades against accuracy.

## Key Contribution
- A random-forest build-outcome predictor using three feature families: **changes to source code, changes to build code, and code-complexity deltas**.
- Solid accuracy in both settings: **median MCC 0.82 intra-project, 0.86 holistic (cross-project)**.
- Feature-importance finding: **historical build-result information dominates** predictive power.
- Temporal analysis: the model **reaches peak performance quickly**, so long warm-up histories are unnecessary.
- Interpretability experiment: dropping the hard-to-interpret historical features still yields decent performance while making the model substantially more explainable.

## Technical Approach
Each incoming commit is encoded as a feature vector — diffs against source and build scripts, complexity-metric changes, plus statistics of recent build outcomes for the project — and the forest outputs predicted pass/fail for the prospective build. The practical deployment pattern is a gate: skip or de-prioritize builds predicted with high confidence, keeping the queue for builds whose outcomes are genuinely uncertain.

## Results
- Median MCC: 0.82 (intra-project), 0.86 (holistic).
- Most important features: historical build results.
- Fast convergence to peak accuracy over a project's lifetime.
- Acceptable accuracy retained with interpretability-friendly feature subset.

## Relevance to Our Domain
A quotable, quantified datapoint for our CI-performance and build-optimization notes (JIT Build Service, Lean-SLM): *build-history features alone drive an MCC-0.8+ predictor*, which validates cheap, model-light CI optimizations before reaching for heavier ML infrastructure. The interpretability/accuracy trade-off result is directly useful when CI gating decisions must be explained to developers.

## References
- Paper: https://arxiv.org/abs/2611.26476
- Related: [[reference-jit-build-service-reducing-build-costs]], [[explanation-lean-slm-ml-guided-ci-optimization]]
