---
title: 'Joule is FLOP: Optimizing Tensor-Core Kernels Beyond Latency Hiding at the
  GPU Power Wall'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.32440
date: '2026-11-27'
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# Joule is FLOP: Optimizing Tensor-Core Kernels Beyond Latency Hiding at the GPU Power Wall

**Authors:** Taowen Liu, Zhiwen Mo, Hongxiang Fan, Aaron Zhao (arXiv 2611.32440, submitted 2026-11-24, primary cs.DC)

## Overview
At the power wall, a tensor-core kernel's runtime is not cycle count — it is **energy per call ÷ power cap**. Liu et al. formalize this for kernel design: even data movement whose latency is fully hidden by computation still burns energy, lowering the sustained clock. **Joule** is a framework that makes this energy–frequency coupling a first-class cost in tensor-kernel design and scheduling, deriving a *power-aware speed of light* (PSoL) to separate structural gaps from implementation gaps.

## Problem Statement
Classical kernel optimization (roofline/latency-hiding thinking) stops optimizing once memory traffic is hidden behind compute. Near the board power cap, that's wrong: hidden traffic still consumes power, which throttles frequency, so reducing traffic shortens runtime **even with zero change in cycle count**. Existing models give no way to predict sustained frequency or to know how much headroom a kernel really has.

## Key Contribution
- **Energy-based runtime model** under a power cap: combines hardware event counts, physical data-path energy costs, and **nonlinear voltage scaling across power domains** to solve for sustained frequency and runtime.
- **Power-aware Speed of Light (PSoL)**: combines the model with data-movement lower bounds across memory levels and dies, quantifying how much of a kernel's gap is structural vs implementation.
- **PSoL-guided kernel design on B200**: wide-tile kernels using the *full* TMEM (tensor memory) capacity, with fine-grained asynchronous rotation overlapping accumulator readout with tensor-core work.
- **Power-aware tile scheduling**: spatial and temporal scheduling that explicitly trades read sharing, locality, and load balance under the energy budget.
- **Accuracy**: 0.69% mean energy prediction error on B200 (given measured event counts).
- Open-sourcing promised upon publication.

## Results
- **Dense GEMM vs exhaustively autotuned cuBLAS**, geometric-mean speedups over 60 shapes: **4.94%** on B200, **6.64%** on H100 NVL, **2.12%** on RTX PRO 6000 — beating cuBLAS after exhaustive algorithm selection is a strong claim.
- **Fused Mega-MoE on 8×B200**: +2.60% to +5.17% over upstream DeepGEMM (with die-local expert weights).

## Technical Approach (mechanism sketch)
1. Count hardware events (memory transactions per level/die, tensor-core ops).
2. Price each event with physical data-path energy and per-domain voltage–frequency curves.
3. Solve the fixed-point: energy/call ÷ cap → sustainable clock → runtime.
4. Compare against PSoL to decide whether to attack data movement (structural) or scheduling (implementation).
5. Act on the verdict: full-TMEM wide tiles + async accumulator-readout rotation; power-aware tile assignment.

## Relevance to Our Domain
Our GPU-inference cluster (A40 + L4/T4 fleet) and GPU-compute notes already cover latency-hiding and roofline practice. Joule marks the paradigm shift for Blackwell-class hardware: **energy accounting replaces cycle counting as the top-level kernel objective**, and "hidden" traffic becomes an optimization target. Even though the headline kernels target B200, the methodology (event-count → energy → frequency fixed point, PSoL gap analysis) transfers to any power-capped accelerator and to ML-Ops capacity planning where sustained clocks, not peak FLOPS, determine serving throughput.

## References
- Paper: https://arxiv.org/abs/2611.32440
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32440
- Related in vault: cloud-infrastructure/gpu-compute/ (LLM inference at the GPU power wall, AI inference in the power cap era)
