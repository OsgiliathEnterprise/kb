---
title: Broadcast, Don't Replicate — Streaming Expert Weights over HBM in MoE LLM Serving
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.17097
date: '2026-11-13'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Broadcast, Don't Replicate: Cost-Guided Streaming and Scheduling for Expert-Locality-Aware MoE LLM Serving

## Overview
Mixture-of-Experts LLMs split layers across GPUs and stream cold expert weights from host memory, but today this forces a choice between two bad placement policies: *replicate* popular experts on every device (wasting bandwidth, capping throughput at 30.17 tokens/s on Mixtral) or *partition* experts for locality (fragile under popularity shift). This paper reframes expert placement as a **cost-guided hybrid**: broadcast popular experts on demand, keep less-favored experts resident for locality. A cost model decides the blend; a two-stage locality-aware scheduler and an HBM-aware admission control protect the bandwidth and memory budgets.

## Problem Statement
Expert placement is a resource-contention problem: every replicated copy consumes scarce HBM-to-device bandwidth, and every locally-resident expert that goes cold wastes HBM. Prior work optimizes one side in isolation, so no single policy is robust to popularity drift. The open question was whether a principled, measured cost model could pick the right mix per workload.

## Key Contribution
- **Locality-first partitioning with on-demand broadcast** as the baseline policy, with an analytical cost model that chooses the replication/locality blend per workload.
- **Two-stage locality-aware scheduling**: first prefer tokens whose required experts are already resident on the device, then prefer expert groups that minimize HBM transfer — cutting interconnect traffic and latency.
- **HBM-aware admission control** that jointly accounts for KV-cache footprint and streamed-expert working set, keeping transfers inside the HBM bandwidth budget under concurrency.

## Results
| Metric (Mixtral serving) | Result |
|---|---|
| Throughput vs. full-replication baseline | 30.17 → 40.64 tokens/s (+34.7%) |
| TTFT / TPOT | reduced (per paper) |
| HBM traffic | reduced vs. replication |
| Robustness | holds under expert-popularity shift, where pure-partition policies degrade |

## Relevance to Our Domain
For GPU serving platforms running MoE models (Mixtral-class and beyond), this gives a concrete scheduling discipline: treat HBM streaming bandwidth as a schedulable resource, gate admission on KV-cache + expert working set together, and replicate by measurement not by popularity folklore. It complements our KVQuant and multi-model-serving notes in cloudinfrastructure.

## References
- Paper: https://arxiv.org/abs/2611.17097
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17097
