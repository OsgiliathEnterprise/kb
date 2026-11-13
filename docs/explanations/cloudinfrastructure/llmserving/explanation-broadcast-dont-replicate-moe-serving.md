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

## Ecosystem Status — Expert Streaming Lands in vLLM (added 2026-11-13)
The paper's "stream, don't replicate" thesis is converging with production serving stacks:

- **vLLM RFC #38256 — Incremental MoE Expert Offloading** (GPU cache + async pipeline): expert weights live in CPU pinned memory; a fixed-size GPU cache holds the hottest experts with **LFRU eviction** (score = freq/age, deliberately preserving "hub" experts) and **cross-layer prediction** to pre-fetch before a miss. PR 1 (#37190, ~980 LOC) is open and CI-green. Design principle worth stealing: the cache is a *weight provider*, not a special forward path — `prepare(topk_ids)` returns GPU-resident tensors and the kernel never knows where weights came from, keeping torch.compile/CUDA-graph compatibility.
- **Independent production data (tinyserve)**: GPT-OSS-20B MXFP4 on an 8 GB laptop GPU sustains ~30 tok/s decode with 97–100% temporal-prediction cache hit rate — 160× faster than HF `device_map="auto"`. On GB300, moving 12.7 GiB of experts Grace→HBM raised C1 decode 79.5 → 89.2 tok/s (+12%).
- **Hard-won operational caveats** that corroborate the paper's cost-model framing: speculative prefetch is *net-negative at low concurrency* (fixed ~8.9 s/chunk + 0.79 ms/token overhead — gate prefetch on concurrency); usage-based residency beats layer-position-based residency (+73% in the RFC's data, mirroring this paper's rejection of naive partitioning); and OOM accounting must include the activation workspace, not just weights + KV cache — the same joint KV+expert-working-set budgeting the paper's admission control performs.
- Prior in-tree art for context: #34535 (static CPU offload, no runtime migration) and #29941 (async H2D prefetch for dense weights); a monolithic MoE-offload RFC (#33869/#31938) stalled at 6.3k LOC — a reminder that the cost model should ship as small, reviewable pieces.

**Practical takeaway:** the delta between this paper and stock vLLM is shrinking fast; adopt its scheduler primitives (locality-first batching, bandwidth-budgeted admission) now, and track vLLM #38256 before building a bespoke expert-cache layer.

## References
- Paper: https://arxiv.org/abs/2611.17097
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17097
- vLLM RFC #38256 — Incremental MoE Expert Offloading: https://github.com/vllm-project/vllm/issues/38256
- vLLM PR #37190 (PR 1 of RFC #38256): https://github.com/vllm-project/vllm/pull/37190
- AMD ROCm vLLM MoE playbook (TP/DP/PP/EP tradeoffs on MI300X): https://rocm.blogs.amd.com/software-tools-optimization/vllm-moe-guide/README.html
