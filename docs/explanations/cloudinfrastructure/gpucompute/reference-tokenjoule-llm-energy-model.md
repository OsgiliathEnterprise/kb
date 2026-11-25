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

**Authors:** George Karfakis, Lime Yao, Joyjit Kundu, Debjyoti Bhattacharjee, Puneet Gupta

## Overview
TokenJoule is an open-source analytical tool for the energy of distributed LLM training and inference. Unusually, the target is not operator-facing but pre-silicon design-space exploration (DSE): a DSE framework needs energy estimates before silicon exists, while conventional performance models miss the hidden work of the components that execute LLM operators, and earlier energy predictors are calibrated only on already-deployed GPUs. TokenJoule instead derives the component-level work directly from the workload.

## Problem Statement
Energy estimates for LLM workloads are either performance-model based — blind to the component work actually performed by the executing units — or measurement-calibrated predictors that require the very hardware a design-space exploration is trying to evaluate. There is no analytical model that derives per-component energy behavior from the workload itself, with no workload fitting.

## Reference: Model Mechanics & Validated Accuracy
**Derivation pipeline** (zero workload fitting):
1. Derive the sequence of device kernels an LLM workload executes.
2. Model the resulting tiled computation, shared-memory staging, cache residency, and collective traffic.
3. Set per-component energy by pricing that activity directly.

**Validated accuracy (no workload fitting):**
| Metric | Result |
|---|---|
| Activity error | **3.3–6.6%** across **151 A100/H100 runs** |
| Energy error | **3.0–6.8%** on A100 |

**Demonstrated uses:** guiding parallelization choices, memory packaging, and 3D-DRAM chip co-design; predicting energy before silicon exists.

**Code:** open-source (stated by the authors; no repository URL is given in the abstract — verify before citing).

## Relevance to Our Domain
For GPU-finops and capacity planning, TokenJoule's value is the *derivation* stance: because energy is priced from derived kernel/communication activity rather than fitted to a device, its errors stay low on hardware it was not calibrated on — the property needed for pre-purchase power planning and for comparing proposed hardware (3D-DRAM packaging, collective-heavy topologies) before it exists. Treat the component decomposition (kernels, tiling, shared memory, cache residency, collectives) as the checklist for where LLM jobs actually spend energy.

## References
- Paper: https://arxiv.org/abs/2611.31509
- Related: cloud-infrastructure/gpu-compute/explanation-pacer-gpu-power-excursions-edpp.md
- Related: cloud-infrastructure/gpu-compute/explanation-berth-slo-preserving-gpu-sharing.md
