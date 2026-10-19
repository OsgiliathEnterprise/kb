---
title: How to Predict Post-Training Coding-Agent Performance from Base Models
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: 'arXiv: How to Predict Post-Training Coding-Agent Performance from Base Models
  (arXiv:2610.10478)'
source_url: https://arxiv.org/abs/2610.10478
date: 2026-10-18
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# How to Predict Post-Training Coding-Agent Performance from Base Models

## Problem

Agentic post-training (RL on tool-using coding tasks) is expensive. Before committing a training budget, you need to know **which base checkpoint will become a strong coding agent after post-training** — but the standard tools don't fit:

- **End-to-end pass@K** fails as a predictor: many base checkpoints cannot reliably produce the well-formed tool invocations needed to complete a task, so they score zero for tool-calling failure rather than lack of capability.
- **Single-shot / short-horizon tasks** avoid the tool-calling failure by collapsing a multi-step interaction into one prompt and one patch — but they sidestep exactly the capability you care about: maintaining coherent state across many tool-using steps as the repository evolves.

This paper (NVIDIA, cs.AI/cs.SE, 2026) provides a concrete method to bridge the gap: predict post-training potential *from the base model alone*, using only a benchmark's successful trajectories and its verifier.

## Prerequisites

- A set of **successful post-trained agent trajectories** from a benchmark (the trajectories must include per-step code-changing actions and test outcomes).
- The benchmark's **verifier** (test harness) that can re-run tests at any step.
- Base checkpoints you want to rank (the method never needs the base model to drive the harness from a cold start).

## Steps

### 1. Identify the decisive step in each trajectory

Replay each successful trajectory and **re-run the tests after every code-changing step**. The *decisive step* is the first step whose cumulative patch flips the repository from failing to passing — at that step, the recorded action is certified as a solution *given the prior context* (the earlier steps set up the state; this step closes it).

### 2. Screen each base checkpoint at the decisive step — three screens, no cold start

At each certified decisive step, evaluate the base checkpoint with:

| Screen | What it measures |
|--------|------------------|
| **Decisive-Action BPB** (bits per byte) | Probability mass the checkpoint assigns to the certified action itself |
| **Patch MCQ** | The checkpoint's choice between the certified action and *alternatives rejected by the same verifier* |
| **Prefix-conditioned pass@K** | Support for functionally-correct generations; any continuation the tests accept is credited |

All three screens are prefix-conditioned: the checkpoint sees the trajectory's prior context, so it never has to solve the task from scratch — which is what removes the tool-calling-failure confound.

### 3. Rank the cohort and validate against post-training outcomes

Apply all three screens to each base checkpoint, aggregate, and rank. Validate against the actual post-trained SWE-bench Verified pass@1 of each model's post-trained successor. The paper validates on **ten pairs of public base and post-trained models**: all three screens rank the cohort in close agreement with post-trained SWE-bench Verified pass@1.

### 4. Generalize to your own benchmark

The method needs only (a) the benchmark's successful trajectories and (b) its verifier. Any agentic coding benchmark with both can be converted into a **base-model evaluation** without running the base model in the harness at all.

## Verification

- Reproduce on the paper's ten base/post-trained pairs: screen rankings should correlate closely with post-trained SWE-bench Verified pass@1.
- Check the BPB screen in isolation: it should already separate checkpoints that "know the decisive action" from those that don't, before the MCQ and pass@K screens add verifier-grounded signal.

## Relevance to Our Domain

For the [AI coding agents](../../../explanations/developertoolspractices/aicodingagents) notes, this is the missing evaluation piece: a cheap pre-screen for post-training investment. If you maintain an internal coding-agent training loop, the decisive-step replay + three-screen protocol is directly adoptable — the only inputs are trajectories and a test harness you presumably already have. It also reframes agentic benchmarks: a benchmark's *successful trajectories* are a reusable asset for evaluating models you will never deploy in the loop.

## References

- Paper: https://arxiv.org/abs/2610.10478 (Tan Yu et al., NVIDIA, with J. Jiao — 22 authors; submitted 2026-10-07)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.10478
- Benchmark context: SWE-bench Verified (evaluation target)
