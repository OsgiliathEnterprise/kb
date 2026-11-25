---
title: 'ModelLess: A Serverless System for Multi-Tier LLM Inference on Shared GPUs'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.32634
date: 2026-11-25
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# ModelLess: A Serverless System for Multi-Tier LLM Inference on Shared GPUs

## Overview
ModelLess is a serverless LLM serving system that attacks cold-start cost at its root: instead of paying a full weight load on every wake-up, it keeps the model "warm at rest" across three tiers (GPU memory → host memory → NVMe), so waking a sleeping deployment reuses the part of the weights that already resides in the nearest tier. Layer-granularity sleep/wake plus a cross-request, cross-deployment prefetcher make cold starts 2–16× faster while sharing a small GPU pool across scale-to-zero deployments.

## Problem Statement
Serverless computing's scale-to-zero economics depend on cold starts being cheap. For LLM serving, the wake-up cost is dominated by loading multi-gigabyte weights into GPU memory; existing sleep-wake techniques mitigate this by parking weights in host memory, but the full host→device transfer is still paid on *every* wake-up. Meanwhile, existing multi-tier weight-management designs optimize warm-path throughput and were never designed for sleep-wake serving. The gap: no system jointly optimizes wake-up cost, tiered weight management, and deployment packing for serverless LLMs.

## Key Contribution
- **Unified sleep-wake + weight management**: the first system to jointly optimize sleep-wake lifecycle and multi-tier (GPU/host/NVMe) weight management for serverless LLM serving.
- **Multi-tier sleep-wake**: preemptions stage weights down the hierarchy so that reactivation only loads the layers missing from the nearest tier — warm at rest instead of cold start.
- **Layer-granularity preemption and restoration**: sleep and wake operate per layer, enabling fine-grained overlap and partial residency.
- **Cross-request, cross-deployment prefetching**: anticipates which weights will be needed next, across requests and across different deployments sharing the GPU.
- **Placement and packing mechanism**: co-locates multiple scale-to-zero deployments on small GPU pools to maximize utilization and minimize GPU idle time.

## Technical Approach
The architecture treats a sleeping model as a layered artifact spread over GPU HBM, host DRAM, and NVMe. On preemption, layers are demoted rather than discarded; on wake-up, only the residency gap is transferred, and the prefetcher hides the remaining latency by speculatively pulling layers ahead of the first token. A placement component packs many idle deployments per GPU so that scale-to-zero actually frees capacity while keeping hot sets nearby. Evaluation uses production-style traces on a 4-GPU testbed.

## Results
- Cold-start latency reduced by **2–16×** relative to existing sleep-wake baselines.
- Up to **4.1×** more requests served on the same 4-GPU testbed under production-style traces.

## Relevance to Our Domain
This is directly applicable to GPU-finops and serverless inference platforms: scale-to-zero only pays off when wake-up is sub-second, and ModelLess's tiered "warm at rest" model is the design pattern to copy for multi-tenant GPU pools. It complements KV-cache offloading work (see the Norn note) — ModelLess manages *weights* across tiers, Norn manages *weights + KV cache* under context-length variation.

## References
- Paper: https://arxiv.org/abs/2611.32634
- Related: cloud-infrastructure/llm-serving/how-to-norn-context-length-aware-offloading.md
- Related: cloud-infrastructure/llm-serving/reference-avalanche-intra-gpu-parallelism-serverless-llm.md
