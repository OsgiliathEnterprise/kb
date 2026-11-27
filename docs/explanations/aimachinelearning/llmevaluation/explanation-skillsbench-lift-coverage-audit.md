---
title: What Does Skill Lift Actually Measure? A Source-Code-Level Audit and Noise-Aware
  Reanalysis of SkillsBench
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.33943
date: '2026-11-27'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# What Does Skill Lift Actually Measure? The SkillsBench Audit

## Overview
Zhang & Long (arXiv:2611.33943, submitted 2026-11-25) audit **SkillsBench** — a benchmark for *agent skills* (directories of instructions, reference materials, and scripts loaded on demand by coding agents) — at the **source-code level**, and reanalyse its 7,554 public trials as 1,421 paired (configuration, task) cells. Their noise-aware reanalysis deflates several headline claims of the original benchmark, including the widely quoted "~16.6 pp average lift from human-curated skills" and the alarming report that skills *reduced* results on some tasks.

## Problem
SkillsBench numbers are being used downstream to gate or eliminate skills per-task. If the lift signal is contaminated by grader bugs, placeholder content, or pure sampling noise, those gating decisions are built on sand.

## Audit Findings
- **Grader dependence**: two controlled-verified cases where the grader itself drove measured lift, plus one operational-definition gap — on those three tasks the average lift was **74.6 pp** (vs 18.7 pp overall average), i.e. contamination is not marginal.
- **Contaminated infrastructure**: four tasks shipped **placeholder skill directories**, and one execution harness silently injected **48 built-in skills** in most runs.
- **The "skills hurt" finding collapses**: with multiple-testing correction, *no* task-level reduction is statistically significant. With at most three runs per cell, negative differences are extremely noise-prone — arithmetically, **58% of cells could not have shown a decrease at all** — so raw negative cells cannot demonstrate harm.
- **Gating-on-skill-free-score is a mirage**: it appears to improve 2–3 pp in the logs, but the same gate yields **+4–7 pp even after shuffling condition labels** (removing any real skill effect), and shows no statistically significant improvement on held-out runs.

## Method Takeaway
The pair "(configuration, task) cell" + label-shuffling placebo test + multiple-testing correction is the minimum statistical hygiene for any A/B benchmark of agent skills; the authors publish their audit ledger and analysis scripts.

## Relevance to Our Domain
Read before trusting any "agent skills improve X%" number in our skill/plugin coverage ([[explanation-agent-skills-go-stale]]); the audit ledger repo is a template for auditing our own eval harnesses.

## References
- Paper: https://arxiv.org/abs/2611.33943
- Artifact: https://github.com/rrrrr4788/skillsbench-lift-reanalysis
