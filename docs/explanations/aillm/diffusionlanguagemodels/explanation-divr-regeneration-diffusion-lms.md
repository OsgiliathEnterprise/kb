---
title: DiVR — Learning When Diffusion Language Models Should Regenerate
diataxis: Explanation
domain: AI-LLM
topic: diffusion-language-models
source: arXiv
source_url: https://arxiv.org/abs/2611.17320
date: '2026-11-13'
keywords:
- knowledge-base
- diffusion-language-models
- AI-LLM
- explanations
---
# DiVR: Learning When Diffusion Language Models Should Regenerate

## Overview
Diffusion language models (dLLMs) can *remask* and revisit already-generated text — a built-in self-correction affordance autoregressive models lack. But naive remasking is wasteful and often futile. Oh et al. diagnose when remasking actually helps and train DiVR, a lightweight verifier that decides *when* to regenerate a block and *which* candidate to keep, leaving the generator frozen. On LLaDA-8B-Base it lifts average reasoning accuracy from 35.3% to 43.4% at lower test-time cost than search baselines.

## Problem Statement
Two gaps identified by diagnosing dLLM behaviour on Sudoku:
1. **Confidence is blind to errors.** Hidden states encode error information that token-level confidence does not reliably expose — so confidence-thresholded remasking misses wrong-but-confident tokens.
2. **Isolated-error remasking self-reproduces.** Re-drawing a single wrong token while its (erroneous) surrounding context is fixed tends to resample the same mistake — correction needs block-level, not token-level, regeneration.

## Key Contribution
- **DiVR**: a verifier trained on the *final correctness of the generator's own trajectories* to predict, for a partially generated sequence, whether it will reach a correct answer.
- Uses: (a) **when** — trigger block regeneration when predicted success is low; (b) **which** — among alternative continuations, retain the one DiVR scores highest.
- Generator-agnostic and post-training-complementary: no changes to the dLLM itself; stacks with SFT and RL.

## Results
- Five reasoning benchmarks with LLaDA-8B-Base: fine-tuned-generator average accuracy 35.3% → **43.4%**.
- Cost: **1.9–3.5×** greedy-decoding cost, beating search baselines that need **3.8–7.4×** — better accuracy per test-time FLOP.
- Generalizes to other generators (e.g., Dream).

## Technical Approach
Self-supervised verifier: roll out the generator's own decodes, label partial sequences by whether the trajectory eventually lands on a correct answer, and train DiVR to predict that label from hidden states — exploiting the diagnosis that error signal lives in internals, not output confidences. Inference adds a predict → (optionally) regenerate block → select-best loop around standard diffusion decoding.

## Relevance to Our Domain
Adds concrete evidence to our diffusion-LM coverage that test-time compute for dLLMs needs a learned *controller*, not just more sampling — an analogue of verifier-guided decoding in AR models, with the block-regeneration twist unique to diffusion. Useful for designing cost-aware inference pipelines (compare against our best-of-n / self-consistency cost notes).

## References
- Paper: https://arxiv.org/abs/2611.17320
- Related: explanation-diffusion-language-models-overview (topic home), explanation-cram-classical-energies-reasoning (Sudoku-as-benchmark caution)
