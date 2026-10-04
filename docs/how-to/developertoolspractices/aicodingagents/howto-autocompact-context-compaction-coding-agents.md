---
title: AutoCompact — Learning When to Compact Context in Long-Horizon Coding Agents
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2610.02163
date: 2026-10-04
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# AutoCompact — Learning When to Compact Context in Long-Horizon Coding Agents

## Overview

AutoCompact trains a coding agent to make context-compaction decisions *as part of its own policy*, rather than relying on fixed heuristics (compact at N tokens, summarize every K steps). For repository-level software-engineering tasks that run as long trajectories of code inspection, search, editing, and testing, earlier exploration becomes stale — so managing context is more than avoiding overflow: the agent must decide **when** to compact, **what working state** to preserve, and **how to continue** from it.

## Problem Statement

Coding agents solve repository-level tasks through long trajectories. As a task progresses, earlier exploration goes stale, so naive "compact when full" policies either lose needed working state or keep useless context. The missing piece is learning the *decision* — timing, what to preserve, how to resume — rather than treating compaction as an external, rule-based step bolted onto the agent loop.

## Key Contribution

- **Compaction as policy**: the agent learns when to compact, what working state to keep, and how to continue from it, integrated into its action space rather than handled by a separate heuristic.
- A **judge-in-the-loop data pipeline**: run the base agent on coding tasks; a judge reviews its compaction decisions, summaries, and post-compaction actions; flawed outputs are replaced with corrected ones *before* execution so each trajectory continues from the corrected decision.
- **Two-stage training**: supervised fine-tuning on those corrected trajectories, then joint optimization of coding *and* compaction via reinforcement learning with task-success rewards.

## Technical Approach

The base agent runs real coding tasks; a judge audits three things per trajectory — the compaction decision (was now the right time?), the summary (does it preserve the working state needed to continue?), and post-compaction actions (does the agent resume coherently?). Wherever the judge finds flaws, corrected versions are spliced in before the environment executes them, so training data reflects *good* compaction behavior. SFT on these trajectories teaches the pattern; RL with task-success rewards then jointly optimizes coding and compaction end-to-end.

## Results

- On **SWE-bench Verified** and **SWE-PolyBench Verified**, AutoCompact improves pass rates over the base model by an absolute **+9.2%** and **+5.0%** respectively.
- Gains hold across all evaluated inference budgets: with a 256K context window that never overflows, and with a 16K window whose overflow triggers fallback compaction — showing the learned policy helps even when hard limits are not binding.

## Relevance to Our Domain

A directly reusable recipe for teams building long-horizon coding agents: (1) instrument your agent's compaction events, (2) use an LLM judge to audit decision/summary/resume quality and splice in corrections, (3) SFT on the corrected trajectories, then RL with task-success rewards. The key design choice — making "when/what/how to compact" part of the learned policy rather than a fixed threshold — is what unlocks gains even at large context budgets where overflow never occurs.

## References

- Paper: https://arxiv.org/abs/2610.02163
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.02163 (citationCount: 2)
