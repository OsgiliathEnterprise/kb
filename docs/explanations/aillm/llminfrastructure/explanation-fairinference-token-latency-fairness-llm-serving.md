---
title: 'FairInference: Token Latency Fairness and Performance Isolation for Multi-Tenant LLM Serving'
diataxis: Explanation
domain: aillm
topic: llminfrastructure
source: arXiv
source_url: https://arxiv.org/abs/2609.18112
arxiv_id: "2609.18112"
date: 2026-09-20
keywords:
- knowledge-base
- llminfrastructure
- aillm
- explanations
visibility: public
---

# FairInference: Token Latency Fairness and Performance Isolation for Multi-Tenant LLM Serving

## Overview

LLM serving is typically offered as a shared, multi-tenant service, where one client's high-demand workload can cause latency SLO violations for everyone else. Existing performance-isolation solutions equalize *throughput* in the long run (via queueing and batching fairness) but provide no *latency* isolation — so well-behaved clients still suffer token-level degradation. FairInference introduces a **δ-token fairness guarantee**: if a token takes `d` time units to generate in isolation, it will take at most `d + δ` under multi-tenant execution. This is a strong, per-token latency-isolation property that throughput-fairness approaches simply don't offer.

## Problem Statement

Throughput fairness (equalizing long-run tokens-per-second across tenants) does not protect individual token latencies. A noisy neighbor can still spike another client's inter-token and time-to-first-token latencies even if average throughput is equalized. The hard part specific to LLM serving: bounding the delays introduced by *sharing GPU resources* when there is no fine-grained scheduling or per-tenant resource allocation, plus accounting for extra delay from a **shared KV cache** in GPU memory.

## Key Contribution

- A novel **δ-token fairness guarantee** — a per-token latency bound (`d + δ`) that gives well-behaved clients strong latency isolation, not just throughput equality.
- A scheduler design that enforces **per-token deadlines**, bounds delays from shared-GPU compute, and explicitly accounts for the additional delay introduced by the shared KV cache in GPU memory.
- Demonstrated improvement over state-of-the-art LLM serving systems on both token-level latency spikes *and* overall throughput.

## Technical Approach

FairInference's scheduler tracks per-token deadlines rather than per-request or per-batch fairness. It bounds the delay a token incurs from sharing GPU compute (the core challenge, since GPUs lack fine-grained per-tenant allocation) and separately models the extra latency that comes from the shared KV cache occupying GPU memory. The net effect is a provable upper bound on how much multi-tenancy can slow any well-behaved client's individual tokens.

## Results

- FairInference effectively **bounds token-level latency spikes** for well-behaved clients under contention.
- It **improves overall throughput** compared to state-of-the-art LLM serving systems — the isolation guarantee does not come at a throughput cost.

## Relevance to Our Domain

For anyone operating multi-tenant LLM inference (shared GPU pools, SaaS inference endpoints), this reframes fairness from "equal throughput" to "bounded per-token latency." If your SLA is about user-perceived responsiveness (inter-token and TTFT) rather than raw tokens/second, FairInference's δ-token guarantee is the right primitive. The explicit treatment of shared-KV-cache delay is a detail most serving systems gloss over but that materially affects real-world tail latencies.

## References
- Paper: https://arxiv.org/abs/2609.18112
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.18112
