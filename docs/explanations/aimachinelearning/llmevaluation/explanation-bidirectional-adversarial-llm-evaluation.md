---
title: When Both Sides Adapt — Bidirectional Adversarial Evaluation of LLMs
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.17239
date: 2026-11-16
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# When Both Sides Adapt: Bidirectional Adversarial Evaluation of Large Language Models

## Overview

Jun-Ping Jiang et al. (University of Tokyo, Tohoku University) propose an evaluation paradigm in which **both sides of the evaluation adapt**: a *proposer* model generates tasks, a *solver* model attempts them, and each side's standing updates from pairwise outcomes via ELO-style ratings. Unlike adversarial benchmarks where the task-setter is fixed (a template or a frozen generator), letting the proposer adapt turns evaluation into a co-evolutionary game that resists saturation.

## Problem Statement

Static benchmarks saturate — models hit ceiling scores and stop discriminating — and reward-hacking against known test formats corrupts results. Existing adversarial evaluation fixes one side (usually the task generator), so solvers eventually overfit the generator's distribution.

## Key Contribution

- **Bidirectional adaptation**: task *difficulty calibration* on the proposer side (proposers are rewarded for posing tasks near the solver's capability frontier) and a unified scoring signal on the solver side.
- **Pairwise-outcome ELO ratings** for solvers, avoiding absolute-score saturation.
- **Emergent diversity**: as the game unfolds, proposers drift toward distinct task domains — spontaneous specialisation instead of manual test-suite curation.

## Technical Approach

A proposer LLM generates candidate tasks; solvers attempt them; outcomes (solved/unsolved, pairwise comparisons) update both proposer calibration and solver ELO. Difficulty is an explicit training signal: too easy or too hard tasks earn the proposer little. The system was run with GPT-5-class models in the loop, exercising the pipeline across multiple domains.

## Results

The authors report that the bidirectional design produces difficulty-calibrated tasks, ELO rankings that remain discriminative past static-benchmark ceilings, and emergent domain specialisation of proposers.

## Relevance to Our Domain

A practical answer to benchmark staleness in our LLM-evaluation coverage: co-evolutionary proposer/solver designs are self-maintaining and harder to game, which matters for internal model-selection and regression suites where maintaining curated benchmarks is a recurring cost.

## References

- Paper: https://arxiv.org/abs/2611.17239
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17239
