---
title: AscendGYM — A Cost-Aware Kernel Optimization Benchmark for Real-World Workloads
  on Ascend NPUs
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.17621
date: 2026-11-16
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# AscendGYM: Cost-Aware Kernel Optimization Benchmark for Real-World Workloads on Ascend NPUs

> Corrected 2026-11-16 by KB Zookeeper: the first intake version ("first NPU kernel-generation benchmark, 5,000+ operators, 651 held-out tasks, pass@64 ≈ 50%") did not match arXiv:2611.17621 and was replaced with facts verified against the arXiv abstract page.

## Overview

AscendGYM (Huawei AI Training Platform Team — Bingwei Zhang, Jing Li, and 24 co-authors incl. Baotian Hu, Min Zhang, Haizhou Li, Zhiquan Luo; arXiv:2611.17621, 13 Nov 2026, cs.AI technical report) is a benchmark for **LLM/agent-driven kernel *optimization* on Huawei Ascend NPUs**. Unlike prior Ascend kernel benchmarks that focus on kernel *generation*, AscendGYM measures whether agents can **optimize existing kernel implementations under input configurations drawn from real training/inference workloads**, so measured speedups map directly to production workloads.

## Problem Statement

Existing Ascend kernel benchmarks emphasize generation from scratch and ignore the ability of models/agents to optimize existing implementations under realistic input shapes and data types — the form of kernel work that actually occurs in production pipelines.

## Benchmark Specification

| Property | Detail |
|---|---|
| Initial suite | **48 kernels** across **three difficulty levels** |
| Test cases | Data types and tensor shapes **collected from real-world training and inference tasks** |
| Evaluation modes | **Model evaluation** and **model-harness evaluation** — measures trained models *and* custom agents |
| Execution environment | Reproduces how Ascend kernels are invoked in practical pipelines |
| Built-in harness (model-eval mode) | Search orchestration + experience accumulation |
| Cost metric | **Speedup-Token Score (STS)** — quantifies performance gains relative to token cost |
| Code | https://github.com/SLAI-AITP/AscendGYM (20 pages, 12 figures, 2 tables) |

## Results / Novelty

- STS is the key contribution: jointly scoring **speedup and token cost** lets you assess practical optimization capability under an acceptable budget, instead of rewarding brute-force sampling.
- The two evaluation modes separate raw model capability from harness/agent engineering effects.
- (The intake version's pass@64 ≈ 50% / best-of-64 ≈ 59% figures could not be verified against the abstract and were removed.)

## Relevance to Our Domain

Essential reference for AI-assisted systems programming on non-NVIDIA accelerators: it supplies a realistic, cost-aware methodology (real workload shapes, harness-vs-model separation, STS budget scoring) transferable to other stacks (TPU, Gaudi). Complements CUDA-side optimization notes.

## References

- Paper: https://arxiv.org/abs/2611.17621
- Code: https://github.com/SLAI-AITP/AscendGYM
- Related: `how-to-ai-critical-path-cuda-optimization.md`
