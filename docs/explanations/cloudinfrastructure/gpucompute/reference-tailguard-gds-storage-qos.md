---
title: TailGuard-GDS — Storage Bandwidth QoS for GPU-Direct NVMe under Oversubscription
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.17824
date: 2026-11-16
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# TailGuard-GDS: Bandwidth QoS for GPU-Direct NVMe Storage under Oversubscription

## Overview

TailGuard-GDS (Zedong Wei et al., UConn, with NVIDIA and U. Pittsburgh) is the first storage bandwidth-QoS mechanism for **GPU-direct NVMe access** in multi-tenant environments. It targets the core operational risk of GPU-direct storage (GDS) at scale: when many tenants share NVMe devices, extreme read oversubscription creates severe read interference — and existing CPU-side QoS mechanisms cannot help because GDS bypasses the host CPU entirely.

## Problem Statement

GDS lets GPUs read storage without host-CPU staging — great for checkpoint loading, KV-cache offload, and data pipelines. But in multi-tenant deployments, NVMe read bandwidth is heavily oversubscribed (the paper stresses a 128:1 subscription regime), so a few noisy tenants destroy the read-tail latency of everyone else. No QoS mechanism existed for this GPU-side path.

## Key Technical Specifications

| Property | Detail |
|---|---|
| Scope | NVMe read bandwidth QoS for GPU-direct (GDS) access paths |
| Threat regime | Read oversubscription up to 128:1 on shared NVMe |
| Core mechanism | Fine-grained **GPU-side** request queueing/management (CPU-side QoS bypassed by GDS) |
| Goal | Bounded read interference, preserved tenant bandwidth guarantees |
| Novelty | First storage bandwidth QoS design for GPU-direct access |

## Results

Prototype evaluation shows TailGuard-GDS suppresses read interference under heavy multi-tenant oversubscription and restores predictable read bandwidth where unmanaged GDS collapses in the tail.

## Relevance to Our Domain

As GPU clusters adopt GDS for checkpointing and disaggregated serving, storage becomes a shared, contended resource with no fairness layer — this is the "noisy neighbour" problem transplanted to the NVMe-GPU path. Useful design reference for GPU fleet planning, multi-tenant AI infrastructure, and any GDS-based KV-offload architecture.

## References

- Paper: https://arxiv.org/abs/2611.17824
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17824
- Related: `reference-superfluid-multi-model-serving.md`
