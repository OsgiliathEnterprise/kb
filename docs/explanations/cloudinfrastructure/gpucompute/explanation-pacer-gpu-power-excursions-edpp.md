---
title: PACER — GPU Power-Excursion (EDPp) Management for ML Workloads
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.17206
date: 2026-11-13
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# PACER: Managing GPU Power Excursions (EDPp) That Silently Ruin ML Performance

## Overview

GPU performance variability is usually discussed *across* GPUs — chips differ, and prior work showed consistent inter-GPU gaps. Jain et al. (UW Madison / Intel / Michigan) show the bigger modern problem is *within a single GPU over time*: LLM workloads exhibit strong **intra-GPU variability** because their short-running kernels collide with the coarse control granularity of dynamic power management. The culprit is **EDPp** — Electrical Design Power peaks, transient excursions where power temporarily exceeds the GPU's rated limit. PACER is the first systematic characterization of EDPp magnitude and frequency, plus a hardware/firmware-assisted management scheme that gains **3–12% over state-of-the-art GPU power management and lands within 3% of an oracle**.

## Problem Statement

Power-management firmware keeps GPUs reliable in the presence of EDPp, but *sustained* high-magnitude excursions trigger throttling, which destroys application performance and predictability. ML workloads are the worst case: they combine high power draw, short kernels, and rapidly shifting compute demands, making frequent significant overshoots common. Nobody had quantified EDPp behavior or tied it to intra-GPU variability before.

## Key Contribution

- **First EDPp characterization**: measures magnitude and frequency of power excursions across popular workloads, establishing that ML/LLM kernels are uniquely excursion-prone because kernel lifetimes are shorter than the power-management control loop granularity.
- **Dual nature of EDPp**: properly managed excursions enable *computational sprinting* (bursting above sustained power for real speedups); unmanaged, excessive excursions cause throttling and intra-GPU variability. The goal is not to eliminate EDPp but to keep it inside the beneficial band.
- **PACER**: combines hardware and firmware mechanisms to make power-management behavior consistent, suppressing the throttling-inducing regime while preserving sprint headroom.
- **Evaluation**: 3–12% performance improvement over SOTA GPU power management, within 3% of an oracular solution across a range of popular workloads.

## Technical Approach

The paper's method is characterization-first: instrument GPUs running ML workloads to capture excursion magnitude/frequency, correlate with kernel timing and throttle events, then design firmware/hardware controls that smooth the power-management response so short kernels don't repeatedly trip throttling thresholds. Managing the *interface* between kernel-duration timescales and power-control timescales — rather than optimizing kernels themselves — is the core insight.

## Relevance to Our Domain

For anyone running LLM training or inference fleets, unexplained throughput jitter often traced to a "different GPU" may actually be EDPp-driven intra-GPU variability. This informs capacity planning (power headroom is a performance resource), colocation policy, and the design of GPU metrics dashboards: track power-excursion events, not just average utilization/wattage.

## References

- Paper: https://arxiv.org/abs/2611.17206
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17206
- Related notes: `reference/cloudinfrastructure/gpucompute/` (CUDA MPS, locality domains), `how-to/cloudinfrastructure/gpucompute/` (MegaOps)
