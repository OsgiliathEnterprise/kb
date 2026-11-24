---
title: 'Fast 4-bit KV-Cache Decoding on Hopper GPUs: Why Existing Kernels Are Slow
  and How to Fix Them'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.30027
date: '2026-11-24'
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- how-to
---
# Fast 4-bit KV-Cache Decoding on Hopper GPUs: Why Existing Kernels Are Slow and How to Fix Them

**Authors:** Jian Zhang

## Overview
A 4-bit KV cache reads about **half the bytes of FP8** — but Hopper has no FP4 hardware, and it offers little instruction-issue capacity per byte of memory bandwidth, so 4-bit values must be decoded in software, and the decoding swamps the savings. The paper diagnoses why existing 4-bit KV decode kernels are *slower than FP8*, then presents a Hopper-native kernel that restores (and exceeds) FP8 decode speed inside vLLM.

## Diagnosis (measure before optimizing)
- On H200, vLLM's NVFP4 KV path (FlashInfer decode) reaches only **10–20 % of memory bandwidth** and is up to **1.7× slower than FP8**.
- **NVBit instruction counting** identifies two causes: the kernels behind vLLM's 4-bit paths (FlashInfer NVFP4, Triton UltraQuant) execute **2–6× Hopper's issue budget per byte**, and they **serialize loading → decoding → matrix multiply** instead of overlapping.

## Procedure (the kernel recipe)
1. **Overlap production and consumption**: a **TMA producer warp** feeding **two compute warpgroups** — load, decode and MMA run concurrently, breaking the serial pipeline.
2. **Design the cache layout at write time**: arrange 4-bit storage so decoded values feed the tensor cores **directly from registers** — no round-trip or repack in the decode path.
3. **Swap the matrix operands** so small query groups (typical decode batches) need **no padding** to the MMA tile shape.
4. **Ship an accuracy recipe with the kernel** (this is what makes 4-bit viable): **K mean removal + rotation, 4 BF16 sink tokens, BF16 layer 0**.
5. **Integrate at the engine level and measure serving-level SLOs**, not just kernel bandwidth.

## Results (lookup)
| Metric | Value (H200) |
|---|---|
| Kernel bandwidth, batch 32–128 | **67–75 % of peak** |
| vs. faster of XQA / FlashAttention-4 FP8 | **1.12–1.49× faster** on all 11 shapes |
| vLLM decode/step vs FlashInfer FP8 (Llama-3.1-8B, batch ≥8) | **1.12–1.64×** (1.04–1.24× vs FA4 FP8); level at batch 1 |
| Cache capacity | **1.63× more tokens** |
| Goodput (rate meeting 99 % latency targets, reasoning-like stream) | **1.23–1.32× FP8** (Llama-3.1-8B), **1.67–2.20×** (Qwen2.5-72B); prefill-heavy streams ~7 % *slower* |
| Accuracy, five 7B–32B models | **no significant difference vs BF16 KV** |

## Accuracy Footgun: Qwen2-family Collapse
FP8 (and 4-bit) KV **collapses on Qwen2-family reasoning variants**. Root cause: layer 0's key mean is almost entirely the **key-projection bias** seen through RoPE — computable from the weights alone. Fix: keep **layer 0 in BF16** (restores FP8 KV), and with K-mean removal the same recipe rescues **4-bit KV**. Diagnostic rule: if a Qwen2-family model tanks under low-bit KV, inspect layer-0 key means first.

## References
- Paper: https://arxiv.org/abs/2611.30027
- Related in KB: `reference-xm-sparse-sparse-attention-serving-scale-up-memory-pools.md`, PLoQ activation-quantization note under cloud-infrastructure/llm-serving
