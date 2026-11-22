---
title: 'SWE-growth: Teacher-Guided Adaptive Self-Play for Software Engineering Agents'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.23876
date: '2026-11-22'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- how-to
---
# SWE-growth: Teacher-Guided Adaptive Self-Play for Software Engineering Agents

## Overview

SWE-growth is a **teacher-guided adaptive self-play framework** for training software-engineering agents on repository-level repair tasks. Its key insight: self-play task generation produces **all-fail groups** — every Student rollout fails, so with binary repair rewards and finite rollout budgets there is *no group-relative advantage signal*. Those tasks are still learnable **if a Teacher can supply verified repairs the Student never produced**. SWE-growth routes them into supervised fine-tuning instead of discarding them.

## How-To: The SWE-growth Loop

1. **Start from a small seed set** — the paper uses **101 seed issues** with an Injector that generates repository-level repair tasks.
2. **Roll out the Student** on generated tasks with binary repair rewards under a finite rollout budget.
3. **Identify all-fail / Teacher-success tasks**: where every Student attempt fails but the Teacher reliably succeeds with a *verified* repair, collect the Teacher demonstrations as **SFT data**. (These are exactly the tasks RL can't learn from.)
4. **SFT, then re-roll**: after SFT, run Student rollouts again and select **mixed-outcome tasks with a positive Teacher–Student gap** for **RL** — the group-relative advantage is non-degenerate precisely because outcomes are mixed.
5. **Close the loop on task generation**: task eligibility statistics feed back into **Injector updates**, coupling Student training state to what the next generation of tasks looks like (adaptive curriculum).
6. **Iterate rounds**, tracking held-out benchmarks to confirm growth rather than benchmark fit.

## Results

Starting from 101 seed issues, by **Round 2** it lifts **Qwen3-Coder-30B-A3B-Instruct**:
- **SWE-bench Pro: 27.7% → 31.7%**
- **held-out TerminalBench 2.1: 11.0% → 17.2%**
- Beats Student-only self-play by **+2.6 / +4.1 pp** and Teacher-augmented self-play by **+1.8 / +2.5 pp** at approximately matched budgets.

## Why It Works

Adapting *both* supervision (SFT on Teacher-only successes) and task selection (eligibility-driven Injector) to the Student's **evolving repair capability** keeps every task pool productive: all-fail tasks stop being dead weight and mixed-gap tasks stop being diluted by saturated ones.

## Relevance to Our Domain

A concrete, reproducible recipe for bootstrapping coding agents from tiny seed sets — relevant to our AI-assisted-dev coverage and any internal program that fine-tunes repo-level agents on issue trackers.

## References
- Paper: https://arxiv.org/abs/2611.23876 (cs.SE — Songshi Liang et al., 2026-11-18)
- Related in vault: [[explanation-resolution-hypothesis-agent-evolution]] (selection signal across generations), [[explanation-automaster-skill-guided-fine-tuning-autonomous-post-training]]
