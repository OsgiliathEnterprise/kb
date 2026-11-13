---
title: Omakase — Execution Congestion Control via Conflict-Graph Integration in Multi-Proposer
  Blockchains
diataxis: Explanation
domain: system-design
topic: distributed-systems-foundations
source: arXiv
source_url: https://arxiv.org/abs/2611.17184
date: '2026-11-13'
keywords:
- knowledge-base
- distributed-systems-foundations
- system-design
- explanations
---
# Omakase: Execution Congestion Control through Conflict-Graph Integration in Multi-Proposer Blockchains

## Overview
As multi-proposer consensus protocols (Solana, Sui, Aptos lineage) push consensus throughput, transaction *execution* becomes the bottleneck. Omakase (Kang, Neiheiser, Sonnino, Kokoris-Kogias, Sadoghi — a consensus/database crossover team) treats execution like a network congestion problem: bound how much optimistic work is in flight, integrate conflict graphs across blocks, and schedule accordingly, hitting 2.47× over sequential execution on Ethereum mainnet traces.

## Problem Statement
L1 execution parallelism splits into two camps, both treating blocks in isolation:
- **Pessimistic** (Solana, Sui): upfront state-access declarations serialize contended transactions.
- **Optimistic** (Aptos, Sei, Monad): runtime dependency resolution, but cascading aborts under contention.
Neither exploits inter-block parallelism, so most validator cores stay idle.

## Key Concepts
- **Pre-execution on idle cores.** Replicas pre-execute only the blocks *they* propose, spreading speculation cost across concurrent proposers rather than concentrating it.
- **Inter-block conflict-graph integration.** Per-block conflict graphs are built, hot resources identified, then graphs are greedily merged across all blocks committed in a round; a lightweight balance heuristic keeps an integration only if it predicts a parallelism gain.
- **Graph-aware OCC.** The executor admits transactions in dependency order over the integrated graph — zero aborts when the predicted graph is exact, bounded re-execution when it is not.
- **Congestion control analogy.** Compared to one giant optimistic window (whole-round speculation), Omakase matches mean throughput but is far more stable under high contention because integration *bounds in-flight optimistic work* — the paper's titular congestion control.

## Results
- 15,000 Ethereum mainnet blocks (~2.4M transactions) + synthetic contended workloads: 2.47× speedup over sequential execution, above single-block OCC and graph-aware baselines.
- Integration overhead is hidden 94% of the time by overlapping it with execution across rounds in the validator pipeline.

## Relevance to Our Domain
The conflict-graph-merge + bounded-speculation pattern is a general recipe for any optimistic execution pipeline (parallel DB replay, ETL backfills, agent tool-batch scheduling): integrate dependency graphs across scheduling windows, gate merges with a cheap gain predictor, and admit work in dependency order. The "bound in-flight optimistic work" framing is directly transferable to backpressure design in distributed systems.

## References
- Paper: https://arxiv.org/abs/2611.17184
- Related: explanation-steelhead-dual-mode-consensus-shared-dag (multi-DAG consensus), explanation-llm-inference-parallelism-compute-communication-tradeoffs
