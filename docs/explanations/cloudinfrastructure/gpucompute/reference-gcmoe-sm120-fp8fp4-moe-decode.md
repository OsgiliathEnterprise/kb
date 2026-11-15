---
title: 'GC-MoE on SM120: Overlapping Expert-Parallel Token Dispatch with Warp-Level
  FP8xFP4 Block-Scaled MMA on Consumer Blackwell'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.16219
date: 2026-11-15
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# GC-MoE on SM120: Overlapping Expert-Parallel Token Dispatch with Warp-Level FP8xFP4 Block-Scaled MMA on Consumer Blackwell

## Overview

A hardware-port reference for expert-parallel Mixture-of-Experts (MoE) decoding on **SM120 consumer/datacenter Blackwell** (compute capability 12.0, e.g. RTX PRO 5000), rebuilt from the earlier GC-MoE persistent CUDA-Graph operator that targeted Hopper (SM90) and datacenter Blackwell (SM100). It documents exactly which tensor-core facilities SM120 lacks, and the kernel architecture that works around them while beating prior MoE decode kernels over PCIe.

## Problem Statement

Expert-parallel MoE decoding is latency-bound: each layer serializes token exchange → grouped GEMM over routed experts → combine, with only a few tokens in flight per rank. The prior GC-MoE operator fused those phases into one persistent, Green-Context-partitioned CUDA Graph — but its design leaned on SM90/SM100 hardware features that **SM120 does not expose**: no tensor memory, no two-CTA MMA, no cluster multicast. Block-scaled tensor cores on SM120 are reachable only through warp-level `mma.sync.aligned.kind::mxf8f6f4`.

## Technical Specification (SM120 kernel design)

| Aspect | Design choice |
|---|---|
| MMA primitive | Warp-level `mma.sync.aligned.kind::mxf8f6f4` (block-scaled) |
| Operand layout | Swap-AB: **FP4 weights in register A operand, FP8 activations in B** |
| Scale handling | Scale-byte selection through MMA immediates |
| Weight path | Compact-weights path to fit register file pressure |
| Tile geometry | Adaptive token-tile geometry |
| Dispatch | Expert-granular streaming dispatch; batched bulk-pull engine; **64-bit deduplicating pull cache** |
| Returns | Full-width BF16 returns drained by resident relay copiers over a position-major arena |
| Shared experts | Folded into the compute role (no separate path) |

## Results (measured)

- Hardware: **8× RTX PRO 5000 over PCIe**.
- **1.522×** faster than FlashInfer CuTe DSL W4A8 MegaMoE and **1.387×** faster than Cake MegaMoE across 18 decode points (18/18 wins each).
- **1.388×** faster than Cake with shared experts fused.
- Correctness: all **94 numerical cases** and **752 per-rank checks** pass; cross-operator cosine similarity ≥ **0.9999997**.

## Relevance to Our Domain

The practical benchmark of "how far can MoE inference be pushed on affordable Blackwell cards over PCIe" — the exact regime of self-hosted MoE serving. The paper is also a compact map of SM120's hardware asymmetries vs SM90/SM100, useful when porting any fused kernel to consumer Blackwell: assume no cluster multicast, no two-CTA MMA, warp-level-only block-scaled MMA, and design FP4-weight/FP8-activation paths around swap-AB.

## References

- Paper: https://arxiv.org/abs/2611.16219
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16219
- Related KB notes: `cloud-infrastructure/gpu-compute/howto-kernellopt-agentic-gpu-kernel-optimization.md`, `cloud-infrastructure/gpu-compute/howto-megaops-tile-level-kernel-overlapping.md`
