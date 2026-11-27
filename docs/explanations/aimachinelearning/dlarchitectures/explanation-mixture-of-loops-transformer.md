---
title: Mixture-of-Loops Transformer
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.34923
date: '2026-11-27'
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# Mixture-of-Loops Transformer

## Overview
Zhu, Wang, Wang, Bai, Wang & Bai (arXiv:2611.34923, submitted 2026-11-25, hustvl group) attack the core inefficiency of **Looped Transformers**: reusing shared layers across loops buys expressivity but costs efficiency. Their thesis is that the expressivity–efficiency frontier is governed by one design decision — *what is passed between consecutive loops*. The proposed **Mixture-of-Loops Transformer (MoLT)** answers with a new attention mechanism that treats keys/values as reusable memory across depths and loops.

## Problem Statement
In looped transformers the adjacent-loop interface is usually the full hidden state. Passing everything couples loops tightly, forcing the model to re-traverse the decoder repeatedly at inference. The paper asks what should actually flow between loops to decouple expressivity from redundant computation.

## Key Contribution
- **Mixture-of-Loops Attention (MoLA)**: uses KV pairs as memory for *selective reuse across depths and loops*, making the inter-loop interface an attention read rather than a full-state handoff. Two variants:
  - **MoLT-R (loop residual)** — retains the residual stream and reads *local* KV across loops; optimised for expressivity.
  - **MoLT-KV (loop KV)** — restarts each loop from embeddings and reads current-loop local KV together with preceding-loop *memory* KV at earlier positions; optimised for efficiency. It eliminates same-position cross-loop dependence and, combined with **loop forcing** for parallel training, unlocks **single-traversal MoL decoding beyond the training loop horizon** (decode more loops than seen in training, in one pass).
- **U-shaped MoLT (U-MoLT)**: separates memory construction from prediction readout and *skips decoder traversals whose outputs are unused*, without changing predictions — the efficiency/quality balance knob.

## Results
- **400B-token pretraining**: U-MoLT outperforms OLMo3 at 700M/1.5B dense and 3B MoE scale — **1.7× validation cross-entropy token efficiency at 700M**; 3B MoE improves 10-domain perplexity by **0.75** and 10-task accuracy by **+2.1 pp**.
- **100B-token continued pretraining of Qwen3.5-0.8B-Base**: U-MoLT adaptation lowers CE on all 11 evaluation domains vs. the matched baseline, **1.4× mean token efficiency**.
- **Inference latency**: U-MoLT with MoL-Hybrid-2 matches non-looped OLMo3 on S-size (~113M) models — 996.6 ms vs 1,000.6 ms.
- Code: https://github.com/hustvl/MoLT

## Relevance to Our Domain
Looped/depth-reuse transformers are an active efficiency line in this topic (cf. the production GLM-5.4 loop transformer); MoLT's KV-as-memory interface and single-traversal decoding are the concrete architectural mechanisms to know when evaluating looped backbones. Complements [[explanation-glm-5-4-loop-transformer]].

## References
- Paper: https://arxiv.org/abs/2611.34923
- Code: https://github.com/hustvl/MoLT
- Related: [[explanation-glm-5-4-loop-transformer]]
