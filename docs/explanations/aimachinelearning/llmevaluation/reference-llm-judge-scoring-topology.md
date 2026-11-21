---
title: 'Same Judgement, Different Scores: Numerical Scoring Topology in LLM-as-a-Judge
  Evaluation'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.26077
date: 2026-11-21
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Same Judgement, Different Scores: Numerical Scoring Topology in LLM-as-a-Judge Evaluation

## Overview
When an LLM judge outputs a numerical score, the *shape* of the scale it is forced to use is itself a design variable — and this paper shows it is one that is routinely ignored. Through a systematic study of five judges, three tasks and three datasets, the authors isolate the effect of "numerical scoring topology" from prompt wording and show it induces substantial, judge-dependent bias and variance.

## The Five Topology Dimensions (lookup table)
| Dimension | What it controls | Example choices |
|---|---|---|
| **Scale width** | Number of score levels | 1–5 vs 1–10 |
| **Granularity** | Step size | integer vs half-point steps |
| **Offset** | Where the scale starts | anchored at zero vs mid-scale |
| **Symmetry** | Balance of the scale | symmetric vs asymmetric around a midpoint |
| **Boundary placement** | Where category edges fall | thresholds between levels |

## Experimental Setup
- **Judges:** GPT-4o-mini, Llama-3.1-8B-Instruct, Qwen2.5-7B-Instruct.
- **Tasks:** general quality assessment, safety evaluation, and domain-specific expert judgment.
- **Protocol:** judges score the same responses as each topology dimension is varied, isolating the scale effect from prompt content.
- **Validation:** findings replicated on three datasets.

## Key Findings
1. **Systematic, judge-dependent shifts.** Topology changes move scores consistently, but the direction and size of the shift depend on the judge — there is no universally "safe" scale configuration.
2. **High intra-judge variance.** The same judge produces widely different scores across topologies on the same content.
3. **Underestimated impact.** The effect of scoring topology is "significant and underestimated" relative to prompt-engineering effort — changing the scale can matter as much as rewording the rubric.
4. **Practical guidance.** The paper distills recommendations for selecting and justifying a scale configuration when building LLM-as-a-judge pipelines.

## Practical Takeaways for Evaluation Pipelines
- Treat scoring topology as a **versioned, reported parameter** of any LLM-judge benchmark — alongside model version and prompt.
- Run a **topology sensitivity check** (at minimum scale width and offset) before trusting judge scores for model comparison or safety gating.
- Prefer configurations justified by a sensitivity study over inherited defaults (e.g., 1–5 Likert) — especially for safety evaluation, where boundary placement can flip pass/fail decisions.

## References
- Paper: https://arxiv.org/abs/2611.26077
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26077
