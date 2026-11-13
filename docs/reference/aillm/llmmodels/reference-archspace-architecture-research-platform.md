---
title: "ArchSpace — A Public Platform for Recording, Reviewing and Referencing LLM Architecture Research"
diataxis: Reference
domain: AI-LLM
topic: LLM Models
source: "arXiv"
source_url: "https://arxiv.org/abs/2611.17332"
arxiv_id: "2611.17332"
date: 2026-11-13
keywords:
- knowledge-base
- LLM Models
- AI-LLM
- reference
- scaling laws
- model architecture
visibility: public
---
# ArchSpace: Recording, Reviewing, and Referencing LLM Architecture Research

## Overview
ArchSpace is a public platform that treats LLM architecture research like a versioned, peer-reviewed registry: every architecture proposal is *recorded* with its experiments and reasoning, *reviewed* by the community, and *referenced* by later work. It targets two chronic pathologies of LLM architecture development — undocumented industrial trial-and-error and underpowered academic comparisons — and operationalizes scaling-law extrapolation as the standard pre-screening mechanism before costly large-scale training.

## Problem Statement
- **Industry opacity**: teams behind DeepSeek, Qwen and Kimi routinely introduce architectural innovations, but public reports rarely record which ideas succeeded, which were abandoned, and why. Failed ideas are silently lost, so the field cannot learn from negative results.
- **Academic underpowering**: limited compute and inconsistent baselines force small-scale, single-point evaluations, so it is unclear whether a reported improvement holds at larger scales.

## Key Contribution
- A public record/review/reference workflow for architecture proposals, with community review gating which ideas become reusable baselines.
- **Scaling-law-based pre-evaluation**: predict loss at larger scale from smaller experiments — a practice standard inside labs but rarely published — making go/no-go decisions auditable without trillion-token runs.
- **Initial reference material** that makes the platform immediately usable:
  - Qwen3.5 and OLMo3 baselines;
  - fitted scaling laws;
  - a reusable training recipe.

## Technical Approach
Each submission bundles a hypothesis, small-scale experiments, and reasoning. Fitted scaling laws extrapolate loss curves to a target compute scale; validated ideas are promoted to baselines that subsequent submissions must beat, creating a ratcheting reference stack rather than a pile of one-off claims.

## Results / Contents (Lookup Table)
| Asset | Purpose |
|---|---|
| Qwen3.5 baseline | Industrial-strength reference model |
| OLMo3 baseline | Open, reproducible comparison point |
| Fitted scaling laws | Cheap scale-up prediction of loss |
| Reusable training recipe | Standardized training conditions for fair comparison |

## Relevance to Our Domain
For teams making build-versus-adopt decisions on model architectures, ArchSpace is the closest thing yet to a changelog of *why* architectures look the way they do — including abandoned designs. Its scaling-law review gate is also a reusable methodology: any infra team can adopt "fit scaling laws at small scale before authorizing a large training run" as a budget-control practice. Track this as the canonical venue for validating architecture ideas before committing GPU time.

## References
- Paper: https://arxiv.org/abs/2611.17332
- Related baselines: OLMo3 (allenai), Qwen3.5 (Alibaba)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17332
