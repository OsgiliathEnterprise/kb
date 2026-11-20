---
title: 'The Geometry of Lies: Knowledge and Persona Directions for Detecting Deception
  in Large Language Models'
diataxis: Explanation
domain: ai-machine-learning
topic: interpretability
source: arXiv
source_url: https://arxiv.org/abs/2611.26545
date: 2026-11-20
keywords:
- knowledge-base
- interpretability
- ai-machine-learning
- explanations
---
# The Geometry of Lies: Knowledge and Persona Directions for Detecting Deception in Large Language Models

## Overview
This negative-results-leaning study stress-tests the popular idea that activation-space "persona directions" can serve as cheap, label-free lie detectors. Extending a published persona bank with roles that deny knowledge they actually possess (plus honest counterparts), the authors evaluate on Liars' Bench and the Gender-Secret fine-tune across four models including Llama-3.3-70B-Instruct. The headline: persona directions partially work for blatant lies, largely *track wording rather than deception* for lies about knowledge, and only a combined persona+knowledge direction reliably beats a same-depth supervised probe.

## Problem Statement
Linear probes are the cheapest LLM lie detectors but transfer poorly across kinds of lie. Label-free directions from honest/deceptive role-play had not been tested at 70B scale, nor on lies about knowledge — the hardest case, where a lie and an honest denial can be *verbatim identical*.

## Key Contribution
- A widened persona bank including roles that deny knowledge they have, with honest counterparts.
- A "knowledge direction" contrast built from answerable questions vs questions nobody can answer, each followed by the same scripted denial — isolating deception from wording.
- A systematic random-baseline methodology: gains over a published persona direction are judged against the band of *random* persona-bank widenings.
- Honest, per-model accounting where many hoped-for effects fall inside the random band.

## Technical Approach & Results
- **Persona direction at middle layer:** ranks lies on Liars' Bench better than single-dataset probes on 3 of 4 models; fails on Qwen (even though Qwen stays in role far more often). On Llama-3.3-70B it beats a random persona bank, but its gain over the published direction sits *within the range of random widenings*.
- **Lies about knowledge:** persona directions mainly track the reply's wording — where lies and honest denials share tokens, the main contrasts stay inside the random-direction band on Llama and Qwen, reach only its edge on Gemma; one contrast clears it on Mistral.
- **Knowledge direction:** separates lies from identical honest denials on two models, narrowly on a third, not at all on the fourth; some results depend on benchmark wording. On Gender-Secret it clears the band by hundredths on Llama, fails on Mistral.
- **Sum of the two directions:** ranks lies better than a supervised probe at the same depth on all four models (one pair near chance), but is level with the persona direction on Llama's average and *behind the probe* on held-out lies.
- More varied role-play questions did not improve the persona direction.

## Relevance to Our Domain
A cautionary reference for anyone planning deception/alignment monitoring with representation-engineering shortcuts: label-free directions carry hidden wording confounds and need random-direction baselines to be meaningful. Complements our truthfulness-probe and activation-steering notes; the knowledge-direction construction is reusable as an evaluation design pattern.

## References
- Paper: https://arxiv.org/abs/2611.26545
- Related: [[explanation-truthfulness-probe-llm-honesty]], [[explanation-activation-steering-honesty-reduce-hallucinations]]
