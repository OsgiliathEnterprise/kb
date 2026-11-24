---
title: 'HiPerfCC-KVCache: Accelerating Confidential LLM Serving with Hierarchical
  KV Caching'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.28702
date: '2026-11-24'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# HiPerfCC-KVCache: Accelerating Confidential LLM Serving with Hierarchical KV Caching

**Authors:** Haoxuan Xu, Shaoyu Wang, Minghao Lin, Beijie Liu, Potung Yu, Yongqin Wang, Vincent Quentin Ulitzsch, Seo Jin Park, Murali Annavaram, Mengyuan Li

## Overview
Hierarchical KV caching — keeping reusable KV state in host memory to skip repeated prefill — loses most of its benefit once GPUs run in confidential-computing (CC) mode. This paper pinpoints why: **bulk KV copies hold driver locks during prolonged CPU-side processing**, stalling independent serving operations even when they live in separate threads and CUDA streams. HiPerfCC-KVCache is a set of system-level fixes in SGLang that restores most of the hierarchical-caching benefit under GPU-CC, with no hardware or driver changes.

## Problem Statement
Under GPU-CC, every CPU↔GPU transfer goes through the protected-transfer path. Hierarchical serving moves KV state back and forth constantly (backup on eviction, restore on reuse), so KV traffic becomes the CC bottleneck — not for cryptographic reasons per se, but because the CC transfer path serializes on driver locks: a big KV copy keeps the lock while the CPU side does its work, blocking unrelated operations that would otherwise overlap.

## Characterization (the empirical core)
Measured on Hopper and Blackwell GPUs, along three axes:
- **Lock scope** — how long and how widely the driver lock is held during protected transfers.
- **Copy granularity** — bulk copies vs. bounded submissions; bulk copies are what stall foreground progress.
- **Allocation ownership** — who owns the staging buffers and how that affects transfer parallelism.

## System Design (three mechanisms)
1. **Resource-lifetime management** — careful ownership of CC transfer resources so a backup in flight cannot monopolize the driver path.
2. **Prioritized ready-token readback** — decode tokens that are ready to return to the host are prioritized *between* bounded backup submissions, so user-visible progress is never queued behind KV offload work.
3. **Parallel KV restores via auxiliary contexts with shared GPU staging** — restore traffic (the latency-critical direction) runs concurrently instead of serially.

Implemented in **SGLang**, using only existing protected-transfer interfaces — deployable today on stock CC-capable hardware.

## Results
| Platform | Metric | Result |
|---|---|---|
| H200 (3 models × 3 workloads) | Output-token throughput (geo-mean) vs HiCache-Workers staged KV-transfer baseline | **1.74×** (up to **2.72×**) at highest loads |
| H200 | Mean time-to-first-token | **−36 %** average, up to **−59 %** |
| RTX PRO 6000 Blackwell | Output-token throughput (geo-mean) | **1.28×** (up to **2.20×**) |

A capacity analysis models why gains vary across configurations and quantifies the remaining gap to CC-off serving.

## Why It Matters (Explanation)
Two transferable lessons: (1) under confidential computing, the bottleneck for data-intensive serving features is **lock discipline in the protected-transfer path**, not raw encryption cost — so the fixes are scheduling and resource-lifetime engineering, not new crypto; (2) hierarchical KV designs (the Stint / XM-Sparse / HiCache family already in this KB) must be re-validated under CC mode before capacity planning, since the CC transfer path changes their cost model fundamentally.

## References
- Paper: https://arxiv.org/abs/2611.28702
- Related in KB: `reference-stint-productive-preemption-long-output.md`, `reference-xm-sparse-sparse-attention-serving-scale-up-memory-pools.md`
