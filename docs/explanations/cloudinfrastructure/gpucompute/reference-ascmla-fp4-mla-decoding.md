---
title: 'AscMLA: Unlocking FP4 Efficiency for Long-Context MLA Decoding through Asymmetric
  Scaling'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.26106
date: 2026-11-20
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# AscMLA: Unlocking FP4 Efficiency for Long-Context MLA Decoding through Asymmetric Scaling

## Overview
AscMLA is a kernel/system design that makes FP4 quantization practical for decoding with Multi-head Latent Attention (MLA) under long contexts. Long-context decoding is dominated by repeated reads of a growing KV cache; FP4 cuts that storage and traffic but its narrow dynamic range demands block scaling. In MLA, K and V share a single latent representation yet have *different* scaling requirements — the core mismatch AscMLA resolves without dequantization or duplicate encodings.

## Problem
| Constraint | Consequence |
|---|---|
| FP4 has limited dynamic range | Requires block scaling to be usable |
| MLA compresses K/V into a shared latent | K and V need different scales on the same data |
| Prior approaches: dequantize, or separate encodings | Extra execution overhead or extra storage overhead |

## Specification Summary
| Property | AscMLA approach |
|---|---|
| Encoding | Single FP4 payload for the shared MLA latent (no duplicate K/V encodings) |
| Scaling | **Asymmetric K/V scaling** — separate scale factors applied per role |
| Scale delivery | **Pipelined scale delivery** so scale fetch/apply does not stall the FP4 payload path |
| No dequantization step | FP4 payload processed directly |

## Measured Performance
| Metric | Value |
|---|---|
| Cache memory vs FP8 | **38.2% less** |
| Geometric-mean speedup vs TRT-LLM FP8 MLA kernels | **1.35×** |
| Geometric-mean speedup vs CAKE's NVFP4 MLA kernels | **1.26×** |

## Relevance to Our Domain
Long-context agentic workloads make KV-cache bandwidth the decode bottleneck; FP4 is the next bandwidth step down from FP8/INT8, and MLA (DeepSeek-style architectures) is the attention form where naive FP4 block scaling breaks. AscMLA's asymmetric-scaling + pipelined-scale-delivery recipe is the reference point for evaluating FP4 readiness in MLA serving stacks (TRT-LLM, custom kernels). Pairs with capacity-side work in this topic: Berth reclaims idle GPUs, AscMLA shrinks the per-request memory footprint.

## Provenance & Verification (2026-11-21)
Verified against the arXiv v1 abstract (submitted 2026-11-19): all figures in this note match the paper exactly — 38.2% less cache memory than FP8, geomean 1.35× over TRT-LLM FP8 and 1.26× over CAKE NVFP4 MLA kernels; single FP4 payload with asymmetric K/V scaling + pipelined scale delivery, no dequantization or duplicate encodings. Authors: Zechun Zhou, Zhiyong Zheng, Xiaomin Zhang, Lin Ye, Han Li, Jingwei Sun, Guangzhong Sun, Jing Li (8 authors). Category: cs.DC.

## References
- Paper: https://arxiv.org/abs/2611.26106
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26106
- Related in KB: `explanation-berth-slo-preserving-gpu-sharing.md`
- arXiv HTML full text: https://arxiv.org/html/2611.26106v1
- FP4 inference-hardware context: Microsoft Maia 200 FP4/FP8 inference accelerator (https://www.marktechpost.com/2026-01-30/microsoft-unveils-maia-200-an-fp4-and-fp8-optimized-ai-inference-accelerator-for-azure-datacenters/)
