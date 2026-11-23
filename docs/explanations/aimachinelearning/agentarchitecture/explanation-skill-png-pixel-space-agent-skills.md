---
title: 'SKILL.PNG: Learning Agent Skills in Pixel Space'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.26296
date: 2026-11-23
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# SKILL.PNG: Learning Agent Skills in Pixel Space

## Overview
Skill.png replaces natural-language agent skills with an *image* whose pixels are optimized by gradient descent through a frozen vision-language model's vision encoder. The result is a skill representation that is continuously optimizable like fine-tuning weights, yet portable across VLMs like text skills — the first agent skill that gets both properties at once.

## Problem Statement
Current agent specialization has a dilemma. Textual skills (natural-language instructions injected into context) are model-agnostic and transferable, but their discrete nature blocks continuous optimization. Gradient-based alternatives such as fine-tuning are optimizable but model-specific, so a skill learned for one agent cannot move to another. Since most agent stacks are built on VLMs, pixel space offers a third substrate that is both differentiable and portable.

## Key Contribution
- **Image-space skill optimization**: a skill-like image input is trained end-to-end by back-propagating through the *frozen* vision encoder — no model weights are touched.
- **Cross-model compatibility**: any VLM can consume the image; a single image can be optimized jointly over an ensemble of models and then transfers across that ensemble.
- **Token efficiency**: each image skill costs only **64–256 image tokens** at inference versus roughly **900–2000 text tokens** for a textual skill.
- **Hybrid skills**: jointly optimizing text + image components improves agent performance beyond either alone.

## Technical Approach
The method treats the image's pixel tensor as the trainable variable. Because the VLM stays frozen and only the vision encoder path is traversed, gradients flow directly into the input pixels — a prompt-optimization scheme operating entirely in vision space. Ensemble optimization means the image encodes task knowledge that survives being re-encoded by different vision towers, which is why transfer works.

## Results
Across 4 VLMs × 4 benchmarks (16 settings), Skill.png significantly outperforms state-of-the-art textual skills optimized using frontier LLMs in **9 of 16 settings**, at 4–15× lower context-token cost. Hybrid (text+image) skills further improve performance, and an image optimized for a VLM ensemble transfers successfully among the ensemble members. Code: https://github.com/omseeth/skill.png

## Relevance to Our Domain
For the KB's agent-architecture and skills coverage, this reframes "skill" from a document into an optimizable artifact: teams already storing SKILL.md-style instructions now have a gradient-trainable complement that is cheaper per invocation and model-portable. Practical caveats to explore: per-task optimization cost, and whether pixel skills remain auditable/readable the way text skills are.

## References
- Paper: https://arxiv.org/abs/2611.26296
- Code: https://github.com/omseeth/skill.png
- Related: agent-architecture notes on skill libraries and context injection
