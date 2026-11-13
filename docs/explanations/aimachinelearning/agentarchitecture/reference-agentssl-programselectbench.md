---
title: AgentSSL & ProgramSelectBench — MLE Agents as Semi-Supervised Learning Program
  Searchers
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.17323
date: 2026-11-13
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# AgentSSL / ProgramSelectBench: Technical Reference (NeurIPS 2026)

## Overview

Lin, Sarkar, Liu, Branson & Sun (Stanford-adjacent group, NeurIPS 2026) reframe **semi-supervised learning (SSL) as a program-search problem** for MLE agents, and measure where those agents win and where they break. Headline: under weak feedback and matched compute, agents can synthesize SSL pipelines that **beat the strongest human-engineered baselines in 8 of 12 settings (up to +21.8%)** — but **program selection is the bottleneck**, with performance dropping **up to 47%** when the agent's own feedback metric picks the program. They contribute **ProgramSelectBench**, a 16,977-program benchmark for studying that selection step. Project: https://codiscovery.ai/AgentSSL

## Key Numbers (Lookup Table)

| Item | Value |
|---|---|
| Settings where agent-written SSL code beats best human baseline | 8 / 12 |
| Maximum gain over human baselines | +21.8% |
| Performance drop when selection uses the agent's own feedback metric | up to −47% |
| ProgramSelectBench size (agent-generated + human-engineered SSL programs) | 16,977 |
| Feedback regime | weak feedback, compute matched to baselines |
| Real-world evaluation | ecology detection tasks |

## Framing & Method

- **AgentSSL**: instead of asking whether agents can run fixed SSL algorithms, treat the whole SSL pipeline (pseudo-labeling, consistency regularization, co-training variants, …) as a search space of *programs* the agent composes and adapts under limited labels.
- **Program-selection bottleneck**: generation is not the constraint — *choosing* which candidate program to keep is. The agent's internal feedback metric is a poor selector, motivating external, unsupervised, or active selection strategies.
- **ProgramSelectBench**: large-scale corpus of 16,977 candidate programs used to evaluate unsupervised and active program-selection methods head-to-head.
- **Transfer check**: AgentSSL evaluated on real-world ecology species-detection tasks, surfacing both opportunities and failure modes beyond controlled benchmarks.

## When to Use This Reference

- Designing an **MLE agent** or AutoML-style pipeline agent: budget effort for the *selection* stage (validation design, active probing), not just code generation.
- Benchmarking program/pipeline selection strategies against a 16,977-program corpus.
- Deciding whether to use unlabeled data in agentic ML workflows with scarce labels.

## Relevance to Our Domain

Directly extends the KB's MLE-agents and AI-assisted-dev coverage: it is the first serious probe of MLE agents outside fully supervised settings, and its "generation works, selection fails" finding is an architectural warning for any agentic system that self-scores its own outputs — the same trust-your-own-feedback failure mode seen in agent evaluation notes.

## References

- Paper: https://arxiv.org/abs/2611.17323
- OpenReview version: https://openreview.net/pdf?id=yWxcbCZwgn
- Project page: https://codiscovery.ai/AgentSSL
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17323
- Related notes: `explanations/aimachinelearning/llmevaluation/`, `explanations/aimachinelearning/agentarchitecture/`
