---
title: Anticipating Future Build Results with BuildPredictor
diataxis: Explanation
domain: developer-tools-practices
topic: ci-performance
source: arXiv
source_url: https://arxiv.org/abs/2611.26476
date: 2026-11-25
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
Each incoming commit is encoded as a feature vector and the forest outputs predicted pass/fail for the prospective build. The practical deployment pattern is a gate: skip or de-prioritize builds predicted with high confidence, keeping the queue for builds whose outcomes are genuinely uncertain.

**Feature families** (five categories):
- **Commit metadata** — contributor type (Joblin/Bock taxonomy), day of week, time since last commit, developer experience.
- **Source-code changes** — diffs to source files.
- **Build-code changes** — diffs to the Maven `pom.xml`, extracted with BuildDiffer and counted per change category (e.g., dependency changes).
- **Code-complexity deltas** — CK metric suite changes.
- **Historical build results** — e.g., last build outcome per project/contributor.

**Study setup:** Java projects built with Apache Maven (BuildDiffer requires it). From a pool of 749 projects, 25 were selected via stratified sampling across five size strata; 34,141 commits were built, of which **24,198 were usable** (9,943 dropped for pre-Java-8/outdated-Maven issues). Builds ran `mvn clean package -DskipTests` with check toggles to isolate genuine build outcomes. The dataset is **imbalanced — 82% of commits build successfully**; build-label correctness was sampled at 92% ± 2.64% (95% CI, 400-commit sample verified across Java 8/11/17/21).

**Model selection:** AdaBoost, Decision Tree, Random Forest, and SVM were tested against seven resampling schemes (random over/undersampling, SMOTE, ADASYN, CNN, ENN, TomekLinks). Random Forest **without resampling** won — resampling gains were ≤0.03 MCC and mostly not statistically significant (Mann-Whitney U), not worth the extra compute.

## Results (by RQ)
- **RQ1 (intra-project, 100× stratified sampling):** median **F1 0.98, AUC 0.98, MCC 0.82**; outperforms prior state-of-the-art. Top features: historical build results and contributor properties. Time-sensitive evaluation (only past-available data) shows a ramp-up of **~300 commits** before performance stabilizes, with substantial per-project variance — isolated per-project training does not work for all projects.
- **RQ2 (holistic, all 25 projects pooled):** median **F1 0.98, AUC 0.97, MCC 0.86** — pooling projects improves over isolated training; historical build features remain dominant.
- **RQ3 (BuildPredictor-NoHist, history features removed):** inferior to the full model but still beats prior models including the Naïve Parrot baseline, BuildFast, and RavenBuild-CR — while being far more interpretable. Without history features, **developer experience** and **time since the touched files were last modified** rise to the top.
- **Metrics caveat:** with 82% success rate, F1/AUC/accuracy read rosy even on badly-predicting projects; the authors recommend **MCC as the primary metric** for build-outcome prediction.

## Relevance to Our Domain
A quotable, quantified datapoint for our CI-performance and build-optimization notes (JIT Build Service, Lean-SLM): *build-history features alone drive an MCC-0.8+ predictor*, which validates cheap, model-light CI optimizations before reaching for heavier ML infrastructure. The interpretability/accuracy trade-off result is directly useful when CI gating decisions must be explained to developers.

## References
- Paper: https://arxiv.org/abs/2611.26476 (Macho, C. & Stengg, K., University of Klagenfurt, submitted 2026-11-19, CC BY 4.0)
- Author pages: https://mitschi.github.io/ · https://stenglx.github.io/
- Related: [[reference-jit-build-service-reducing-build-costs]], [[explanation-lean-slm-ml-guided-ci-optimization]]
