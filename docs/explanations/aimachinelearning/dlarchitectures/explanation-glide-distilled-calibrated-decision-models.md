---
title: 'GLiDE: A Fast, Calibrated Decision Model Distilled from Reasoning Teachers'
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.26509
date: 2026-11-21
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# GLiDE: A Fast, Calibrated Decision Model Distilled from Reasoning Teachers

## Overview
GLiDE is a family of "decision models" (0.4B–27B parameters) that score candidate answers in a single forward pass — no text generation, no chain-of-thought — yet retain much of a reasoning model's judgment by distilling from reasoning teachers. Built on Qwen hybrid language models, GLiDE sits on the performance–parameter Pareto frontier of the Hugging Face Decision Index.

## Problem Statement
Decision models are fast and confidence-aware but typically weaker than reasoning models, because reasoning improves decision quality. The open question: can the *benefits* of reasoning be transferred into single-pass scoring without paying the generation cost — in latency, tokens, and calibration?

## Key Contribution
- Bidirectional attention for decision scoring: causal masking is removed from full-attention layers so context, question, and candidate answers interact directly.
- Reasoning transfer without reasoning tokens: soft-target distillation from multiple teachers, including a reasoning model, combined with progressive post-training on diverse decision tasks.
- Parameter-free recurrent depth: extra inference-time computation at test time without generating any tokens.
- Five sizes (0.4B–27B), each outperforming evaluated alternatives of equal or smaller size on the Hugging Face Decision Index.

## Results
- GLiDE-27B: hidden-set score 71.52, expected calibration error 2.0%, median latency 92.9 ms on a single GPU.
- With checkpoint averaging + parameter-free recurrent depth: score 73.37 at ECE 2.1%.
- Pareto-dominant across sizes on the Hugging Face Decision Index.

## Relevance to Our Domain
Decision models are the routing/judging layer of agent stacks (which tool? which answer? retry or accept?). GLiDE shows you can replace a reasoning-model judge call with a ~93 ms single-pass scorer that stays calibrated — decisive for agent latency budgets and cost, and a concrete recipe (soft-target distillation from a reasoning teacher + unmasked attention + recurrent depth) for building in-house verifiers and routers.

## Metadata (verified vs arXiv, 2026-11-21)
- Authors: Sahibzada Allahyar, Julia White, Dhruv Atreja, George Hurn-Maloney, Urchade Zaratiana.
- Submitted 2026-11-19, arXiv:2611.26509 [cs.AI, cs.CL], 18 pages / 8 figures, CC-BY-4.0.
- The leaderboard referenced is the Hugging Face Decision Index (edition 0.4.1, 22 October 2026 — GLiDE-27B ranked 1st of 225 models); the paper also tracks the Artificial Analysis Decision Index. Reported numbers (71.52 / 73.37 hidden-set, ECE 2.0% / 2.1%, 92.9 ms median) come from the abstract; they are hidden-set scores, so not directly comparable to public-set leaderboards.

## References
- Paper: https://arxiv.org/abs/2611.26509
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26509
