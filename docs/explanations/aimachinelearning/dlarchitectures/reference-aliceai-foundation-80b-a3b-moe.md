---
title: AliceAI-Foundation-80B-A3B-Base
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.34529
date: 2026-11-25
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# AliceAI-Foundation-80B-A3B-Base

## Overview
Skachkov et al. (arXiv:2611.34529, submitted 2026-11-25) document **AliceAI-Foundation-80B-A3B-Base**, a sparse mixture-of-experts base model trained from scratch at Yandex and released under **Apache 2.0**. It is a compact-activation MoE (80B total, ~3B active per token) with a hybrid attention design and the Muon optimizer, plus two newly released Russian-language factual benchmarks. This note is a spec/lookup reference.

## Model Specification

| Property | Value |
|----------|-------|
| Total parameters | 80 B (MoE) |
| Active parameters per token | ~3 B |
| License | Apache 2.0 (open weights) |
| Attention | Kimi Delta Attention mixed with full attention |
| Residual scheme | Attention Residuals |
| Optimizer | Muon |
| General pretraining | 17.5 T tokens |
| Post-pretraining stages | 2 context-extension stages + 1 dedicated reasoning/agentic stage |

## Training & Methodology Notes
- **MoE stability fix**: the authors show held-out training loss is an unreliable proxy for downstream performance, and introduce an **auxiliary loss on MoE outputs** to stabilize training at the predicted learning rate.
- **Data engineering pays off**: domain-specific data selection and augmentation measurably improve factual knowledge, math, and programming.
- **Agents in pretraining**: injecting agent trajectories *during pretraining* (not only fine-tuning) improves agentic benchmark scores after SFT.
- Includes data collection/augmentation pipelines, evaluation protocols, architectural ablations, and scaling-law experiments.

## Benchmark Results (from the abstract)

| Benchmark | AliceAI-80B-A3B | DeepSeek-V4-Flash-Base (284B/13B) | Nemotron-3-Super-120B-A12B (120B/12B) |
|-----------|-----------------|-----------------------------------|----------------------------------------|
| WikiWebFacts (Russian facts) | **86.5%** | 83.2% | 72.8% |
| HardMultiQA (hard Russian QA) | **67.9%** | 65.4% | 54.5% |
| IMO-AnswerBench pass@8 (zero-shot) | **88.7%** | — | — |
| LiveCodeBench v5-v6 pass@8 (zero-shot) | **82.9%** | — | — |

The model leads open base models of comparable size on zero-shot reasoning and **beats both larger MoE baselines** on the two Russian factual benchmarks.

## New Benchmarks Released
- **WikiWebFacts** — short factual questions from encyclopedic sources and search queries.
- **HardMultiQA** — harder factual questions inspired by real user interactions.

## Relevance to Our Domain
A rare full production write-up of a small-activation MoE: the Muon + hybrid-attention + Attention-Residuals stack, the MoE auxiliary loss for LR stability, and agent-trajectory-in-pretraining are all directly reusable findings for our LLM training/architecture coverage and for open-weight model selection.

## References
- Paper: https://arxiv.org/abs/2611.34529
