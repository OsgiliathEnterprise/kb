---
title: 'DexAttention: Distributed Sparse Attention through Rapid Online Planning and
  Persistent GPU Execution'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.23512
date: 2026-11-19
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# DexAttention: Distributed Sparse Attention through Rapid Online Planning and Persistent GPU Execution

## Overview
Sparse attention cuts FLOPs, but when it runs across nodes the savings can be eaten by moving data that turns out not to be needed and by per-operation launch/synchronization overhead. DexAttention (arXiv:2611.23512) is a distributed sparse-attention runtime that **co-designs a fast online planner with persistent GPU execution**: cheap topology-aware planning decides *what* to move and *when*, and a persistent kernel on each GPU handles the fine-grained dependency bookkeeping that would otherwise be too expensive to replan.

## Problem Statement
In multi-node sparse attention, mask-aware data assignment and scheduling reduce communication, but replanning must be cheaper than the execution time it saves — and detailed per-task synchronization cannot live inside the planner without destroying that budget. Dynamic masks (e.g. video attention where patterns emerge at runtime) make this tension acute.

## Key Contribution
- **Three-layer division of labor**: (1) an assigner using GPU-accelerated, topology-aware clustering to balance compute load and cut inter-node traffic; (2) a lightweight greedy scheduler ordering *coarse* communication/computation operations; (3) a persistent kernel per GPU that enforces *fine-grained* dependencies and dispatches ready tasks.
- **Overlap without re-launches**: because the persistent kernel keeps dispatching, attention computation overlaps with communication without repeated kernel launches.
- **Generality**: supports both static and dynamic per-head masks across multiple attention compute kernels.

## Technical Approach
The core engineering insight is separating planning granularity from execution granularity. The planner works only on coarse op ordering so replanning stays sub-millisecond even as masks change; the persistent kernel absorbs the high-frequency dependency checks on-GPU, out of the critical planning path.

## Results
- **1.39× geometric-mean end-to-end training speedup** over the fastest applicable baseline across 11 configurations on a four-node, 16-GPU cluster.
- **2.11–2.37× speedup over Ring Attention** (including planning cost) for dynamic video attention.

## Relevance to Our Domain
Distributed training/serving of long-context and video models is where our GPU-compute and LLM-serving coverage meets real cluster constraints. DexAttention's planner/executor split is a reusable pattern for any distributed system with dynamic workloads — same spirit as our EchoMoE note (compress what you communicate), but attacking the *scheduling* side rather than payload size.

## References
- Paper: https://arxiv.org/abs/2611.23512
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23512
- Related: [[explanation-echomoe-activation-compression-expert-parallelism]], [[reference-xm-sparse-sparse-attention-serving-scale-up-memory-pools]]
