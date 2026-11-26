---
title: 'Norn: Context-Length-Aware Optimization of Weight and KV Cache Placement for
  Offloaded LLM Inference'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.32295
date: 2026-11-24
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Norn: Context-Length-Aware Optimization of Weight and KV Cache Placement for Offloaded LLM Inference

**Authors:** Naoto Sugiura, Hiroki Matsutani

## Overview
Norn is a context-length-aware offloading method for running LLMs on a single memory-constrained GPU, with model weights and the KV cache partially offloaded to host memory. Its core observation: as the KV cache grows during decoding, GPU memory requirements and the costs of KV-cache transfers and attention computation *change* — so the static computation assignments and placements used by existing offloading methods become suboptimal mid-request. Norn co-optimizes placement and computation assignment offline at sublayer granularity, then switches execution plans as context grows, overlapping computation and transfers without knowing output lengths in advance.

## Problem Statement
Offloading weights and the growing KV cache to host memory lets LLMs exceed GPU memory, but PCIe transfer overhead dominates runtime. Existing methods use static computation assignments and static weight/KV placements that cannot adapt to how costs shift with context length, degrading inference performance across a request's lifecycle.

## How-to: Apply Norn's Context-Length-Aware Offloading
1. **Profile offline on the target GPU.** Characterize, per sublayer, how weight placement, KV placement and attention cost vary with context length.
2. **Co-optimize assignments and placements at sublayer granularity.** For each context-length regime, decide which sublayers' weights stay on-device versus streamed and where the KV cache lives.
3. **Precompute multiple execution plans plus switching points.** Encode the optimal plan per context-length regime and the boundaries at which plans should change.
4. **Switch plans during decoding as context grows.** At runtime, follow the plan table and overlap computation with data transfers, without needing to know the output length in advance.
5. **Use operator-major chunked prefill for long prompts.** Chunk the prefill stage by operator to avoid repeatedly transferring weights across chunks, and select the chunk size automatically.

## Technical Approach
Norn separates the expensive search (offline profiling and plan construction at sublayer level) from the cheap runtime action (plan switching plus compute/transfer overlap). The operator-major chunked prefill removes the repeated weight-transfer penalty of naive prefill chunking; automatic chunk-size selection and output-length-agnostic plan switching keep the method usable without a priori knowledge of request shapes.

## Results
Evaluated with **Qwen3-14B and Qwen3-32B on two single-GPU systems**:
- Up to **16.8× speedup in end-to-end latency** over Pipelined Sharding.
- Up to **4.2× speedup over an oracle variant** of the baseline that is given the input and output lengths in advance.

## Relevance to Our Domain
For the cheap single-GPU tier of an inference portfolio, Norn replaces ad-hoc offload flags with a principled recipe: offline sublayer profiling → precomputed plan table keyed on context length → runtime plan switching with overlap. That it beats an oracle baseline given true lengths (4.2×) suggests the win comes from schedule structure, not from predicting request shape — practical for interactive workloads where output length is unknown.

## References
- Paper: https://arxiv.org/abs/2611.32295
- Related: cloud-infrastructure/llm-serving/explanation-aggron-agentic-kv-cache-compression.md
- Related: cloud-infrastructure/gpu-compute/explanation-berth-slo-preserving-gpu-sharing.md
