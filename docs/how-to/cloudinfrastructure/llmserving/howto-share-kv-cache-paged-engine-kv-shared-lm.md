---
title: 'Storing the Gemma 4 K=V Cache Once: Exact Global-KV Memory Savings in a Paged
  Serving Engine with Unchanged Attention Kernels'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.23035
date: 2026-11-18
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Storing the Gemma 4 K=V Cache Once: Halving Global-KV Memory in a Paged Engine Without Touching Attention Kernels

## Overview
In the **global attention layers of Gemma 4 31B**, the value is the normalized key projection and the key is the value scaled by a fixed weight, with rotary position encoding applied to only one quarter of the dimensions (arXiv:2611.23035; Kushagra Bainsla). The Gemma 4 report says this design cuts the global KV cache by up to 37.5% — yet the open serving engines checked by the author **still store a full key and a full value: 1,024 values per KV head and token**. This paper stores **one 640-value row** instead, exactly, and lets an **unchanged paged attention kernel** read it as both caches via two overlapping strided views.

## Goal
Recover the K=V memory saving in a stock-style paged serving engine (vLLM prototype) without modifying attention kernels, with numerics exact in real arithmetic.

## Procedure
1. **Confirm the K=V structure.** Verify that in the target model's global attention layers, V is the normalized K projection and K is V scaled by a fixed weight, with RoPE on 1/4 of the head dimensions. (Holds for Gemma 4 31B global layers.)
2. **Collapse the storage layout.** Allocate **one 640-value row per KV head and token** instead of a 1,024-value K/V pair (640 + 640 with overlap). The single row contains the data needed to reconstruct both views exactly.
3. **Expose two overlapping strided views.** Present the stored row to the *unmodified* paged attention kernel through two strided views that the kernel consumes as its key cache and value cache respectively — no kernel change required.
4. **Validate exactness.** Compare against an emulation of the same arithmetic on the stock cache: the prototype's outputs are **bit-identical to the emulation**; versus the stock engine, **2 of 432 final answers differ** — within the stock engine's own run-to-run noise.
5. **Measure steady-state decode memory.** Confirm per-request decode KV memory drops by a factor of **1.34–1.40** at 32K–64K-token contexts.
6. **Benchmark decode throughput on a prefill/decode disaggregated setup** (two A100 GPUs, NIXL transfer, CPU offload). With a full 15 GiB KV pool, the compact engine sustains **1.38× the stock decode tokens per step for 16K-token prompts** (repeated to 0.06% precision) and **1.24× for 8K-token prompts**. A model of the vLLM block pool predicted both ratios within 1% (engine 0.7–0.9% higher).
7. **Check the eager path and known limitations.** Eager decode throughput rose **1.30× (16K) and 1.11× (8K)**, with the compact engine producing the same output tokens as the emulation for 8 prompts at batch 1. Budget for a **4–9% slower eager step at equal batch** in the runtime prototype, and note the method **does not yet stack with an 8-bit KV cache at the default scale**.

## Why It Works
The K/V pair is informationally redundant in these layers; the 1,024-value storage is an artifact of engines assuming independent K and V tensors. One row plus strided views is sufficient, so savings are exact rather than approximate — memory and (via larger effective batch in a fixed pool) throughput both improve.

## Relevance to Our Domain
A template for squeezing serving costs: audit whether open engines (vLLM and peers) leave model-architecture-specific cache savings on the table, and prefer layouts expressible as *views over existing kernels* to avoid kernel-fork maintenance. Long-context Gemma 4 31B serving benefits most.

## References
- Paper: https://arxiv.org/abs/2611.23035
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23035?fields=citationCount,year
