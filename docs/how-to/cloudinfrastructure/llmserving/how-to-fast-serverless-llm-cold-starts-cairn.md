---
title: Fast Serverless LLM Cold Starts by Sharing and Prewarming Startup Work (Cairn)
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.16180
date: 2026-11-15
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Fast Serverless LLM Cold Starts by Sharing and Prewarming Startup Work (Cairn)

## Overview

Cairn is a cold-start optimization system for serverless LLM platforms. Its starting observation is brutal: on-demand worker startup takes about a minute, but **only 5–11% of that time loads model weights**. The rest is compilation, memory profiling and runtime setup — work that is either identical across servers or entirely model-independent, yet is redone by every new worker. Cairn eliminates the redundancy by sharing artifacts over a CXL memory pool and prewarming the model-independent phase.

## Problem Statement

Serverless LLM serving pays a ~60 s cold start per worker. Weight loading is a small slice; the dominant costs (engine compilation, CUDA memory profiling, runtime initialization) repeat per server even though, for the same model, every server computes the same result. Naive fixes (keep warm GPU pools, checkpoint/restore) either waste GPUs or still re-run model-independent setup.

## How to Cut Cold Starts (the Cairn recipe)

1. **Publish artifacts once.** The first server to start a given model publishes weights *and* engine artifacts (compiled kernels, profiling results) to a **CXL memory pool shared across the cluster**.
2. **Read in place.** Subsequent servers mount the shared pool and read artifacts directly, skipping re-download and re-compilation of identical work.
3. **Prewarm model-independent setup.** Maintain warm containers in which all setup that does not depend on the specific model is already completed.
4. **Swap in a template process.** When a request arrives, a pre-instantiated template process replaces the placeholder in the warm container, avoiding process-level initialization on the critical path.

## Technical Approach

Cairn decomposes the cold-start timeline into model-dependent vs model-independent phases and attack each with sharing (CXL pool for weights/engine artifacts) or prewarm (warm containers + template process). The shared-memory design exploits CXL's memory-semantic access so multiple servers consume the same artifact copy without duplicating it in local DRAM. Evaluation uses an emulated CXL pool.

## Results

- Stack: ServerlessLLM on **vLLM v0.20**, six models from **1B to 14B**, two servers sharing an emulated CXL pool.
- Cold starts **4.1×–5.2× faster** on servers with no local checkpoint.
- **Median TTFT on a request stream reduced by 64%**.

## Relevance to Our Domain

For any self-hosted, bursty LLM endpoint (spiky agents, CI-triggered inference, per-tenant models), this is a concrete tuning playbook: profile your cold-start breakdown first — if weights are &lt;20% of it, caching weights alone is the wrong lever; target compilation/profiling reuse instead. Even without CXL hardware, the principle "publish identical setup artifacts once, prewarm model-independent work, swap template processes" transfers to snapshot/restore and warm-pool designs.

## References

- Paper: https://arxiv.org/abs/2611.16180
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16180
- Related KB note: `cloud-infrastructure/llm-serving/explanation-batch-makespan-llm-agent-workloads.md`
