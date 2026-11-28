---
title: 'Model Weights, Airlocks and Sandboxes: A Call for Technical Validation of
  Re-identification Tests under the EDPB Anonymisation Guidelines'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.34859
date: 2026-11-28
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# Model Weights, Airlocks and Sandboxes: A Call for Technical Validation of Re-identification Tests under the EDPB Anonymisation Guidelines

**Authors:** Andrew Brännvall, Arvid Källström, Anton Lundqvist, Josep Falconer Borobio, Tobias Kronman, Marcus Norén

## Overview
The EDPB's recent anonymisation guidelines (v2.0, adopted 18 December 2025) introduced specific re-identification tests for judging whether data is anonymous — but provide no standardized methodology for *how* to run them. This position paper (arXiv:2611.34859) argues that without validated test procedures, "anonymity is reduced to intuition" under time pressure, and proposes a framework for designing, conducting, and evaluating such tests, illustrated with concrete technical examples.

## Problem Statement
Two regulatory gaps collide: (1) the EDPB tests are underspecified — the paper identifies **seven unresolved questions** whose answers materially change the outcome of a test; (2) the guidelines treat large language models only generically, ignoring the **model weights themselves** as a re-identification attack surface (extraction, memorization probing), even though model weights are increasingly shared and openly released.

## Key Contribution
- Systematic identification of seven open methodological questions in the EDPB re-identification tests.
- Technical illustrations for three model deployment configurations: **air-gapped LLMs**, **closed-source hosted LLMs**, and **open-source hosted LLMs** — showing how the attack surface (and hence the correct test design) differs in each.
- Explicit treatment of model weights as an attack surface requiring re-identification testing in its own right.
- A proposed framework for structuring and validating re-identification tests so anonymity claims become reproducible technical findings rather than expert intuition.

## Technical Approach
The paper proceeds by counterexample-style technical analysis: for each deployment configuration it works through what a realistic adversary can do (query access, weight access, training-data inference) and where the EDPB test wording leaves the answer indeterminate. The "airlock" and "sandbox" metaphors in the title capture the two containment regimes whose boundary conditions the tests fail to pin down.

## Relevance to Our Domain
Any team shipping models, hosted LLM features, or open weights in the EU needs defensible anonymisation evidence. The seven open questions double as a checklist for designing our own re-identification test plans, and the air-gapped / hosted / open-weights taxonomy maps directly onto common deployment decisions (private inference vs. API vs. released checkpoints).

## References
- Paper: https://arxiv.org/abs/2611.34859
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34859
- EDPB Guidelines v2.0 on anonymisation (adopted 2025-12-18)
