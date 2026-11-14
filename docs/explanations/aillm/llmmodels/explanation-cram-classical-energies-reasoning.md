---
title: CRAM — Classical Energy Descent Learns to Reason 1,000× Faster than Looped
  Models
diataxis: Explanation
domain: AI-LLM
topic: LLM-Models
source: arXiv
source_url: https://arxiv.org/abs/2611.17309
date: '2026-11-13'
keywords:
- knowledge-base
- LLM-Models
- AI-LLM
- explanations
---
# CRAM: Classical Energies Learn to Reason 1,000× Faster than Looped Models

## Overview
Looped/iterative models (weight-tied recurrence in latent space) have become a darling paradigm for "reasoning", showcased on puzzles like Sudoku-Extreme and Maze-Unique. Hoover, Blayney & Whittington show a learned version of Hopfield & Tank's 1980s classical energy — CRAM — crushes these benchmarks with training measured in *tens of milliseconds* on one GPU, at least 1,000× faster than looped models, while raising a sharp methodological warning about the benchmarks themselves.

## Problem Statement
Looped reasoning models are unstable, slow to train, and burn parameters and FLOPs to solve puzzles that classical optimization solves trivially. This raises two questions: (1) are energies a better training substrate for reasoning, and (2) are Sudoku/Maze benchmarks actually measuring reasoning scalability?

## Key Contribution
- **Energy descent over looped recurrence.** Instead of unrolling a shared block, CRAM defines a learnable energy function (generalizing Hopfield-Tank) and descends on it. Built-in early stopping, compute that adapts to problem difficulty, no backprop through a solver, and interpretable weights that encode puzzle constraints.
- **Headline results:** 99.996% on Sudoku-Extreme and 100% on Maze-Unique after **42 ms and 132 ms** of training on one GPU; ≥1,000× faster training than looped models; matches looped baselines' best accuracy with **≥282× fewer inference FLOPs**.
- **Benchmark critique:** if a 1980s energy trained in milliseconds solves your "reasoning" benchmark, that benchmark cannot discriminate reasoning capability — the authors caution against Sudoku/Maze for testing looped-reasoning scalability.

## Technical Approach
CRAM parameterizes an energy over the puzzle state; inference is gradient descent on that energy (naturally terminating when the energy plateaus — early stopping for free). Training fits the energy to make constraint-satisfying configurations low-energy, avoiding the credit-assignment-through-deep-unrolling problem that destabilizes looped models.

## Results
| Task | CRAM | Cost |
|---|---|---|
| Sudoku-Extreme | 99.996% | 42 ms training, 1 GPU |
| Maze-Unique | 100% | 132 ms training |
| Inference vs looped at equal accuracy | ≥282× fewer FLOPs | |

## Relevance to Our Domain
Two takeaways for our reasoning-model coverage: energy-based descent is a credible, cheap alternative for structured/constraint reasoning tasks (agent planning subroutines, combinatorial checks), and our evaluation notes should treat Sudoku/Maze-style benchmarks for looped architectures as near-saturated sanity checks, not scalability evidence.

## Extensions & reception
- Hardware angle (Neurohive coverage): a CRAM-based ML accelerator is projected to reach up to **~2,500× energy savings** vs conventional methods — the energy-descent formulation maps well to dedicated silicon because inference is local, iterative, and needs no deep unrolled graph in memory.
- Paper submitted 2026-11-12 (Hoover, Blayney & Whittington — the Whittington group behind much of the looped/latent-reasoning line, making the benchmark critique self-targeted and notable).
- Caveat for replication: results are on synthetic constraint puzzles (Sudoku-Extreme, Maze-Unique) with per-puzzle trainable energies; transfer to open-ended language reasoning is untested — do not cite as "energy models beat LLMs at reasoning".

## References
- Paper: https://arxiv.org/abs/2611.17309
- Neurohive coverage (accelerator energy-savings projection): https://neurohive.io/en/state-of-the-art/cram-cutting-ai-energy-consumption-by-1-000-times/
- Related: explanation-latent-thought-regularization-non-marp, explanation-geometric-phase-locks-implicit-recurrence (looped-model literature), explanation-llm-reasoning-early-error-lock-in
