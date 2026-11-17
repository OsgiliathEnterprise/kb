---
title: 'CertiSum: Bitwise-Identical MXFP4 Training Across Platforms and Parallelism
  Layouts'
diataxis: Explanation
domain: ai-machine-learning
topic: ml-reproducibility
source: arXiv
source_url: https://arxiv.org/abs/2611.21584
date: 2026-11-17
keywords:
- knowledge-base
- ml-reproducibility
- ai-machine-learning
- explanations
---
# CertiSum: Bitwise-Identical MXFP4 Training Across Platforms and Parallelism Layouts

## Overview

Training in MXFP4 — a 4-bit microscaling format — is fundamentally non-deterministic: identical inputs produce different results across parallelism layouts and even across GPU vendors. CertiSum makes MXFP4 training bitwise invariant across runs, layouts, and hardware, restoring debuggability, training audits, and train/infer agreement for FP4 training pipelines.

## Problem Statement

FP4 microscaling breaks reproducibility in three ways: summation-order sensitivity across data/tensor/context parallelism, vendor-dependent accumulation, and disagreement between training and inference engines. These differences complicate debugging and make training audits unreliable.

## Key Insight

Native FP32 accumulation of MXFP4 products is **already exact for every summation order** far more often than assumed. Non-determinism is therefore mostly an *unverified* property, not an unavoidable one.

## Technical Approach

1. **Certify**: collect statistics during quantization to certify that native matrix-multiply results are accumulation-order invariant.
2. **Recompute exactly when uncertified**: only outputs that fail certification go through exact kernels; where certification rarely succeeds, exact kernels are used directly.
3. **Layout-stable blocks**: quantization blocks are kept unchanged across parallelism layouts, and partial sums are merged without rounding — including in attention and weight-gradient computation.

## Results

- **200-step Qwen3-8B-Base**: training states preserved bit-for-bit across **AMD MI350X and NVIDIA GB200**, and across changes in data, tensor and context parallelism on MI350X.
- **Overhead**: +11.8–60.5% training-step latency vs the non-exact MXFP4 counterpart at larger input shapes (three 8B–14B models, FineWeb-Edu, MI350X).
- **Still fast**: up to **1.24× over BF16** and **1.70× over deterministic BF16** — deterministic FP4 beats even non-deterministic BF16 on speed.

## Relevance to Our Domain

Determinism is an MLOps requirement, not a luxury: reproducible training underpins audits, regression debugging, and CI for training pipelines (cf. the KB's nix-determinism / release-reproducibility work, now extended to low-precision training). CertiSum shows the cost of cross-vendor FP4 determinism is real but affordable, and gives a certification-vs-recomputation pattern applicable to other numeric formats.

## References

- Paper: https://arxiv.org/abs/2611.21584
- Related KB topics: developer-tools-practices/nix-determinism, developer-tools-practices/release-reproducibility
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21584
