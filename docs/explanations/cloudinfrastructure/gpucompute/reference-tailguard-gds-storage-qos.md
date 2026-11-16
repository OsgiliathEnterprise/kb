---
title: TailGuard-GDS — Tail-Safe Control of GPU Storage Data Movement
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.17824
date: 2026-11-16
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# TailGuard-GDS: Tail-Safe Control of GPU Storage Data Movement

> Corrected 2026-11-16 by KB Zookeeper: the first intake version ("multi-tenant storage bandwidth QoS under 128:1 read oversubscription, Zedong Wei et al., UConn") did not match arXiv:2611.17824 and was replaced with facts verified against the arXiv abstract page.

## Overview

TailGuard-GDS (Jiaqi Liu, Fan Yang, Xiaohang Shi, Xianzhe Zhang, Tao Jiang, Guojun Yuan, Zhan Wang, Guangming Tan; arXiv:2611.17824, 13 Nov 2026, cs.DC/cs.OS, 35-page research article) is a **runtime that chooses, per application phase, a semantically equivalent GPU↔NVMe data-movement plan** to minimize GPU-visible tail latency. GPUDirect Storage (GDS) removes host staging, but the authors' **eight-H100 measurements show GDS is not consistently tail-optimal** for semantically identical GPU-buffer operations: the best path varies with operation, request size, concurrency, placement, and resource contention — and the bandwidth winner and tail-latency winner can disagree.

## Problem Statement

Frameworks specify *what* moves and when; GPU I/O stacks expose *mechanisms*; neither combines phase semantics with measured tail behaviour to pick a delivery plan. A fixed choice (always GDS or always host staging) leaves tail latency on the table.

## Key Technical Specifications

| Property | Detail |
|---|---|
| Plan dimensions | Backend (GDS vs host staging), request shape, placement |
| Objective | Minimize GPU-visible tail latency under phase constraints |
| Adaptivity | Re-profiles and revisits decisions as conditions change |
| Overhead | Resource reuse keeps policy lookup and switching at **microsecond scale** |
| Integrations | PyTorch FSDP, DeepSpeed ZeRO-3 |

## Results (from the abstract)

- **FSDP:** step p95 **−18.4%**, GPU-idle p95 **−25.3%** vs the strongest fixed path.
- **Five eight-GPU ZeRO-3 workloads:** step p95 **−7.9–24.6%** vs fixed host staging; **−28.4–42.6%** vs fixed GDS.
- **Vs tuned DeepSpeed AIO:** step p95 **−5.6%**, estimated throughput **+6.1%**.

## Relevance to Our Domain

Practical guidance for GPU clusters that use GDS for checkpointing and disaggregated serving: "GDS everywhere" is not tail-optimal; a phase-aware plan selector with measured (not assumed) path choice is the robust pattern. Relevant to any GDS-based KV-offload or checkpoint-loading architecture.

## References

- Paper: https://arxiv.org/abs/2611.17824
- Related: `reference-superfluid-multi-model-serving.md`
