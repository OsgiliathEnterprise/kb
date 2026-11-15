---
title: Reducing Batch Makespan for LLM Agent Workloads through Inference-Environment
  Coordination
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.16661
date: 2026-11-15
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Reducing Batch Makespan for LLM Agent Workloads through Inference-Environment Coordination

## Overview

Agent workloads — benchmark evaluation, synthetic-data generation, RL rollouts — are batches of tasks that constantly alternate between LLM inference and environment interaction (tool calls, sandboxes, browsers). Optimizing the GPU side alone ignores half the picture. This paper coordinates the inference engine and the environment layer to shrink **batch makespan**, the wall-clock time to finish every task in a batch, and reports 10.4%–65.0% reductions in production evaluations of the Ling-3.x Flash models.

## Problem Statement

In agentic batches, a trajectory's critical path interleaves decode steps with external environment steps. Classic serving stacks optimize throughput of inference while environments become the bottleneck or, conversely, environments sit idle waiting for GPU slots. Three specific mismatches drive long tails: (1) GPU memory mis-split between KV cache and recurrent state for hybrid models, (2) requests routed without regard to prefix/trajectory cache locality, and (3) admission control coupled to environment capacity, so slow environments stall sample admission and stretch the batch tail.

## Key Contribution

- **Workload-based GPU memory allocation** for hybrid LLMs: a resource model decides the split between KV cache and recurrent state, and picks a reference sample concurrency that maximizes parallelism while limiting recomputation.
- **Trajectory-aware routing and scheduling** that promotes cache reuse (same trajectory hits the same worker) while balancing load across workers.
- **Decoupled admission**: sample admission is separated from environment execution when environment capacity is constrained, so inference keeps flowing.
- **Chain-Advancing Action Scheduling (CAAS)**: uses observed per-task progress to prioritize long action chains, attacking the batch tail where makespan is decided.
- **Controlled replay**: combines live inference with recorded environment responses and durations, making optimizations ablatable without re-running environments.

## Technical Approach

The system treats one agentic batch as a joint scheduling problem over two resource pools (GPU and environments). The resource model profiles the workload to set KV/recurrent-state budgets and concurrency targets; the router hashes trajectory identity to maximize cache hits; CAAS observes each rollout's chain progress and biases scheduling toward stragglers whose chains are long. Evaluation methodology is itself a contribution: controlled replay swaps real environments for recordings, isolating each optimization's contribution.

## Results

- Live evaluation with Ling-3.0-Flash and Ling-3.1-Flash on **BFCL, SWE-bench Multilingual, WideSearch and MCP-Atlas**: makespan reductions of **10.4%–65.0%** with evaluation scores remaining aligned.
- Methods are deployed in the Ling-3.x training and evaluation workflows, directly accelerating the model-development cycle.

## Relevance to Our Domain

Anyone running agent evaluation harnesses or RL rollouts at scale faces exactly this makespan problem — our own research/eval pipelines spend most wall-clock on environment stalls, not decode. Transferable ideas: schedule around the tail with progress-aware priorities (CAAS), route by trajectory identity for KV reuse, and build record-and-replay for environments so serving changes can be A/B-tested cheaply.

## References

- Paper: https://arxiv.org/abs/2611.16661
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16661
- Related KB note: `cloud-infrastructure/llm-serving/` topic series
