---
title: Estimating GPU Roofline Arithmetic Intensity with Off-the-Shelf LLMs and Compiler
  Artifacts
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.32975
date: 2026-11-24
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# Estimating GPU Roofline Arithmetic Intensity with Off-the-Shelf LLMs and Compiler Artifacts

## Overview
Bolet et al. (arXiv:2611.32975, submitted 2026-11-24) ask whether general-purpose LLMs can predict a kernel's **Roofline arithmetic intensity** — the FLOPs-per-device-memory-byte ratio — *without ever running it on the target GPU*. The motivation is practical: profiling normally requires access to the actual hardware, and that access frequently delays optimization work.

## Problem Statement
GPU developers rely on profiling to understand computation vs data movement. When the target GPU isn't at hand (new accelerators, constrained clusters), optimization decisions stall. Can an LLM reading the kernel source — and optionally compiler artifacts — substitute for early profiling?

## Experimental Setup
- **Three models**: deepseek-v4-flash, gemini-3.7-flash, gpt-5.6-sol.
- **179 workload combinations**: five kernel families × four NVIDIA and AMD GPUs × four parallel runtimes (CUDA, HIP, OpenMP, OpenCL), plus modified code variants.
- **Three query modes**: source-only; source + compiler artifacts; sandboxed agentic analysis.
- Ground truth: profiled values from actual runs.

## Key Findings
- **Compiler artifacts are the big lever**: estimates within a factor of 1.20 of profiled arithmetic intensity jump from **8–14% (source-only) to 26–32%**, and bandwidth-bound vs compute-bound classification is correct in **78–92%** of runs.
- **FLOPs are much easier than memory traffic**: with artifacts, FLOP estimates meet the 1.20× tolerance in **59–88%** of runs, versus only **36–40%** for device-memory traffic — cache-dependent memory traffic is identified as the main obstacle to precise prediction.
- **Agentic analysis helps one model, at a steep price**: gpt-5.6-sol gains **+6.5 percentage points** in within-tolerance estimates, but at **3.6× the median cost and 2.5× the median latency** of compiler-assisted queries; the other models pay more without statistically clear gains.

## Takeaway
LLM estimates are not profiling replacements, but they are good enough to **prioritize optimization effort when GPU access is constrained** — especially the bound classification, which is nearly right most of the time. Feeding the model compiler artifacts (IR, PTX, occupancy reports) matters far more than making the model "agentic".

## Relevance to Our Domain
For our GPU-compute and LLM-serving coverage, this is a concrete data point on LLMs-as-systems-assistants: cheap triage before burning scarce GPU time, with a clear recipe (attach compiler artifacts) and a clear limit (don't trust memory-traffic predictions, don't default to agent loops).

## Related Literature
- **Bolet et al., arXiv:2505.03988 (May 2025)** — *Can Large Language Models Predict Parallel Code Performance?* The same group's earlier paper that introduced the framing used here: LLM-based **roofline classification** (compute-bound vs bandwidth-bound) from kernel source + hardware specs alone, without target-hardware profiling. This newer study extends that binary classification to quantitative arithmetic-intensity estimation and adds the compiler-artifacts and agentic query modes. https://arxiv.org/abs/2505.03988
- **O'Bank et al., KernelBench (arXiv:2502.10517)** — *Can LLMs Write Efficient GPU Kernels?* The standard benchmark for the *generation* side of LLM-for-systems (250 PyTorch ops → custom CUDA/DSL kernels, speedup measured against hardware). Complementary to this paper's *prediction* side: if an LLM cannot reliably predict a kernel's bound, its kernel-optimization suggestions on KernelBench-style tasks should be treated with the same skepticism. https://arxiv.org/abs/2502.10517
- Williams, Waterman & Patterson, *Roofline: An Insightful Visual Performance Model* (CACM 2009) — the original roofline model; arithmetic intensity is FLOPs per byte of device-memory traffic, and the ridge point of a GPU decides which roof applies.

## References
- Paper: https://arxiv.org/abs/2611.32975 (26 pages, 21 figures, 15 tables)
- Prior paper (same group): https://arxiv.org/abs/2505.03988
- KernelBench: https://arxiv.org/abs/2502.10517 · https://github.com/ScalingIntelligence/KernelBench
