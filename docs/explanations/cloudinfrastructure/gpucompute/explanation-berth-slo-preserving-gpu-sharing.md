---
title: 'Berth: SLO-Preserving GPU Sharing Without New Preemption'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.25091
date: 2026-11-20
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# Berth: SLO-Preserving GPU Sharing Without New Preemption

## Overview
Inference services reserve GPUs for worst-case load, leaving most capacity idle; filling it with best-effort jobs (e.g. training) usually fails because a latency-critical (LC) request can find best-effort (BE) kernels running or queued ahead of it. Existing co-location systems get both SLO compliance and utilisation by reaching *inside* the stack — rewriting kernels, patching drivers, instrumenting frameworks — which is impossible on a closed GPU stack. Berth argues this is unnecessary and implements priority **entirely in user space**.

## Problem Statement
The three classical sharing mechanisms all leak latency on a shared GPU: spatial sharing cannot evict running BE kernels; temporal sharing only gives the LC request its turn; hardware partitioning protects latency by idling unused partitions. The missing ingredient is *priority* — but does the OS/GPU even need a new preemption mechanism to provide it?

## Key Contribution
- Observation: the **built-in commodity GPU time-slicer already preempts a running kernel within a fraction of a millisecond** and context-switches the instant a context runs out of work. It lacks only priority, and priority can be manufactured *externally* by controlling what the BE context is allowed to have queued.
- **Berth's three user-space mechanisms:**
  1. **Feed control** — a preloaded shim releases BE work to the GPU only when no LC request needs the device (don't queue what will delay a request).
  2. **Declared deadline reference** — extends the feed-control rule to continuous-batching LLM engines, where "a request needs the GPU" is defined by a per-token deadline.
  3. **Shortened BE time slice** — set without privileges, bounding how much latency a single long BE kernel can cost.
- **Zero intrusiveness:** changes no application, framework, kernel, or driver — works on a closed GPU stack.
- **Results:** across 31 scenario points with MLPerf SLOs and 13 baselines, Berth meets SLOs within a few percentage points of *running alone*, above every baseline, while delivering **2.7–3.5× the best-effort throughput** of the strongest baselines; beside LLM serving it meets per-token targets for nearly every request while training continues.

## Relevance to Our Domain
The pragmatic answer to GPU idleness for the KB's colocation notes: operators of closed stacks (proprietary drivers) get MPS/MIG-class SLO guarantees without touching the stack, purely by controlling BE submission. For agent-serving fleets this means idle diurnal inference capacity can absorb training/batch jobs with an SLO-safe shim instead of MIG partitioning; the "control what the existing time-slicer sees" principle is also a useful lens for evaluating competing preemption designs like Stint.

## References
- Paper: https://arxiv.org/abs/2611.25091
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25091
