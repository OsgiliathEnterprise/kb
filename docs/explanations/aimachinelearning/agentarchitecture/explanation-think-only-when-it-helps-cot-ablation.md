---
title: Agents, Think Only When it Helps
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.05709
date: '2026-11-17'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Agents, Think Only When it Helps

## Overview
Should agentic LMs always emit chain-of-thought (CoT) reasoning before every action? This paper runs an unusually clean controlled study: an **ablation of the full CoT distillation pipeline**, where a teacher (o3) produces reasoning traces plus actions and a student (GPT-4.1) is trained with SFT on **actions only, reasoning only, or both**. The headline: the value of reasoning is conditional — distilled CoT helps *only when the task actually benefits from reasoning*.

## Problem Statement
The cost-benefit of CoT in agents is genuinely open. Reasoning traces add token cost and latency on every step; prior evidence is confounded because "distilled reasoning" bundles multiple effects (teacher knowledge, action formatting, rationale format) into one training recipe.

## Method (the ablation design)
- Teacher: **o3** — the only model in the o-series that accepts image input — generating traces on multimodal agentic benchmarks: **Vision2Web and WebVoyager**.
- Student: **GPT-4.1**, fine-tuned via SFT on three data variants:
  1. **Actions only** (no rationale),
  2. **Reasoning only**,
  3. **Reasoning + actions**.
- This isolates *what reasoning adds* from *what the teacher's action policy adds*.

## Results
- Distilled CoT improves performance **exclusively on task categories where reasoning is actually needed** — on the rest, reasoning traces add cost without benefit.
- The **reasoning-only** and **action-only** variants reveal a **teacher-model dependence**: which variant wins shifts with the teacher, i.e. part of the "reasoning benefit" is really teacher knowledge transfer, not rationale format.
- Practical reading: treat per-step CoT as an expensive optional component to be routed, not defaulted.

## Relevance
For agent platform teams, this is empirical grounding for **adaptive thinking budgets** (think selectively per step) and for questioning blanket "always reason" agent prompts: measure which task categories need deliberation, and ablate reasoning off elsewhere to cut latency/cost.

## References
- Paper: https://arxiv.org/abs/2611.05709
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.05709 (0 citations at ingest, 2026 paper)
