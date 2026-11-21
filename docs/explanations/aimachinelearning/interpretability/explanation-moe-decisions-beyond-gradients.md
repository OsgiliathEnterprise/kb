---
title: Understanding MoE Decisions Beyond Gradients
diataxis: Explanation
domain: ai-machine-learning
topic: interpretability
source: arXiv
source_url: https://arxiv.org/abs/2611.26075
date: '2026-11-21'
keywords:
- knowledge-base
- interpretability
- ai-machine-learning
- explanations
---
# Understanding MoE Decisions Beyond Gradients

## Overview
Xu, Zhang, Zhao and Liu (arXiv:2611.26075, submitted 2026-11-19) identify and fix a structural blind spot in gradient-based interpretability for **mixture-of-experts (MoE) LLMs**: gradient attributions describe the computation that *happened*, and silently ignore the expert routing that *could have changed*. Their fix is a predictor that explicitly accounts for expert switching using the model's own selection rules.

## Problem Statement
In a dense model, attributing a final-answer score to upstream components via gradients is (locally) faithful. In an MoE, **swapping out a single expert can change which experts are selected in subsequent layers** — a discrete routing cascade. Gradients treat the router as fixed, so standard attribution misses this whole class of effects, making expert ablation predictions systematically wrong.

## Key Contribution
- Names and isolates **expert switching** as a first-class, gradient-invisible pathway in MoE behaviour.
- Builds a predictor of the **additional effects of expert swaps** that relies only on **the model's own expert outputs and selection rules** — no extra training — and combines them with a **second-order prediction** for the direct effect.
- Positions the result as a local-explanation upgrade path for MoE attribution generally.

## Results
Across three benchmarks, compared against the strongest **multi-step baseline that already combines gradient and second-derivative information**:
- Answer-score-change prediction error reduced by **60% on Qwen3.6**
- Reduced by **47% on Gemma4**

The margin matters because the baseline is not naive gradients — it already uses multi-step second-derivative machinery — yet still misses routing cascades.

## Practical Implications
- When ablating or editing experts in MoE serving/analysis pipelines, **recompute downstream routing** after the swap; predictions that freeze the router will misestimate impact, especially in deep MoE stacks.
- For attribution-driven interpretability studies on MoE checkpoints (routing bias, expert specialization), gradient-only numbers should be treated as a lower bound on an expert's true influence.
- The method's dependence only on inference-time signals (expert outputs + router scores) makes it cheap to bolt onto existing eval harnesses.

## Relevance to Our Domain
MoE is the dominant architecture for frontier serving (our llm-serving and dl-architectures topics); understanding that expert decisions propagate through *routing*, not just activations, matters for expert-cache eviction policies, canary monitoring of routing drift, and any "edit this expert" workflow.

## References
- Paper: https://arxiv.org/abs/2611.26075
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26075
- Related: [[explanation-prior-probability-coverage-moe-routing]], [[reference-vllm-moe-deployment-guide]]
