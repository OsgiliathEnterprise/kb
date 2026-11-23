---
title: 'Topology Hub Optimal Transport: Eliminating Long Context Dilution at Flash
  Speed'
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.27951
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# Topology Hub Optimal Transport: Eliminating Long Context Dilution at Flash Speed

**Authors:** Dylan Forde


## Overview
THOT tackles "context dilution" — the observed collapse of LLM performance when context grows — by attacking its *root cause in softmax attention*: the row-stochastic constraint (each query's attention weights sum to one) forces every new token to steal attention mass from existing ones, an attention tax that grows with sequence length. THOT replaces softmax attention with an optimal-transport formulation executed in a single GPU kernel.

## Problem Statement
Prior remedies treat symptoms: sparse attention (heuristic masks, accuracy-sensitive), linear attention (compresses history into a fixed state, loses precise access), or softmax-preserving tweaks like attention entropy (bounded by the same constraint). None removes the normalization mechanism itself.

## Key Contribution
- Reformulates attention as **optimal transport** via **Sinkhorn iterations**, decoupling queries from keys/values — breaking the row-sum constraint that creates the attention tax.
- **Tightly fused Sinkhorn implementation**: all iterations run inside one GPU kernel.
- **Topology-preserving hubness control** to prevent transport pathology called **hub collapse**.
- First demonstration that OT attention can scale to pretraining at frontier scale.

## Technical Approach
Where softmax enforces one shared normalization per query row, the Sinkhorn formulation normalizes rows and columns iteratively, so added tokens don't cannibalize existing attention. The engineering contribution is making this tractable: fused-kernel Sinkhorn removes the iteration overhead that killed earlier OT-attention attempts, and the hubness control keeps the transport plan from degenerating into a few over-attributed "hub" tokens.

## Results
At **3B parameters trained on 100B tokens**: up to **5.6× improvement on passkey retrieval** over standard Transformers and **~66% less memory** at 128K context. On reasoning benchmarks: **+2.6 points on GSM8K**, **+3.3 points on MATH**.

## Relevance to Our Domain
Long-context cost is the dominant lever in our agent and RAG serving work; a linear-memory attention variant with *better* retrieval accuracy directly affects context-window budgeting and GPU memory sizing decisions. Worth tracking for integration into serving stacks if checkpoints materialize.

## References
- Paper: https://arxiv.org/abs/2611.27951 (cs.LG, cs.AI, 2026-11-27)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27951
- Related: explanation-moe-context-blocked-context-selection.md, reference-transformer-attention-variants.md
