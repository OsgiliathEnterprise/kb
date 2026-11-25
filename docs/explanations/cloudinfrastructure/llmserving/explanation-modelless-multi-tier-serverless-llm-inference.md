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

**Authors:** Ding Shi, Wei Wu, Jiayuan Chen, Chenghu Yang

## Overview
ModelLess is a serverless system for LLM inference on shared GPUs. Today's platforms sell online, asynchronous, batch and rollout products on GPUs provisioned per product, so a service's cards sit idle between bursts while other work waits. ModelLess flips ownership: users declare model services, the platform owns the instances, and idle services scale to zero with their weights parked in host memory — making wake-up a seconds-scale operation instead of a minutes-scale cold start, and letting freed GPUs be lent to lower-priority tiers.

## Problem Statement
Per-product GPU provisioning wastes capacity between bursts. Scale-to-zero would fix that, but LLM instances are expensive to evict and restart: for GLM-5.2 at TP8, ModelLess measures ~1 s to release a GPU and ~4 s to wake with weights in host memory, versus a cold start of over four minutes. Cluster managers also treat preemption as all-or-nothing, which is wrong for LLM instances whose eviction cost depends on which parts — weights, execution state, KV cache, in-flight requests — survive it.

## Key Contribution
- **Sleep-with-weights-in-host-memory lifecycle**: idle services release GPUs in ~1 s and wake in ~4 s (GLM-5.2 TP8) versus a >4-minute cold start; billing follows the time a service actually holds GPUs.
- **Tier-specific eviction semantics**: each tier (online, job, flex) declares what it may lose when preempted, instead of one-size-fits-all kills.
- **Fail-closed preemption protocol**: closes admission before releasing memory, and re-enqueues a request durably before aborting it.
- **Four enforcement components**: entry, dispatcher, node agent, and an SGLang plugin — providing sleep/wake, pause/resume of in-flight requests for the flex tier, and a weight-copy path (follow/seal) for RL rollout.
- **GPU lending**: GPUs freed by sleeping services are lent to lower tiers.

## Technical Approach
The design makes eviction cheap and safe. Because an LLM instance's eviction cost is decomposable (weights, execution state, KV cache, in-flight requests), tiers specify their loss tolerance and the preemption protocol enforces it without losing requests: admission closes first, requests are durably re-enqueued before any abort, and the protocol fails closed. Sleeping instances keep weights in host memory so wake-up skips the full load path. Enforcement spans the entry point, the dispatcher, a node agent, and a plugin inside the SGLang engine.

## Results
- Replaying **a week of traces from 1,100 H20 cards** serving long-tail online models: about **38% of GPU-time (417 equivalent GPUs) could be lent** to lower tiers under a coarse latency target with one fixed idle threshold. The authors flag this as an idealized upper bound that holds only if recovery takes seconds — with a 240 s cold start, only 8% remains even with per-service thresholds.
- On one node, a single four-hour run per policy: **pausing yields 22% more borrower tokens per held-GPU sample** than abort-and-requeue, at the same median online latency.
- Author-stated caveats: the job tier and the follow/seal weight-copy path are **not yet evaluated end to end**.

## Relevance to Our Domain
For GPU-finops and multi-tenant serving platforms, ModelLess contributes two design patterns: (1) sleep-with-weights-in-host-memory as the mechanism that makes scale-to-zero viable for LLMs, and (2) per-tier eviction semantics plus a fail-closed preemption protocol for lending GPUs across priority tiers. The 38%-lent figure doubles as a capacity-planning benchmark — and its sensitivity to recovery latency (38% → 8% at a 240 s cold start) quantifies why wake-up time is the metric to engineer.

## References
- Paper: https://arxiv.org/abs/2611.32634
- Related: cloud-infrastructure/llm-serving/explanation-aggron-agentic-kv-cache-compression.md
- Related: cloud-infrastructure/gpu-compute/explanation-berth-slo-preserving-gpu-sharing.md
