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
- Related in vault: ai-machine-learning/llm-evaluation/, ai-machine-learning/agent-architecture/ (Ballad of Ballots and Tokens)
