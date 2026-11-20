---
title: 'Evolve Where It Matters: Coverage-Guided Self-Evolution of Agent Skills'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.25429
date: 2026-11-20
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Evolve Where It Matters: Coverage-Guided Self-Evolution of Agent Skills

## Overview
Agent skills are natural-language procedural knowledge packages — effectively prompt-embedded runbooks an LLM agent is expected to follow. Their usefulness hinges on two very different failure modes: an instruction being *wrong*, or an instruction being *right but ignored*. This paper introduces SkillPlumber, a framework in which a self-evolving agent revises precisely those skill instructions that measurement shows are failing, rather than rewriting the whole skill from an end-to-end outcome signal.

## Problem Statement
Self-evolving agents improve their skills from their own execution runs, but existing methods judge each run globally — by final outcome or by a post-hoc "where did it go wrong" analysis. Such holistic judgement cannot distinguish a defective instruction from an instruction the agent simply did not obey. Revisions driven by that ambiguous signal waste effort: they may rewrite correct instructions while leaving non-compliance untouched, or vice versa.

## Key Contribution
- Imports **instruction-level coverage** from skill *testing* into skill *self-evolution*: every instruction in a skill is labelled for each run as **follow**, **not-follow**, or **not covered**, cleanly separating "wrong instruction" from "unfollowed instruction" as failure causes.
- **SkillPlumber** architecture:
  - A persistent **root-cause analysis agent** converts each coverage label into a targeted *revision question* and validates every revision against the *next* run (closed feedback loop).
  - A **maintainer** component distils the per-task investigations into a shared **strategy library** reused across tasks.
- Empirical results across three benchmarks and three executors: **64.7–70.5%** tasks solved — **+25.6 to +30.4 pp** over the initial (un-evolved) skill and **+8.7 to +14.0 pp** over the strongest baseline.
- Ablation: removing the coverage signal reduces recovered failures by **20.8%** on SkillsBench with GPT-5.5, confirming coverage-guidance is the load-bearing component.

## Technical Approach
The loop is: execute tasks with the current skill → compute per-instruction coverage labels → the root-cause agent asks, per label, a focused question ("is this instruction incorrect?" for not-follow on a semantically wrong step; "why is a correct instruction skipped?" for not-follow on a correct one; "what case is uncovered?" for not-covered) → apply the minimal revision → re-run to verify the revision actually flipped the label. Because revisions are checked against subsequent runs, improvements are causally attributed, not just correlated. The maintainer agent prevents per-task insights from being lost by promoting recurring patterns into a shared strategy library — a form of cross-task memory for the skill-evolution process itself.

## Results
- 64.7–70.5% solve rate (3 benchmarks × 3 executors), best in all configurations.
- Coverage ablation: −20.8% recovered failures on SkillsBench/GPT-5.5.

## Relevance to Our Domain
This is the testing discipline the KB's agent-skills notes have been missing: `explanation-agent-skills-go-stale` documents that skills decay; SkillPlumber provides a measurable maintenance loop. Instruction-level coverage is the skill analogue of code coverage in CI — a natural candidate for gating skill changes in production agent platforms.

## References
- Paper: https://arxiv.org/abs/2611.25429
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25429
