---
title: 'Generalized Tensor Parallelism: Powering Trillion-Parameter LLM Training at
  10+ EFLOP/s'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.32057
date: '2026-11-25'
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# Generalized Tensor Parallelism: Powering Trillion-Parameter LLM Training at 10+ EFLOP/s

## Overview
This paper unifies the five parallelism strategies routinely used to pretrain trillion-parameter LLMs — data, tensor, sequence and context parallelism, plus fully sharded data parallelism (FSDP) — into a single framework called **Generalized Tensor Parallelism (GTP)**. The key reframing: for linear layers, every one of these schemes is just a different way of partitioning a layer's parameters and activations, where either side can be re-materialized on demand with an all-gather before use. Implemented in open-source Megatron-LM, the GTP view lifts a 2T-parameter MoE model to 13.0 model EFLOP/s on 12,288 GB300 GPUs.

## Problem Statement
Existing parallelization recipes force a compromise between per-GPU memory and throughput. Data parallelism replicates parameters; tensor parallelism and FSDP inject communication of activations or parameters into every microbatch; pipeline parallelism wastes GPUs during fill and drain. Worse, FSDP implementations bundle the parameter all-gather as a step *before an entire Transformer block*, which inflates memory footprint and delays GEMMs that could already be running.

## Key Contribution
- **A unifying algebra for parallelism**: DP, TP, SP, CP and FSDP are shown to be special cases of GTP, where parameters and activations are partitioned independently and either partition can be re-materialized with an all-gather.
- **All-gathers as optional GEMM preprocessing**: instead of treating the parameter all-gather as a block-level phase, GTP models it as an optional preprocessing step on one input of a single matrix multiply — enabling per-GEMM scheduling.
- **Communication-hiding schedule**: each all-gather is issued early enough to hide its communication behind other GEMMs but late enough to keep the un-sharded copy's memory footprint bounded.
- **Open-source implementation** in NVIDIA Megatron-LM (https://github.com/NVIDIA/Megatron-LM).

## Technical Approach
In GTP, a layer is described by how its weight matrix and activation tensor are split, and by whether a missing shard must be reconstructed via all-gather before the GEMM. Conventional strategies differ only in these choices. Decoupling the parameter all-gather from the Transformer-block boundary lets the scheduler overlap it at GEMM granularity — the collectives are hoisted ahead of the GEMMs that consume the shards and released immediately after, rather than materializing a whole block's parameters at once.

## Results
| Configuration | Result |
|---|---|
| 2T-param MoE, 12,288 GB300 GPUs | **13.0 model EFLOP/s**, 98% weak-scaling efficiency |
| 1M-token sequences | runs on 512 GPUs |
| vs. Megatron-FSDP (256–1,024 GPUs, 3 MoE models) | **1.05–1.55× throughput** |
| vs. tuned 3D-parallel recipe with pipeline parallelism (DeepSeek-V4-Pro proxy) | **1.27–1.31× throughput** |

## Relevance to Our Domain
This is the conceptual map our distributed-training notes have been missing: instead of memorizing five parallelism playbooks, teams can reason about one framework and pick partitions per layer. For GPU cluster operators it also delivers a concrete signal — moving parameter all-gathers from block granularity to GEMM granularity in Megatron-FSDP-class stacks buys 5–55% throughput at trillion-parameter scale, and the code is in the open Megatron-LM tree.

## References
- Paper: https://arxiv.org/abs/2611.32057
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32057
- Implementation: https://github.com/NVIDIA/Megatron-LM
