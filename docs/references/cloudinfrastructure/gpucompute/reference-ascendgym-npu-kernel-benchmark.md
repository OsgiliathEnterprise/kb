---
title: "AscendGYM — A Compiler-Native, Execution-Grounded Benchmark for LLM NPU Kernel Generation"
diataxis: Reference
domain: Cloud Infrastructure
topic: GPU Compute
source: "arXiv"
source_url: "https://arxiv.org/abs/2611.17621"
arxiv_id: "2611.17621"
date: 2026-11-16
keywords:
- knowledge-base
- Kernel Generation
- NPU
- Benchmark
- LLM Code Generation
- Huawei Ascend
- reference
visibility: public
---
# AscendGYM: Compiler-Native, Execution-Grounded Benchmark for LLM-Driven NPU Kernel Generation

## Overview

AscendGYM (Huawei Technologies) is the first large-scale, reproducibility-first benchmark for **LLM-driven kernel generation on NPUs** — specifically Huawei Ascend, whose programming stack (AscendC, TileLang) is structurally different from CUDA. Prior kernel-generation benchmarks (KernelBench, KernelLoops, CUDA-L1, SOL-ExecBench) all assume the CUDA runtime, so progress on GPUs cannot be transferred to the NPUs now carrying a growing share of production inference.

## Problem Statement

Generating kernels for NPUs is harder than for CUDA: tile-oriented DSLs, distinct memory models, and different compiler contracts. Without an execution-grounded NPU benchmark, claims about "LLMs write kernels" remain untested outside the CUDA world.

## Benchmark Specification

| Property | Detail |
|---|---|
| Source corpus | **5,000+** operators from production model kernels, PyTorch, and TorchBench |
| Task organisation | **11 categories × 8 difficulty tiers** |
| Held-out tasks | **651** |
| Ground-truth construction | Compiler-native canonical kernels + expert-augmented **correctness contracts** (mitigates reference-harness bugs and reward hacking) |
| Target DSLs | AscendC, TileLang |
| Feedback loop | Fine-grained compile-time diagnostics fed back into agentic generation |

## Results (Measured Performance)

Top models on the 651 held-out tasks:

- **pass@64 ≈ 50%**
- **best-of-64 ≈ 59%**

i.e. even frontier LLMs fail to reliably produce correct, compilable NPU kernels in a realistic compile-feedback loop.

## Relevance to Our Domain

Essential reference for anyone evaluating AI-assisted systems-programming on non-NVIDIA accelerators: it quantifies the CUDA↔NPU capability gap and provides a reusable methodology (compiler-native ground truth + contracts) for building honest code-gen benchmarks on other stacks (TPU, Gaudi, etc.).

## References

- Paper: https://arxiv.org/abs/2611.17621
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17621
- Related: `how-to-ai-critical-path-cuda-optimization.md`
