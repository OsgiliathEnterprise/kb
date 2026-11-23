---
title: 'IsoMoE: Placement-Invariant Hybrid CPU-GPU MoE Inference with Lossless 12-bit
  Experts'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.27604
date: 2026-11-23
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# IsoMoE: Placement-Invariant Hybrid CPU-GPU MoE Inference with Lossless 12-bit Experts

**Authors:** Hang Gu, Teng Wang, Zhendong Zheng, Qianyu Cheng, Wenqi Lou, Lei Gong, Xi Li, Xuehai Zhou — arXiv:2611.27604 (November 2026)

## Overview
IsoMoE is a hybrid CPU-GPU MoE inference system that guarantees **greedy-decoding outputs do not change with expert placement**. Hybrid engines let a single GPU run MoE models larger than its memory by offloading some experts to the CPU — but in existing engines, moving an expert between devices changes the output, because the two devices compute experts with different arithmetic. IsoMoE makes placement a pure performance knob, then exploits that freedom to overlap CPU and GPU work.

## Problem Statement
Two coupled problems in hybrid MoE serving: (1) expert placement shifts with free GPU memory and *should* only affect speed, yet greedy outputs currently diverge with placement because CPU and GPU expert kernels use different arithmetic; (2) decoding is bottlenecked by CPU memory bandwidth — lossless compression cuts traffic, but entropy-coded formats decompress too slowly on CPU to keep up with memory reads.

## How-to: Build a Placement-Invariant Hybrid CPU-GPU MoE Stack
1. **Make the GPU replay the CPU's arithmetic bitwise.** Implement a GPU expert kernel that *bitwise replays* the CPU expert kernel's arithmetic, so a token routed to either device yields identical logits — this is the invariance contract everything else rests on.
2. **Compute lossless 12-bit experts directly on the CPU.** Store experts in a lossless 12-bit format with a memory layout that lets the CPU apply **AVX-512 dot-product instructions** to them directly — no slow entropy decoding step in the critical path, so bandwidth relief does not cost latency.
3. **Overlap devices with a dual micro-batch pipeline.** Run two micro-batches so CPU and GPU computation overlap, designed so the pipelining never changes outputs (invariance preserved under scheduling).
4. **Verify invariance as a release gate.** Confirm **bitwise-identical outputs across different expert placements** before letting any scheduler migrate experts freely.

## Results (paper-reported)
- Bitwise-identical greedy outputs across expert placements, on three MoE models.
- Faster than the **fastest baseline in every setting**: average decoding speedup **1.26×**, maximum **1.54×**.
- Open artifact: https://anonymous.4open.science/r/isomoe-artifact-9C21/

## Why It Works
Bitwise replayability is the enabling invariant: once placement cannot change arithmetic, expert scheduling becomes a pure performance decision — dynamic offloading and cross-device overlap fall out of it. Determinism stops being a constraint and becomes the feature that unlocks the scheduler.

## Relevance to Our Domain
Single-GPU hosts running MoE models larger than VRAM (dev boxes, edge/cost-constrained serving) get a concrete blueprint: deterministic output across placements is also a prerequisite for reproducible evaluations, logit caching, and A/B-validated serving changes.

## See Also
- [[Isonomy: Isolating LLM Prefill from Serving Co-tenants via Timing Side-Channel Elimination]]
- [[Speculative Decoding Is Less Speculative Than You Think]] (explanation)

## References
- Paper: https://arxiv.org/abs/2611.27604
- Artifact: https://anonymous.4open.science/r/isomoe-artifact-9C21/
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27604
