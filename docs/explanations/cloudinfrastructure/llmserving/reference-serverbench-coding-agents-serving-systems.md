---
title: 'ServerBench: How can your coding agents design specialized LLM serving systems?'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.06841
date: '2026-11-17'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# ServerBench: How can your coding agents design specialized LLM serving systems?

## Overview
ServerBench asks whether **coding agents can write complete, specialized LLM serving systems** for a given model–hardware–workload cell, where no single serving design wins everywhere. Agents start from a minimal server and experiment against a **common economic objective** rather than raw speedup.

## Benchmark Design (verified specifics)
- **Objective — "dollars per dollar"**: latency-qualified token value per dollar of GPU cost. Unlike prior benchmarks that score speedup/throughput vs a baseline, this prices the API cost of the agent's own effort against the serving value it delivers — and only **verified systems receive a score**.
- **Stateful closed-loop replay**: workloads preserve session dependencies (agent-like multi-turn traffic), not independent requests.
- **Independent verification** checks each submitted system (including correctness of optimization paths); prohibited shortcuts are enforced.
- **Scale**: **11 coding-agent models across three model–hardware deployments** (e.g., L40 GPU allocations; models incl. Gemma E4B and Qwen checkpoints).
- **Origin**: CMU (InfiniAI Lab), posted to arXiv 2026-11-04.
- **Baseline calibration (verified from paper)**: reference SGLang and vLLM systems are calibrated by selecting the concurrency that **maximizes gross dollars per dollar**; latency targets set to the **largest per-replay p90** (the SLO standard) over **5 independent random seeds**; baselines reported as mean p90 TTFT, TPOT, and dollars per dollar. A token only scores if it arrives within the latency target — late tokens count for nothing, which closes the "answer slowly but cheaply" loophole.

## Key Findings
- Best cell: **Claude Sonnet 5.5 reaches 2.97 dollars-per-dollar on Gemma E4B — 4.87× the vLLM serving baseline**; GPT-family agents offer lower-cost gains, Claude reaches higher value.
- **22 of 33 runs yield verified systems; 13 exceed the strongest baseline** — agent-designed serving systems already beat reference deployments for a minority of runs.
- Trajectory analysis, three findings: (1) **high-value designs coordinate capacity improvements with load selection**; (2) agents interpret performance feedback through **workload-relevant experiments**; (3) **reliable delivery requires verifying the execution paths introduced by optimization** (agents ship optimizations whose code paths never run).

## How To Use This (lookup)
- Evaluating coding agents on systems programming under hardware constraints → use a cost-qualified objective (dollars per dollar), stateful replay, and independent verification of executed paths — speedup-only scoring inflates results.
- Deciding "hand-tuned vs agent-generated engine" → today the agent wins on some cells (13/33 runs exceed the strongest baseline); treat an unverified agent system as not-done: verify the optimization actually executes.

## References
- Paper: https://arxiv.org/abs/2611.06841
- CMU/InfiniAI Lab coverage (baseline mechanics, validation-failure breakdown): https://blog.go5.si/posts/cmu-serverbench-agent-serving/
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.06841
- Related: [[Evolving Infra: Agent-Adaptive LLM Serving at Scale]], [[ROCm InferaSim: Cut LLM Serving Trial Costs and Deploy the Best Configuration]]
