---
title: 'Represented but misread: Post-training changes how language models read out
  what they represent'
diataxis: Explanation
domain: ai-machine-learning
topic: interpretability
source: arXiv
source_url: https://arxiv.org/abs/2611.26584
date: 2026-11-20
keywords:
- knowledge-base
- interpretability
- ai-machine-learning
- explanations
---
# Represented but misread: Post-training changes how language models read out what they represent

## Overview
This paper disentangles two things post-training is usually blamed or credited for together: changing *what* a language model internally represents, versus changing *how* that representation is converted into an answer. Comparing linear probes against the models' own verbal answers across six open-weight base models and their post-trained counterparts, it finds that the internal representation can stay intact while the readout degrades — and vice versa — with SFT identified as the stage responsible.

## Problem Statement
When a post-trained model gives a bad judgment (e.g. failing to distinguish human- from AI-written text), is the knowledge missing from the network, or is it present but not used by the answer pathway? Standard evaluations conflate representation and readout, so interventions (more data, RLHF tuning, layer surgery) cannot be targeted correctly.

## Key Contribution
- A method combining linear probes, the model's own answers, and signal-detection-theory analysis (d′ sensitivity, log-odds shifts vs. stated base rates) to separate representation from readout.
- Evidence that on human-vs-AI authorship judgments for German texts, probes and n-gram classifiers separate the classes well while the models' answers do not — and often order texts *inversely*.
- Post-training lowered answer sensitivity on average (Δd′ = −0.34 across model families; −0.29 across three prompts) and changed how stated base rates are used: base models under-weighted prior-odds changes, most post-trained models over-weighted them.
- Localization via stage-wise checkpoints and model stitching: the readout change occurred during supervised fine-tuning, implicated early layers, and from mid-depth onward was carried by internal states at positions *after* the text rather than positions within it.
- A publicly reproducible counter-case (truth of negated statements) where post-training acts in the opposite, beneficial direction: probes decoded truth at ceiling everywhere, several base models failed to use it in answers, and post-training repaired the readout.

## Technical Approach
Six open-weight base/post-trained model pairs are probed with linear classifiers while simultaneously eliciting explicit judgments. Signal detection theory quantifies sensitivity and bias separately from accuracy. Stage-wise checkpoints isolate SFT as the responsible phase; model stitching transfers behavior between checkpoints to locate where (early layers; post-text token positions at mid-depth) the readout change propagates. A controlled training study adds 2,000 correctly labeled authorship judgments to otherwise identical fine-tuning data.

## Results
- Probes ≫ answers on authorship: the knowledge is represented but misread.
- Direction of readout change is task-dependent: post-training *hurt* authorship sensitivity (Δd′ ≈ −0.3) but *repaired* truth judgments for negated statements.
- A small (2,000-example) training signal set the direction of the judgment: answers improved on newspaper/textbook corpora yet inverted on chat data, tracking a news-trained probe of the base model.

## Relevance to Our Domain
For anyone operating or evaluating fine-tuned LLMs, this reframes "the model doesn't know X" claims: always probe before concluding. It matters for RLHF/SFT regression testing, for AI-content detection (models internally discriminate human vs AI text far better than their answers admit), and for interpretability tooling — the mid-depth, post-token-position locus of readout is an actionable handle.

## References
- Paper: https://arxiv.org/abs/2611.26584
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26584
