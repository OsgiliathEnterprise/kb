---
title: Snoopie — NVBit-Based Multi-GPU Communication Profiler and Visualizer
diataxis: Explanation
domain: AI-LLM
topic: LLM-Infrastructure
source: arXiv
source_url: https://arxiv.org/abs/2611.16330
date: 2026-11-15
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- explanations
---
# Snoopie — NVBit-Based Multi-GPU Communication Profiler and Visualizer

## Overview

Snoopie is an instrumentation-based profiling tool for GPU-to-GPU communication — the layer vendor profilers cover worst and the one that now dominates cost in multi-GPU training and inference. Built on NVIDIA's NVBit binary instrumentation framework, it tracks peer-to-peer transfers and the GPU-side calls issued by communication libraries, attributes every byte of movement to a source-code line and the data object involved, and offers visualization at multiple granularities. It is open source: https://github.com/ParCoreLab/snoopie.

## Problem Statement

Data movement is one of the most expensive bottlenecks in modern accelerated computing, yet first-party vendor profilers excel at *compute within a single GPU* and are inadequate for monitoring inter-GPU transfers and communication-library behavior. Performance bugs in the communication layer (unexpected copies, redundant transfers, library calls doing more than you assumed) are effectively invisible beneath abstraction boundaries.

## Tool Specification

| Property | Detail |
|---|---|
| Foundation | NVBit (dynamic binary instrumentation on NVIDIA GPUs) |
| Tracks | Peer-to-peer (P2P) GPU transfers; GPU-centric communication-library calls |
| Attribution | Maps data movement to source-code line **and** data object |
| Visualization | Multi-granularity: whole-system data-movement overview → per-instruction and per-address views |
| Access | Open source, https://github.com/ParCoreLab/snoopie |

## Demonstrated Use Cases (from the paper's case studies)

1. **Monitoring** actual data movement in multi-GPU applications (what crosses the links, when, how much).
2. **Locating performance bugs** — applications where communication volume/behavior deviates from what the code implies.
3. **Understanding library abstraction** — making concrete the transfers that collective/communication libraries hide behind high-level calls.

## Relevance to Our Domain

For LLM infrastructure work (tensor/pipeline/data-parallel training, multi-GPU serving), communication profiling is the missing observability tier: NCCL-level black boxes make scaling regressions hard to attribute. Snoopie's line-level and object-level attribution is the capability that turns "interconnect-bound" from a guess into a measured fact, and its instruction/address views are useful when a library's hidden behavior is the bug. Worth trialing alongside NCCL's own debugging env vars and vendor profilers, specifically for the inter-GPU blind spot they leave.

## References

- Paper: https://arxiv.org/abs/2611.16330
- Code: https://github.com/ParCoreLab/snoopie
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16330
