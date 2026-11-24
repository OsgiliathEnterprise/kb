---
title: 'From Local Errors to System Failures: Modeling and Benchmarking Error Propagation
  in Multi-Agent LLM Systems'
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.31063
date: '2026-11-24'
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# From Local Errors to System Failures: Modeling and Benchmarking Error Propagation in Multi-Agent LLM Systems

## Overview
In multi-agent LLM systems (MAS), a wrong or noisy message produced by one agent travels through intermediate agents before reaching the final answer. Outcome-based evaluation — scoring only the final output — hides *how* agents amplify, dampen, or fix that error along the way. This paper (arXiv:2611.31063, cs.MA) introduces **REPA** (Response-Aware Error Propagation among Agents), a structural model that connects measured per-agent responses to system-level error propagation, plus **ErrPropBench-10**, a benchmark for studying it.

## Why Outcome-Based Evaluation Is Blind
Two MAS runs can produce the same final answer from opposite trajectories: one agent may have introduced an error that a downstream agent silently corrected, or a small local slip may have been amplified stage by stage. Without a model of the propagation path, teams cannot tell which agent to fix, where to spend repair budget, or whether adding an agent helps or hurts.

## How REPA Works
- **Two decoupled stages per agent**: *input assembly* (how an agent ingests upstream messages) and *agent processing* (how it transforms them) are estimated separately, across multiple error channels.
- **Local-to-endpoint theory**: theoretical analysis bounds how local modeling errors translate into endpoint prediction error — so measurement noise at the agent level is accounted for when predicting system failures.
- **Interpretability**: because assembly and processing are separate coefficients, you can attribute system susceptibility to specific agents and channels instead of treating the MAS as a black box.

## Evidence
- Evaluation spans **3 Qwen base models × 6 MAS workflows × 10 knowledge/reasoning settings** (ErrPropBench-10).
- REPA reaches a mean condition-level **Spearman correlation of 0.84** with observed propagation, vs **0.47** for a direct-regression baseline.
- **Targeted recovery**: using REPA to decide where retrieval helps, REPA-guided RAG improves accuracy by an average of **+19 percentage points** over no retrieval, at only **+16% tokens** — evidence that the model identifies *where* to intervene, not just whether the system fails.

## Conceptual Takeaways
1. Error propagation in MAS is a **structural property** (assembly + processing per agent, per channel), not just an emergent statistic.
2. Local accuracy and system reliability are linked but distinct: the same local error can be fatal in one workflow and harmless in another depending on topology.
3. Propagation models enable **targeted** optimization (retrieve, verify, or add a critic only where the model predicts amplification) instead of blanket hardening.

## Relevance to Our Domain
Grounds the KB's multi-agent systems coverage in measurable reliability engineering: a companion to the KB's notes on single- vs multi-agent coordination costs and dependable long-horizon agents error taxonomies. Useful when designing QA gates for agent pipelines — evaluate where errors amplify, not only final answers.

## References
- Paper: https://arxiv.org/abs/2611.31063 (cs.MA, cs.AI, submitted 2026-11-23)
- PDF: https://arxiv.org/pdf/2611.31063
