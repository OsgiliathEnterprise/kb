---
title: 'Solve Vision with Code: Coding Agents Are Stronger Visual Reasoners Than Video
  Models'
diataxis: Explanation
domain: ai-machine-learning
topic: multimodal
source: arXiv
source_url: https://arxiv.org/abs/2611.34813
date: 2026-11-25
keywords:
- knowledge-base
- multimodal
- ai-machine-learning
- explanations
---
# Solve Vision with Code: Coding Agents Are Stronger Visual Reasoners Than Video Models

## Overview
Luo et al. (arXiv:2611.34813, submitted 2026-11-25) run a controlled head-to-head between two routes to visual reasoning: video generation models that "denoise pixels" natively, versus coding agents that **write a program rendering the answer video**. Under identical inputs, output specification, and evaluator, the symbolic (program-synthesis) route wins decisively — questioning the assumption that native visual-medium reasoning is the more reliable path.

## Problem Statement
Video generation models are increasingly benchmarked as visual reasoners: given a first frame plus a natural-language prompt, can they produce a video executing the specified task? This is claimed advantageous because reasoning unfolds directly in frames. But that native route had never been compared against a symbolic alternative under matched conditions.

## Experimental Design
- Same tasks, same first frame and prompt, same output spec, same **unmodified rule-based evaluator** for both media.
- Benchmark: **VBVR-Pro-Bench** (500 instances, five cognitive categories, symbolic ground truth).
- The coding agent gets no access to ground truth, metadata, or generation models — one attempt per instance, exactly like the video models.

## Key Findings
- Three closed-model agents dominate: **Codex (gpt-6-astra) 0.923**, **Claude Code (Fable 5.1) 0.894**, **Gemini CLI (Gemini 3.1 Pro) 0.893** — each **more than 0.22 above the strongest video model**.
- Among 23 runnable open-weight models, the best (**GLM-5**) reaches **0.572**, beating all video models except the RL-trained one.
- Conclusion: for tasks computable from a first frame and a prompt, **program synthesis is currently a substantially more reliable route to visual reasoning** than video generation.

## Why It Matters — Depictive vs Propositional Programs
The authors further classify agent-written programs into two modes:
- **Depictive programs** — navigate the image to recover a transferable scheme (genuinely visual problem-solving).
- **Propositional programs** — operate on hard-coded values (symbolic shortcuts).

This distinction exposes *how* visual reasoning actually unfolds inside agent code, and complicates any claim that high scores alone demonstrate visual understanding — some programs reason visually, others merely encode.

## Relevance to Our Domain
For our coding-agents and multimodal coverage, this is evidence that agentic code generation is becoming a general-purpose reasoning substrate, not just a text task. It also warns evaluators: benchmark wins by coding agents can hide propositional shortcuts, so rubric-based evaluation of *program structure* matters, not just rendered output.

## References
- Paper: https://arxiv.org/abs/2611.34813
- Benchmark: VBVR-Pro-Bench (Xu et al., 2026)
