---
title: 'TokenJoule: Energy Modeling for Distributed Training and Inference of LLMs'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.31509
date: 2026-11-25
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# TokenJoule: Energy Modeling for Distributed Training and Inference of LLMs

## Overview
TokenJoule is an analytical, profiling-based energy tool for LLM workloads spanning two regimes: (1) single-node training and inference across dense, MoE, long- and short-context models — where it predicts per-token energy within 5–20% — and (2) distributed multi-node training, where it decomposes end-to-end energy into GEMM computation, memory operations, communication, and idle phases with under 10% per-component error and 2–3× lower overall error than the state of the art. It is open-source (https://github.com/ai-headline/TokenJoule) and validated on H100 and GB200 NVL72 hardware.

## Problem Statement
Energy consumption is becoming a primary constraint for LLM training and inference — cost, thermal envelopes, carbon accounting, power-aware scheduling, sustainable AI. Yet the field lacks a **unified** energy model covering both training and inference and both dense and Mixture-of-Experts (MoE) architectures, across single-node and multi-node scales.

## Reference: Model Capabilities & Validated Accuracy
| Regime | Workloads covered | Architecture coverage | Validated accuracy |
|---|---|---|---|
| Single-node | training + inference | dense, MoE; long- and short-context | per-token energy within **5–20%** |
| Multi-node distributed training | end-to-end training | GEMM compute, memory ops, communication, idle decomposition | **&lt;10% error per component**; 2–3× lower overall error than SOTA |

**Validation hardware:** NVIDIA H100 and GB200 NVL72 (two experimental settings).
**Model types tested:** dense and MoE, long- and short-context models, multiple sizes.
**Outputs:** per-token energy (single node); energy breakdown per GEMM / memory / communication / idle (multi-node).
**Code:** https://github.com/ai-headline/TokenJoule

## Technical Approach
TokenJoule is analytical rather than measurement-only: it builds per-stage energy models (compute, memory movement, communication, idle) parameterized by profiling data, so it can predict token-level consumption for single-node jobs and attribute end-to-end consumption to components in distributed training. The component decomposition is what enables sub-10% per-component accuracy on multi-node runs, where prior black-box estimates drift badly.

## Results
- Two experimental settings (H100, GB200 NVL72), diverse model types and sizes.
- Single-node: token-level energy predicted within 5–20%.
- Multi-node: every component (GEMM, memory, communication, idle) predicted with &lt;10% error; 2–3× better overall accuracy than state of the art.

## Relevance to Our Domain
A usable open-source energy model closes a gap in our GPU-finops and capacity-planning coverage: per-token energy budgets for inference SLAs, carbon/power attribution for training jobs, and power-aware scheduling inputs. The GEMM/memory/communication decomposition also doubles as a diagnostic for where multi-node jobs waste energy — useful when comparing roofline estimates (see the related GPU roofline note) against real bills.

## References
- Paper: https://arxiv.org/abs/2611.31509
- Code: https://github.com/ai-headline/TokenJoule
- Related: cloud-infrastructure/gpu-compute/reference-estimating-gpu-roofline-ai-llm-compiler-artifacts.md
