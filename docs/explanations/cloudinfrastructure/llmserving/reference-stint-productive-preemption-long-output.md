---
title: 'Stint: Making Preemption Productive in Long-Output LLM Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.20106
date: 2026-11-17
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Stint: Making Preemption Productive in Long-Output LLM Serving

## Overview

Reasoning models emit long outputs whose KV caches pin GPU memory for minutes. When memory fills, servers preempt requests, and a preempted request can repeatedly lose and rebuild its state while producing almost no output — a pathology the authors name **KV thrashing**; in some workloads over a fifth of requests stall for more than a minute. Stint is a serving system that accepts preemption as unavoidable and instead makes it *productive*: preserve the preempted request's work, bound its wait, and hand it fresh output on return.

## Problem Statement

Preemption cannot be eliminated without delaying admission, so the real design question is what happens *around* preemption. Existing engines either recompute the whole KV cache on readmission (wasting GPU time and starving victims) or leave victims queued behind fresh admissions indefinitely.

## Architecture / Mechanism

| Component | Design |
|---|---|
| KV snapshot store | Fixed-length snapshots in a **contiguity-first CPU pool** with an exact-extent allocator |
| Data movement | Fused K/V gather/scatter kernels + double buffering |
| Readmission policy | **Age-based**: stalled requests are brought back before fresh ones |
| Anti-re-thrash | **Protection**: a returned request gets a guaranteed turn of fresh decoding before it can be preempted again |
| Victim selection | **Remaining-length estimates from decoding hidden states** (preempt requests that still have the longest way to go last / appropriately) |

## Results

Benchmark: olympiad-math replays, Qwen3-32B on H200 GPUs.

- **No request pauses > 50 s** under Stint.
- **p99 time-per-output-token −50.7%** vs recomputation in the same engine.
- Whole replay completes **10.7% sooner (≈12.0% higher throughput)** — because previously starved requests no longer finish last.

## Relevance to Our Domain

For anyone serving reasoning-style models (long agentic/tool loops included), KV thrashing is the failure mode behind mysterious minute-scale tail latencies under memory pressure. Stint's parameter set — snapshot pooling on the CPU side, age-based readmission, decode-protection windows, hidden-state remaining-length estimates — is a directly reusable design checklist for vLLM/SGLang-class schedulers.

## References

- Paper: https://arxiv.org/abs/2611.20106 (cs.DC, cs.AI, cs.OS — Shi, Wan, Ruan, Huang, Lin, Li; 40 pp., under review)
- Related: `explanation-velserve-tail-calibrated-scheduling.md`, `explanation-batch-makespan-llm-agent-workloads.md`
