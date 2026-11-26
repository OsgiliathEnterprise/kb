---
title: Attack Policy Selection can Mislead Monitor Evaluators
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.34934
date: 2026-11-26
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Attack Policy Selection can Mislead Monitor Evaluators

## Overview
Safety monitors are evaluated for how well they catch worst-case attackers, and the standard recipe optimizes the attacker to maximize the monitor's false-negative rate (FNR). This note-taking-worthy negative result shows the recipe itself is flawed: because FNR is **discontinuous** in attack-policy parameters, the attacker found by gradient-style optimization is often a *poor approximation* of the true worst case. Replicating an established monitor-evaluation protocol, the authors find the selected attacks achieve only **65% of the worst-case FNR** attainable at the same compute, and that evaluation results are unstable across optimizer seeds.

## Problem Statement
Post-training reduces misaligned behavior but does not eliminate it, so frontier labs monitor models for safety-relevant deviations and need high-confidence estimates of monitor reliability against adaptive attackers. The field assumes "optimize attacker to maximize FNR" yields the worst case. The assumptions underlying that estimate have not been examined.

## Key Contribution
- Identifies two problems with the **FNR-optimizing attacker-selection objective**:
  - **Discontinuity**: small parameter changes in the attack policy can jump the FNR discontinuously, breaking the optimization landscape.
  - **Suboptimal attack selection**: the optimizer settles on policies far below the true worst case.
- Empirical replication of a recent monitor evaluation protocol: selected attacks reach just **65% of achievable worst-case FNR** under equal compute.
- **Seed instability**: different optimizer seeds select different attacks with *different* true worst-case FNRs — the evaluation protocol lacks a well-defined target quantity, so results can't be compared across studies.
- Proposes **evaluation- and audit-time techniques** for the two failure modes and discusses implications for interpreting monitor-evaluation results, arguing for evaluation protocols robust to optimizer artifacts.

## Technical Approach
The analysis treats attacker selection as an optimization problem and interrogates its objective function's regularity. By measuring the gap between optimized-attack FNR and best-observed FNR at matched compute, and varying optimizer seeds, the paper separates genuine monitor weakness from optimizer artifacts.

## Relevance to Our Domain
For anyone building agent oversight or red-teaming pipelines: a monitor-eval number produced by FNR-optimizing an adaptive attacker is an *optimizer-dependent estimate*, not a worst-case guarantee. When consuming or reporting monitor reliability metrics, check for seed-stability and worst-case-gap reporting; when designing eval harnesses, add audit-time probes that test whether the selected attack is representative.

## References
- Paper: https://arxiv.org/abs/2611.34934
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34934
