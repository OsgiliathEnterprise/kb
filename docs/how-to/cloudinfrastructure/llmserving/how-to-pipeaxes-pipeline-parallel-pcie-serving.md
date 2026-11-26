---
title: 'PipeAxes: Decoupling Compute and Communication Granularities for Pipeline-Parallel
  LLM Serving'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.34615
date: 2026-11-25
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# PipeAxes: Decoupling Compute and Communication Granularities for Pipeline-Parallel LLM Serving
**Authors:** Xiaoqiang Guo, Yifan Lin, Yang Liu, Jianan Zhang, Yingqi Peng, Jiamei Lv, Yi Gao, Wei Dong

## Overview
Pipeline parallelism lets you serve long-context language models on PCIe servers and across heterogeneous GPU clusters, where NVLink-class bandwidth is unavailable. Existing engines split prefill into token chunks to limit decode stalls — but that single chunk size simultaneously fixes the GPU batch width *and* the size of activation transfers between stages: small chunks force frequent model-weight reloads, large chunks keep the GPU and the link busy long enough to delay interactive requests. PipeAxes' insight is to stop coupling compute and communication into one granularity and tune each independently.

## Problem Statement
On PCIe fabrics, per-chunk activation transfers and weight reloads dominate pipeline-parallel serving. Token-chunked prefill conflates several knobs (batch width, transfer size, stall behaviour) into one, so no single chunk size satisfies both throughput and interactive latency, especially in mixed long-context + decode workloads.

## How-to: apply the PipeAxes design
1. **Run wide prefill batches, sliced by layers.** Instead of token-chunked prefill, take wide batches and process them a few layers at a time, so decode requests can run *between* slices — this decouples prefill batch width from stage-transfer size.
2. **Compress activations at the wire boundary.** Use a fused Triton Hadamard-INT4 codec to compress inter-stage activations, cutting the bandwidth each transfer needs.
3. **Transfer in independently sized row groups over parallel TCP sockets.** Do not tie transfer granularity to compute granularity: row groups are sized independently and streamed over multiple parallel sockets.
4. **Let a slack-aware scheduler choose the three granularities.** The scheduler uses available latency slack to pick batch width, slice depth, and row-group size per situation rather than fixing a single chunk size.

## Results (reported in the paper)
- Evaluation via 97 replays covering 5,016 requests on A800, RTX 4090 and RTX 3090 GPUs; all 74 requests met their latency targets during a tenfold bandwidth swing.
- Four-stage mixture-of-experts pipeline: requests served within latency targets at **23.3×** the rate of calibrated Revisit-PP and **4.44×** the rate of Fixed-4096 with Express.
- Mixed 64K-context workload: p95 time-to-first-token for short requests fell from **129.8 s** (native vLLM) to **512 ms**.
- Quality with INT4 transport vs BF16: MMLU **+0.06 pp**, GSM8K **−0.46 pp** — near-lossless for the bandwidth saved.

## Verification
Replay traces (as in the paper's 97-replay methodology) while sweeping bandwidth by 10× and check per-request latency-target attainment; re-run the mixed 64K-context mix and compare p95 TTFT against native vLLM; re-check MMLU/GSM8K under INT4 transport to bound accuracy drift.

## Relevance to Our Domain
Concrete recipe for long-context serving on commodity PCIe boxes and heterogeneous clusters: treat batch width, slice depth and transfer granularity as *separate* schedulable knobs, compress activations near the wire, and use latency slack as the scheduling signal. The INT4 Hadamard transport result (≈0.5 pp accuracy drift) makes lossy activation compression a viable default on cheap interconnects.

## References
- Paper: https://arxiv.org/abs/2611.34615
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34615
