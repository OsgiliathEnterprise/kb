---
title: Large-scale Neuron Community Discovery Reveals Neuron-Sparse Behaviors in Language
  Models
diataxis: Explanation
domain: ai-machine-learning
topic: interpretability
source: arXiv
source_url: https://arxiv.org/abs/2611.23112
date: '2026-11-18'
keywords:
- knowledge-base
- interpretability
- ai-machine-learning
- explanations
---
# Large-scale Neuron Community Discovery Reveals Neuron-Sparse Behaviors in Language Models

## Overview
Shilov et al. ask what **reusable units of computation** exist inside a language model's neurons. Prior work showed single forward passes can be sparsified post-hoc to small neuron groups, but it was unclear whether those groups are **coherent computational entities reused across inputs**. They introduce *neuron community discovery* — an unsupervised method that finds neuron groups recurring across prompts that are **causally necessary and sufficient**, within the layers they span, for common computations.

## Problem Statement
Sparse sub-network attributions per-prompt might be artifacts of the attribution method rather than real, reusable modules. Establishing reusability requires finding the same groups across many prompts and validating them causally on held-out data.

## Key Contribution
- **Method**: combines gradient-based attribution, a graph linking neurons that are repeatedly attributed together, and **community detection** — run at scale: **Llama-3.1-8B over ten million prompts**, yielding thousands of candidate communities.
- **Three causal evaluation tests** on held-out prompts: community necessity, sufficiency within a layer subset, and layer necessity (removal disrupts predictions; retention preserves predictions even when the remaining MLP neurons in tested layers are ablated).
- **Discovered functions**: grammatical agreement, token-probability calibration, fixed phrases, in-context copying, addition, multiplication.

## Results
With communities capped at **128 neurons across all layers**:
- **10.3%** of held-out prompts have at least one layer's contribution explained on a neuron-sparse basis.
- **8.7%** coverage when requiring ≥4 such layers; **3.3%** when requiring ≥12 layers.

Conclusion: small groups of existing neurons act as **reusable computational components across prompts**, and such groups are discoverable at scale.

## Relevance to Our Domain
For model auditing and safety engineering, the existence of causally-validated, reusable neuron communities suggests **localized intervention points** (ablation, steering, surgical editing) for known behaviors — and a measurable "explained fraction" as an interpretability coverage metric, complementary to logit-lens attribution. Related: [[explanation-surgery-not-lenses-visual-token-attribution]], [[explanation-norm-aware-cross-architecture-auditing]].

## References
- Paper: https://arxiv.org/abs/2611.23112
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23112
