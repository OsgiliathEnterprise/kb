---
title: 'CTRL: Concurrent Training and Rollout for LLM Reinforcement Learning via GPU
  Co-Residency'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.27119
date: '2026-11-23'
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# CTRL: Concurrent Training and Rollout for LLM Reinforcement Learning via GPU Co-Residency

## Overview
RL post-training of LLMs juggles two mismatched GPU workloads: memory-bound rollout decoding (whose effective batch shrinks as responses finish) and the dense, compute-hungry learner. Existing systems either time-share every GPU between the two (paying serial phases and switch overheads) or partition GPUs into pools that can only be resized in whole devices. CTRL introduces a third layout — **co-residency**: every GPU simultaneously runs a learner rank and a persistent rollout engine, sharing the device through CUDA MPS.

## Problem Statement
Time-sharing wastes each workload's idle hardware phase (the rollout engine barely computes; the learner barely streams memory), while pool-splitting is too coarse: the ideal ratio between rollout and learner GPUs drifts during training as response lengths and batch dynamics change, but whole-device granularity can't follow it.

## Key Contribution
- Co-residency as a first-class RL execution layout, made feasible by a **host-owned learner**: optimizer state lives in host memory and policy weights stream layer-by-layer through a bounded GPU window, so the learner's footprint shrinks to coexist with the rollout engine.
- A **publication gate** that trains each ready batch first and waits only before releasing the next policy, preserving a dropless staleness bound.
- A step-time bound that guides compute-share selection between the two co-resident engines, plus a GPU-time ledger that attributes overlap and sharing costs.
- Measured: **1.11–2.24× throughput** over the stronger of verl's asynchronous baselines across 24 workload settings (staleness limit 2), 1.23× over verl's colocate_async on 8×H100; with the same learner, co-residency beats time-sharing by 1.10–1.26× on all platforms (H100, A800, RTX 4090) and the best whole-GPU split by 1.10–1.30× on H100 DAPO-Math (256–528 trajectories/step).

## Technical Approach
The design principle is to move whatever can live off-device (optimizer state → host RAM) so that MPS time-slicing of SMs and memory bandwidth between learner and rollout engine becomes productive overlap rather than interference. The staleness discipline comes from ordering: train-ready batches are consumed before the next policy version is published, giving a provable dropless bound rather than best-effort asynchrony.

## Results
Consistent wins on three GPU generations and Qwen3 models; the co-residency vs time-share vs split comparison isolates the layout benefit itself (1.10–1.30× over the best alternative with an identical learner).

## Relevance to Our Domain
Pairs with the KB's RL-infrastructure notes (TAILROLL, LoCoJAX, SS-HSDP, SPICE). For teams running RL fine-tuning pipelines on constrained fleets — including consumer/prosumer GPUs, where CTRL also wins — it shows the bottleneck is layout choice, not just parallelism strategy, and MPS co-residency is a practical option that verl-style frameworks don't offer out of the box.

## References
- Paper: https://arxiv.org/abs/2611.27119
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27119
- Related KB notes: `ai-machine-learning/training-optimization/explanation-tailroll-tail-aware-rollout-acceleration.md`, `cloud-infrastructure/gpu-compute/reference-locojax-host-local-rl-tpus.md`
