---
title: Diverse Alternative Reasoning Traces for Hard Math Problems
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.34928
date: '2026-11-27'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- how-to
---
# How to Mine Diverse Alternative Reasoning Traces (DART) for Hard Math Problems

## Overview
Aichberger, Golinski, Blaas, Bradley, Springer, Farajtabar, Kirchhof & Williamson (arXiv:2611.34928, submitted 2026-11-25, NeurIPS 2026 Workshops) propose **DART** (**D**iverse **A**lternative **R**easoning **T**races), a trace-mining method for the data-scarce regime of LLM math post-training: on hard problems, verifier-accepted traces are *rare* under independent Monte-Carlo sampling, so post-training data is thin exactly where it matters. DART recovers more accepted traces per generated trace by *repairing rejected traces* instead of resampling from scratch.

## Problem
Post-training for mathematical reasoning relies on accepted traces (final answer passes a verifier). For hard problems, independent MC sampling almost never produces one, leaving those problems without training signal.

## Procedure
1. **Take a rejected trace** for the hard problem (one that failed the verifier) — do not discard it.
2. **Decompose the trace into reasoning steps.**
3. **Rank steps by position-weighted uncertainty** — uncertainty earlier in a step counts more.
4. For the highest-ranked steps, **generate deliberately distinct alternative candidates**, guided by two mechanisms:
   - **reference-answer guidance** — the branch is anchored to the known correct final answer;
   - a **meta-thought** injected before generation — pushes the model onto a genuinely different route rather than a paraphrase.
5. **Complete the resulting traces** to a final answer and keep those the verifier accepts.

## Results
- On **greedy-unsolved DeepMath-103K problems**, DART recovers **37% more problems** than Monte-Carlo sampling at a *matched* number of generated traces; cost per recovered problem is nearly identical, and cost per **accepted** trace is **30% lower**.
- **Post-training Llama-3.1-8B-Instruct** on DART-mined traces gives the best point estimate in **5 of 6 evaluations** across MATH-500 and AIME benchmarks.

## When to Use
Any math-reasoning post-training pipeline that filters MC samples by a verifier: run DART on the rejected-trace pile to expand problem coverage cheaply. The rejected traces you already generate are the raw material.

## Relevance to Our Domain
Data-side complement to the reward/verifier techniques in this topic — increases the number of hard problems that contribute any gradient signal at all.

## References
- Paper: https://arxiv.org/abs/2611.34928
