---
title: Superfluid — Fine-Grained Multi-LLM Serving on Shared GPUs
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.17753
date: 2026-11-16
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Superfluid: Fine-Grained Multi-LLM Serving on Shared GPUs

## Overview

Superfluid (Huiqiang Jiang, Youyou Lu, CUHK-Shenzhen) is a multi-LLM serving system that lets many models share a single GPU with *fine-grained, elastic* resource allocation. Instead of one model per GPU (wasteful) or crude time-slicing (latency spikes), it shares GPU compute tightly while enforcing per-model memory limits, and rebalances both load and memory dynamically across models.

## Problem Statement

Serving many LLMs on dedicated GPUs wastes capacity; existing multi-model systems either decouple compute/memory poorly or allocate resources statically, so bursty traffic on one model degrades the latency SLOs of its co-tenants.

## Key Technical Specifications

| Property | Detail |
|---|---|
| Sharing model | Fine-grained GPU sharing across concurrently served LLMs |
| Isolation | Per-model memory limits enforced at runtime |
| Load balancing | Dynamic cross-model balancing of compute load |
| Memory balancing | Eviction + paging mechanisms to rebalance memory between models |
| Evaluated config | Multiple 8B-parameter models on a single NVIDIA A40 (48 GB) |

## Results (Benchmark Data)

On 8B-model workloads on one 48 GB A40:

- **p99 TTFT** reduced **37% on average, up to 55%** vs. baselines.
- **p99 TPOT** reduced **44% on average, up to 67%**.

## Relevance to Our Domain

For GPU fleet operators, the eviction/paging + per-model quota design is the LLM-serving analogue of container memory ballooning — a concrete pattern for consolidating long-tail models onto shared accelerators without sacrificing tail latency. Complements our fair-inference and batch-inference serving notes.

## References

- Paper: https://arxiv.org/abs/2611.17753
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17753
- Related: `explanation-fairinference-token-latency-fairness-llm-serving.md`
