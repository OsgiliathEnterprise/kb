---
title: Scalable Placement for Disaggregated LLM Serving on Heterogeneous Edge Fleets
diataxis: Explanation
domain: cloud-infrastructure
topic: edge-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.32881
date: '2026-11-25'
keywords:
- knowledge-base
- edge-compute
- cloud-infrastructure
- explanations
---
# Scalable Placement for Disaggregated LLM Serving on Heterogeneous Edge Fleets

## Overview
Spade is a centralized placement and profiling system for **disaggregated prefill/decode (d-p-d) serving of large MoE models on heterogeneous edge-device fleets** (Jetson-class boards). It models placement and routing end-to-end — KV-cache movement over the network fabric, prefill parallelism choices, per-replica decode capacity — and optimizes fleet throughput under per-device memory and SLO constraints, scaling to configurations prior approaches could not even address.

## Problem Statement
Fleet-wide LLM serving needs aggregate GPU capacity beyond datacenter budgets, so edge clusters (N Jetson boards) are a cost-effective alternative. Disaggregating prefill and decode onto specialized devices boosts throughput, but for MoE models the placement problem explodes: every replica needs a partitioned copy of expert parameters plus its attention components; the router must balance load while respecting memory limits and SLOs. The coupling of placement, parallelism and routing was considered intractable.

## Reference: System Design & Method
| Aspect | Spade's choice |
|---|---|
| Workload | Large MoE LLMs, disaggregated prefill/decode (d-p-d) |
| Hardware | Up to 64 heterogeneous edge devices (Jetson AGX Orin 64 GB, Jetson Orin NX 16 GB) |
| Model scale addressed | DeepSeek-V3/R1-class, **671B parameters** |
| Formulation | Joint placement + parallelism + **KV-cache routing** optimization |
| Constraints | Per-device memory, decode capacity per replica, SLOs, KV-transfer cost over the interconnect |
| Solvers | **Mixed-integer programming** for exact placement/routing; **constraint programming** for prefill parallelism |
| Validation | Physical testbed + simulation, using **hardware-calibrated decode-time and KV-transfer models** |

Key modeling insight: KV-cache movement is first-class — the router objective must charge for transfer over the network fabric, not just token load, otherwise placements that look balanced computationally collapse on transfer latency.

## Results
- **Up to 64 Jetson-class devices**, two hardware tiers, DeepSeek-V3/R1-scale (671B) MoE models — configurations beyond prior d-p-d placement work.
- Throughput gains up to **~1.6×** over strong d-p-d placement baselines; **~4×** over replicated-model baselines (with lower time-per-output-token).
- Accuracy grounded in both a real testbed and calibrated simulation (device-specific decode and KV-transfer latency models).

## Relevance to Our Domain
Complements the KB's edge-serving line (LEDGE request-level simulator, edge-inference offloading notes): Spade supplies the *fleet-planning* layer — an MILP/CP formulation anyone building on-prem Jetson/edge inference clusters can adapt, and a quantitative case that KV-transfer-aware routing is what makes disaggregation pay off outside the datacenter.

## References
- Paper: https://arxiv.org/abs/2611.32881
- Related: [[explanation-ledge-edge-llm-serving-simulator]], [[explanation-edge-inference-offloading-sinkhorn-collision-avoidance]], [[reference-gpu-scheduling-systems-llm-serving]]
