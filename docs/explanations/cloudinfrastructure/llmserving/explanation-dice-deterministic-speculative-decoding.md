---
title: Speculative Decoding Is Less Speculative Than You Think
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.27891
date: 2026-11-23
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Speculative Decoding Is Less Speculative Than You Think

## Overview
Speculative decoding's acceptance rate hides **two** sources of uncertainty: the target model's predictions and the randomness of sampling. This paper's observation: the first requires a target-model forward pass, but **the second can be fixed before drafting even starts**. **DICE** (Draw-Informed Candidate Selection) pre-samples the verification randomness and synchronizes it between drafting and verification, letting an ordinary drafter spend its budget on continuations that are actually likely to be used in the current sampling run.

## Problem Statement
Drafting efficiency depends on how well limited drafting computation anticipates the path the target will follow. That path is uncertain for two reasons, yet both are usually treated as unknowable at drafting time — so draft trees waste computation on continuations that the known sampling draws would never select.

## Key Contribution
- **Insight**: sampling randomness in verification is *pre-committable* — it can be drawn and synchronized before drafting begins, collapsing half of the uncertainty.
- **DICE (Draw-Informed Candidate Selection)**: combine the known draws with an existing drafter's predictions to allocate computation toward continuations more likely to be used; the principle drives **node selection throughout draft-tree construction** and extends to **asynchronous prefetching** (predicting which next-round drafts to prepare).
- **No model changes**: no additional drafter training and no modification of the target sampling distribution — the target's outputs are unaffected.

## Technical Approach
Before drafting, sample the verification random numbers and share them with the drafter. Draft-tree expansion then scores candidate nodes by their likelihood of being selected *given both the drafter's predictions and the actual upcoming draws*. The same mechanism schedules the next round's drafts in asynchronous serving, prefetching the continuations most likely needed.

## Results (paper-reported)
State-of-the-art decoding throughput across diverse settings, with speedups of up to **24.6 percentage points** over strong baselines — with no extra drafter training.

## Relevance to Our Domain
Decoding throughput is the core cost metric for self-hosted LLM serving; DICE is a training-free, protocol-level improvement that stacks with existing speculative-decoding deployments — a cheap win to evaluate in any inference stack.

## See Also
- [[IsoMoE: Placement-Invariant Hybrid CPU-GPU MoE Inference with Lossless 12-bit Experts]] (how-to)
- [[MemOnce: A Scalable Memory Architecture for Large Language Models]] (explanation)

## References
- Paper: https://arxiv.org/abs/2611.27891
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27891
