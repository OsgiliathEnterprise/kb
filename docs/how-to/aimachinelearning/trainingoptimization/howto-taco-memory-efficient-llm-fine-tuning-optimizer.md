---
title: TACO — Ternary Absolute-max Column-wise One-sparse Optimizer for LLM Fine-Tuning
diataxis: How-to Guide
domain: ai-machine-learning
topic: training-optimization
source: arXiv
source_url: https://arxiv.org/abs/2610.02199
date: 2026-10-04
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- how-to
---
# TACO — Ternary Absolute-max Column-wise One-sparse Optimizer for LLM Fine-Tuning

## Overview

TACO (Ternary Absolute-max Column-wise One-sparse) is an optimizer that slashes the memory cost of full-parameter LLM fine-tuning by making persistent optimizer state nearly negligible, while keeping first-order gradients. It extends the Muon line of work — which reduces optimizer memory through matrix-valued updates — but takes the geometric route further: instead of Muon's operator-norm steepest-descent view with dense state, TACO computes the exact steepest-descent direction under a dimension-normalized 1→1 operator norm by selecting the sign of the largest-magnitude entry in each column of two-dimensional weight matrices.

## Problem Statement

Full-parameter fine-tuning of LLMs incurs large optimizer-state memory overhead (AdamW keeps per-parameter moments), limiting which model sizes fit on modern GPUs. Existing remedies either compress optimizer state, abandon first-order gradients, or change update geometry while retaining dense state. Muon reduces memory via matrix-valued updates but its geometry differs from AdamW and can degrade performance when fine-tuning AdamW-pretrained models. TACO targets the gap: reduce optimizer memory *without* sacrificing accuracy or compute efficiency.

## Key Contribution

- A **ternary, column-wise one-sparse update rule**: for each column of a 2D weight matrix, take the sign of the largest-magnitude entry — an exact steepest-descent direction under a dimension-normalized 1→1 operator norm that retains first-order gradients.
- **Near-zero persistent state**: practical TACO keeps only a small set of low-precision gradient components per column instead of full AdamW-style moments.
- **Single-GPU large-model fine-tuning**: enables full-parameter fine-tuning of 30–32B models on one 80 GB H100 across multiple model families and tasks.

## Technical Approach

TACO follows Muon's operator-norm steepest-descent framing but pushes the geometry further: the update direction is derived from a dimension-normalized 1→1 operator norm, realized by picking the sign of each column's largest-magnitude entry (a one-sparse ternary vector per column). Because only that selection plus a few low-precision gradient components must be stored, persistent optimizer state collapses. The result keeps first-order gradient information (unlike zeroth-order or pure-compression methods) while freeing memory.

## Results

- On OPT-13B: persistent optimizer state reduced **174×** relative to AdamW8bit (27.7 GB → 0.16 GB), and peak training memory reduced **2.9×** (80.6 GB → 27.5 GB), with comparable accuracy and runtime.
- Enables full-parameter fine-tuning of **30–32B models on a single 80 GB H100** across multiple model families and tasks.
- Code: https://github.com/Jichao2357/TACO_optimizer

## Relevance to Our Domain

For ML-Ops teams that want full-parameter fine-tuning without multi-GPU optimizer-state overhead, TACO is a drop-in alternative to AdamW/Muon with a dramatically smaller memory footprint. The "keep only the column-max sign + a few low-precision components" design is a concrete pattern for anyone building memory-constrained fine-tuning pipelines — and it preserves first-order gradients, avoiding the accuracy cliffs that pure state-compression or zeroth-order methods can introduce when adapting AdamW-pretrained checkpoints.

## References

- Paper: https://arxiv.org/abs/2610.02199
- Code: https://github.com/Jichao2357/TACO_optimizer
- Related (Muon): https://arxiv.org/abs/2502.16982 ("Muon is Scalable for LLM Training")
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.02199
