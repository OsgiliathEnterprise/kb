---
title: Benchmarking LLM Inference on Desktop-Scale NVIDIA Grace Blackwell Clusters
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.20289
date: 2026-11-18
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Benchmarking LLM Inference on Desktop-Scale NVIDIA Grace Blackwell Clusters

## Reference Summary

Deployment guidance for **two NVIDIA DGX Spark (GB10) systems connected directly over 200 GbE** serving larger LLMs with vLLM. Benchmarks **17 open-weight checkpoints** (dense + MoE, 8B–235B parameters, four weight precisions) on one and two RDMA-connected systems, comparing **TP=2, PP=2, and a two-replica baseline** at concurrency 1–64, three independent launches per configuration.

## Benchmark Matrix

| Dimension | Values |
|---|---|
| Hardware | 1–2× NVIDIA DGX Spark (GB10), direct 200 GbE / RDMA link |
| Models | 17 open-weight checkpoints, dense + MoE, 8B–235B |
| Precisions | 4 weight precisions (incl. BF16 and NVFP4 ladders) |
| Engine | vLLM |
| Parallelism strategies | TP=2, PP=2, two-replica baseline |
| Concurrency | 1–64; 3 independent launches per configuration |

## Headline Numbers

| Finding | Value |
|---|---|
| TP=2 peak-throughput gain vs one Spark (median) | **1.59×** |
| PP=2 peak-throughput gain (median) | 1.39× |
| TP=2 wins matched comparisons | **93/96**, separated 95% Welch intervals |
| Unloaded inter-token latency, TP=2 | **0.52–0.73×** of one Spark (PP=2: little reduction) |
| Goodput under strict 100 ms ITL objective | highest for TP=2 wherever both strategies supported and objective met |
| GPU energy per output token (matched concurrency) | **one Spark uses less** |
| NVFP4 on one Spark vs second Spark at BF16 | **NVFP4 reduces unloaded latency more** |

## Decision Rules

- **Model fits on one Spark** → TP=2 favors **low-concurrency** serving; **replication wins at high concurrency**.
- **Model needs two Sparks** → prefer **TP=2**: consistent throughput and latency wins; PP=2 buys little latency relief.
- **Latency-constrained serving** → move weights to **NVFP4 before buying a second node** — precision beats the extra Spark on unloaded latency across all three precision ladders.
- **Energy per token matters** → single-node at matched concurrency.
- NCCL microbenchmarks + a prior TCP campaign suggest **collective communication overhead** contributes to TP=2's advantage — the RDMA-class link is doing real work.

## Scope Limits

Desktop-scale deployment guidance only: two nodes, batch/concurrency ≤64, open-weight checkpoints on vLLM. Not a datacenter throughput or multi-tenant serving study.

## Relevance to Our Domain

Gives concrete, statistically separated numbers for the "second GPU node or lower precision?" decision on Grace Blackwell desktop hardware — directly usable for edge-compute and workstation serving capacity plans in the llm-serving and gpu-compute topics.

## References

- Paper: https://arxiv.org/abs/2611.20289 (submitted 2026-11-15, cs.DC)
- Related: [[reference-moe-core-expert-offloading-residency]] — memory-constrained MoE inference on smaller footprints
