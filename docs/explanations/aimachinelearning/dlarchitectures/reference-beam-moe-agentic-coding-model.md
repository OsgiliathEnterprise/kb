---
title: Beam Model Technical Report
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.26358
date: 2026-11-21
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# Beam Model Technical Report

## Overview
Beam is a sparse Mixture-of-Experts (MoE) model built and optimized specifically for coding, reasoning and agentic workloads. The technical report documents its full training stack — large-scale pre-training, a novel mid-training phase for long context, and an unusually large reinforcement-learning campaign — along with the serving-side co-design that keeps inference cost competitive with much smaller models.

## Architecture & Training Specification
| Property | Value |
|---|---|
| Total parameters | 501.3B (sparse MoE) |
| Active parameters per token | 23.4B |
| Inference efficiency | 3–4× less compute than many models of its class |
| Pre-training corpus | 23.8T diverse, curated, high-quality tokens |
| Context window | 1M tokens |
| Long-context method | Novel two-stage mid-training on verifiable, correctness-anchored data |
| RL campaign | Fully asynchronous RL across 10.5K GB300 GPUs; >100M rollouts over 4 weeks |
| Quantization | FP8 / NVFP4 |
| Speculative decoding | 1.93B-parameter drafter ("DFlash 2") |

## Notable Findings
- **No RL plateau:** across the evaluation suite, capabilities kept improving as RL compute increased — no sign of saturation even after ~4 weeks of rollouts. The authors believe this is one of the largest RL runs conducted by any open lab to date.
- **Long context via correctness-anchored data:** the 1M-token window is attributed to a two-stage mid-training phase grounded in verifiable data rather than naive positional extrapolation alone.
- **Safety Pareto frontier:** averaged across conversation turns and harm categories, Beam refuses or pivots on 88.9% of harmful requests while complying with 81.5% of harmless requests — the highest harmful-request refusal/pivot rate among open-weight models on the Pareto frontier.
- **Serving efficiency:** deep hardware-model co-design, FP8/NVFP4 quantization and the DFlash 2 speculative drafter maximize serving throughput for flexible deployment.

## Why It Matters
A compact reference for what frontier-scale open-weight training now looks like: MoE sparsity around ~4.7% active fraction, correctness-anchored mid-training for long context, asynchronous large-scale RL as the main capability driver, and quantization/speculative decoding treated as first-class citizens of the model report rather than serving afterthoughts.

## Ecosystem & Release Context
- **Reflection's first open-weight model**, released under **Apache 2.0** (weights + model card + fine-tuning/eval stack; announced Nov 2026). HF: `reflection/Beam-1.0-501B-A23B`.
- Positioning: competitive with GLM 5.2/5.3 on coding/agentic tasks and approaching Qwen 3.8-Max, with the core advantage of **inference efficiency** (3–4× less compute; Artificial Analysis/DataCurve-based estimates, FLOPs ≈ 2 × active params × tokens).
- Selected benchmarks (10/27 update): SWE-Bench Pro v1 65.5, SWE-Bench Verified 80.9, Terminal-Bench v2.1 80.1, AIME 2026 97.8, GPQA-Diamond 90.5, HLE w/ tools 51.2, MCP Atlas 78.7.
- Safety program: red-teaming + published eval suites, plus external autonomy evaluation ("Mr. Beam" with Andon Labs, Nov 20) and a Gray Swan partnership (Nov 18).

## References
- Paper: https://arxiv.org/abs/2611.26358
- Reflection blog: https://reflection.ai/blog/introducing-beam
- Model card: https://reflection.ai/beam-model-card
- Weights: https://huggingface.co/reflection/Beam-1.0-501B-A23B
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26358
