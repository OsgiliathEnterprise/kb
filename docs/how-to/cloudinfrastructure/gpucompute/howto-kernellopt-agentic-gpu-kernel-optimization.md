---
title: KernelOPT — Dispatch-Aware Agentic Search for GPU Kernel Optimization
diataxis: How-to Guide
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2609.30059
date: 2026-09-27
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- how-to
---
# KernelOPT: Dispatch-Aware Agentic Search for GPU Kernel Optimization

## Overview

Modern compilers like PyTorch Inductor auto-generate GPU kernels from high-level model code, but frequently underperform expert-written implementations by wide margins. LLM-assisted kernel optimizers can close that gap for *standalone* kernels — yet they treat compiled models as black boxes, optimizing individual kernels without respecting the compiler's structural decisions or verifying the whole model end-to-end. KernelOPT (Poddar et al.) is a **multi-agent system that treats compiled models as structured artifacts**: it preserves vendor library calls (cuBLAS, cuDNN), targets only generated Triton sub-kernels via five profiling-guided LLM agents, and gates every candidate through a four-stage verification cascade before accepting it.

## Problem Statement

How do you optimize an *entire compiled model* — not just isolated kernels — with LLM-driven search, without breaking correctness or regressing performance? The core tension: aggressive kernel rewrites risk (a) violating the compiler's dispatch decisions, (b) introducing subtle numerical errors that only surface at model level, and (c) trading speed for accuracy. A safe agentic optimizer needs to know *what it is allowed to touch* and must verify candidates end-to-end before accepting them.

## Key Contribution

- **Structured-artifact view of compiled models**: instead of a black box, the system understands which parts are vendor library calls (untouchable) versus generated Triton sub-kernels (optimizable targets).
- **Five profiling-guided LLM agents** that propose optimizations based on measured bottlenecks rather than blind search.
- **Four-gate verification cascade**: (1) static validation, (2) multi-seed correctness checks, (3) model-level float64-fallback verification, (4) performance gating — candidates failing any gate are rejected; if no candidate passes all four, the compiler baseline is preserved.
- **Broad input support**: accepts PyTorch `nn.Modules`, standalone Triton kernels, and Helion kernels.

## Technical Approach

The pipeline: profile the compiled model → identify generated Triton sub-kernels as optimization targets (vendor calls stay frozen) → run five specialized LLM agents that each propose rewrites guided by profiling evidence → push every candidate through the four-gate cascade → accept only fully-verified candidates, otherwise keep the baseline. The float64-fallback gate is the key correctness mechanism: it compares model outputs against a high-precision reference so numerical drift from kernel rewrites is caught at model level, not just per-kernel.

## Results (KernelBench, 250 problems)

Geometric mean speedups over `torch.compile`:
- **Level 1**: 1.40× (solved 51/100)
- **Level 2**: 1.15× (31/100)
- **Level 3**: 1.07× (12/50)

The pattern is instructive: gains concentrate where kernels are simpler and more isolated; deeply fused, complex models yield smaller wins — consistent with the structured-artifact constraint that vendor calls remain untouched.

## How to Apply This Pattern

If you're building or operating LLM-driven kernel/model optimization:

1. **Classify before optimizing** — separate compiler-generated code from library dispatches; only search within the generated subset.
2. **Profile-guided, not blind** — feed measured bottlenecks (memory-bound vs compute-bound regions) to the proposing agents; it focuses search where gains are possible.
3. **Gate on model-level correctness with a high-precision reference** — per-kernel tests miss cross-kernel numerical drift; float64 fallback comparison at model level is the safety net.
4. **Default to baseline preservation** — if no candidate passes all gates, ship the compiler output rather than a partially-verified rewrite.

## Relevance to Our Domain

Directly relevant to GPU compute and ML-Ops coverage: this is one of the first systems that makes LLM-driven optimization *safe for whole models* rather than isolated kernels. The four-gate cascade (static → multi-seed correctness → float64 model-level verification → performance) is a reusable template for any agentic code-optimization pipeline where correctness must be provably preserved — the same gating philosophy applies to database query rewrites, compiler pass selection, or infrastructure config tuning.

## References

- Paper: https://arxiv.org/abs/2609.30059 (Poddar, Prasad, Samanta, Chakraborty, Goyal, Rathaur — 2026)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.30059
