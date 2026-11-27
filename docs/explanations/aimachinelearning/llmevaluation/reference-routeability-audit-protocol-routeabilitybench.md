---
title: 'Routeability Before Routing: Routeability Audit Protocol (RAP) and RouteabilityBench
  for Audited LLM Model Selection'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.34825
date: '2026-11-27'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Routeability Before Routing: Routeability Audit Protocol (RAP) and RouteabilityBench for Audited LLM Model Selection

**Authors:** Yihang Lu, Denica Kjorvezir, Ana Gjorgjevikj, Carola Doerr, Tome Eftimov (arXiv 2611.34825, submitted 2026-11-25, primary cs.LG)

## Overview
LLM routing picks, per prompt, the portfolio model most likely to answer correctly — but the premise only holds if the benchmark actually has *prompt-specific variation* (different models best on different inputs). Lu et al. argue routing results are routinely read as general evidence when the benchmark was never routeable, and contribute a **routeability-first audit**: the Routeability Audit Protocol (RAP) plus RouteabilityBench, a runnable claim-verification package that must be run on the benchmark×portfolio score matrix **before** router comparisons are trusted.

## Problem Statement
On coarse-scored benchmarks many models tie at the top and the single best model leaves little headroom. Under those conditions a router cannot beat the best single model, yet published evaluations still attribute differences to router design. There was no standard pre-flight check separating "routing is hard here" from "this router is bad".

## Reference: Audit Structure
- **When it runs**: retrospectively, once a benchmark×portfolio score matrix exists, before interpreting router comparisons — it does *not* certify unevaluated portfolios.
- **What it checks**: prompt-specific variation vs tie structure (tied-best analysis), headroom over the single-best model, family-correlated score inflation, predictor sensitivity.
- **Scale of the study**: 4 benchmarks × 66 LLMs.
- **Five diagnostics (D1–D5)**: D1 SBS→VBS routing headroom Δroute = VBS − SBS (max average gain of a perfect selector); D2 tied-best saturation via the |Ti| distribution (how often many LLMs share the top score); D3 embedding→performance predictability (row-wise ranking/correlation); D4 realized decision utility (regret, gap closure for forced policies); D5 calibration-sensitive selective routing (coverage, threshold transfer, abstention).

## Full-Text Details (v1 audit design)
- **Corpus**: four HELM-style single-turn benchmarks — GPQA (446 prompts), IFEval (541), MMLU-Pro (1000), Omni-MATH (1000) = 2,987 score-matrix rows; compact three-view routing analyses use the exact finite prompt-ID intersection (445/541/1000/998); a 2,984-row registry maps every filtered index to prompt ID with exact-ID verification across all 120 dataset–seed partitions; WildBench excluded.
- **Portfolio**: fixed 66-LLM snapshot — 22 open-weight, 8 gated-weight, 36 closed-weight (binary sensitivity: 22 open vs 44 gated/closed); weight access recorded for all 66, service access for 38.
- **Embedding views**: three compact encoder views (BGE, E5, GIST) plus three decoder-based views (Qwen3-8B, Qwen3-4B, Nemotron-8B) with/without chunking.
- **Protocol hygiene**: frozen 30-seed splits indexed on the filtered order, train-only transformations (incl. PCA), `argmax_random_tiebreak` to avoid alphabetic bias under tied score vectors, paired Wilcoxon signed-rank with within-family Holm correction; forced gap closure = 1 − r̄forced/Δroute.
- **Boundary findings**: GPQA = high-headroom tied-best boundary (SBS closure negative, −0.135 ± 0.126); MMLU-Pro = tied-best/low-utility boundary; IFEval = low headroom with the heaviest tied-best saturation; Omni-MATH is the only setting with retained protocol-specific routable cells (routing favorable at the K=33 sub-portfolio median; no single-model deletion flips a regime). Cluster analysis: mean embedding-to-oracle ARI 0.058, routable-cluster fraction ≈ 0 — the "routable structure" in embeddings is largely illusory.
- **Release scope**: runnable claim-verification package (derived score/evidence tables, metadata, one-command claim scripts); ships **no** embeddings, prediction caches, or router-training pipelines.

## Key Findings (lookup table)
| Setting | Result |
|---|---|
| Generic router enhancements (larger embedding sets, dimensionality reduction, selective abstention, clustering, stronger regressors) | Do **not** consistently beat the single best model |
| Omni-MATH (portfolio-dependent) | Clearest positive routing evidence |
| GPQA / MMLU-Pro / IFEval | Each fails routing differently — hard headroom or predictor-sensitivity, not router quality |

## Reporting Recommendations (verbatim obligations from the paper)
Router gains should be reported together with:
1. routeability diagnostics;
2. tied-best analysis;
3. portfolio construction details;
4. family-corrected statistical tests.

## Relevance to Our Domain
Routing gains are environment-dependent and must be measured against the *best single model under matched budget*, with explicit headroom accounting before crediting the router's architecture. Adopt RAP-style pre-checks for any internal LLM-gateway routing A/B test, and treat "router beats best single model" claims on coarse benchmarks as unverified until tied-best analysis is attached.

## Caveats
- Audit is retrospective only — no ex-ante portfolio certification.
- Findings scoped to the 4 benchmarks × 66 models studied; Omni-MATH's positive signal is portfolio-dependent.

## References
- Paper: https://arxiv.org/abs/2611.34825
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34825
- Related in vault: ai-machine-learning/llm-evaluation/, ai-machine-learning/agent-architecture/
