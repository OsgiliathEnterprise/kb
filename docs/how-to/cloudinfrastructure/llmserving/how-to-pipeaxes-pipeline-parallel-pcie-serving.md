---
title: 'PipeAxes: Decoupling Compute and Communication Granularities for Pipeline-Parallel
  LLM Serving'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.34615
date: 2026-11-26
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# PipeAxes: Decoupling Compute and Communication Granularities for Pipeline-Parallel LLM Serving

## Overview
PipeAxes makes pipeline parallelism practical for serving long-context LLMs on workstations and edge devices connected by **PCIe** — where the low interconnect bandwidth wrecks both tensor and pipeline parallelism (31%–79% of GPU time spent idle or communicating). The trick: stop forcing activation communication and expert computation to share a granularity. On 4× RTX 4090 it delivers **1.53–2.28× throughput** over SOTA pipeline parallelism at the same quality, and up to **2.10×/2.33×** the throughput of tensor parallelism at comparable memory footprint.

## Problem Statement
Long context pushes a model beyond a single GPU's memory. Tensor/pipeline parallelism solves capacity but not PCIe-era bandwidth: both schemes communicate activations at **token granularity**, so every token's activation crosses the interconnect. Expert-weight loading is *also* per-token. Result: communication dominates, GPUs stall.

## Key Contribution
Observation: activation communication and expert computation have **different natural granularities**. PipeAxes decouples them with three mechanisms:

## How-to: apply the PipeAxes design
1. **Batch activations at micro-batch granularity.** Instead of shipping per-token activations across stages, aggregate them per micro-batch to amortize communication costs over all tokens — this removes the per-token interconnect bottleneck on bandwidth-constrained fabrics like PCIe.
2. **Keep expert computation at token granularity.** Split the expert FFN of each stage into a dedicated **compute stream** and prefetch expert weights **proactively**, so loading hides behind the compute stream instead of stalling the main path.
3. **Make the two streams coexist via SM partitioning.** Because communication (batched) and expert compute (per-token) now run concurrently, partition GPU streaming multiprocessors between the streams to protect throughput and latency instead of letting them interfere.

## Results
- 4× RTX 4090 workstations, long-context serving: 1.53–2.28× throughput vs SOTA pipeline parallelism at comparable output quality; up to 2.10× (comparable memory) / 2.33× (higher quality) vs tensor parallelism.
- 8× RTX 4090 cluster: sustains **32K-token** contexts on a **110B-parameter** model where prior systems OOM.

## Relevance to Our Domain
The go-to recipe when serving long-context open-weight models on commodity GPU nodes (workstation/edge inference, lab clusters) without NVLink-class interconnects. The decoupling principle — batch what crosses the wire, keep fine-grained what stays local, partition SMs for concurrency — generalizes to other bandwidth-bound distributed inference designs.

## References
- Paper: https://arxiv.org/abs/2611.34615
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34615
