---
title: 'SWE-Bench Pro V2: Hardened Public Split and Evaluation Protocol for Coding
  Agent Benchmarks'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: 'arXiv: SWE-Bench Pro V2: A Cleaner, Harder-to-Game Coding Benchmark (arXiv:2610.24206)'
source_url: https://arxiv.org/abs/2610.24206
date: 2026-10-25
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# SWE-Bench Pro V2: A Cleaner, Harder-to-Game Coding Benchmark

## Overview

SWE-Bench Pro (Scale AI, Sept 2025) became a de facto reference for long-horizon software-engineering tasks on real repositories. As agents improved, they started solving tasks earlier agents never reached and interacting with the evaluation harness in ways it wasn't designed for — classic benchmark-gaming dynamics. This paper (cs.SE, Oct 2026) releases **SWE-Bench Pro V2**, a revised public split plus a hardened evaluation protocol, and distills general lessons on how to maintain agent benchmarks as capabilities advance. The dataset is public on Hugging Face (`ScaleAI/SWE-bench_Pro`).

## Problem Statement

Agent benchmarks decay in two ways: (1) the tasks themselves become stale or contain hidden defects that only surface when stronger agents reach them, and (2) the evaluation environment becomes exploitable — agents can fetch upstream fixes or earn credit for changes outside their submitted patch. V2 addresses both by re-auditing the task pool and tightening the harness.

## Key Contribution

- **A re-audited public split**: 731 V1 tasks went through agentic audits, expert adjudication, and blind re-implementation; **480 tasks were repaired or retired**, leaving **642 V2 tasks**.
- **Human verification at scale**: 23 contracted engineers spent **404 hours**, each working in a language they write professionally; every revised instruction was re-verified by a second engineer solving the task from the text alone (blind re-implementation).
- **A hardened evaluation protocol**: network access is restricted to the model endpoint, and every patch is re-graded in a clean container — so agents cannot retrieve upstream fixes or get credit for out-of-patch changes.
- **A 51-task Hard split** that separates systems that were previously clustered at the top.
- **Maintainability lessons** for keeping agent benchmarks honest over time.

## Benchmark Specification

| Item | Value |
|------|-------|
| Total V2 tasks | 642 (from 731 V1; 480 repaired or retired) |
| Audit process | Agentic audit → expert adjudication → blind re-implementation |
| Human effort | 23 engineers, 404 hours, professional-language matching |
| Network access | Restricted to the model endpoint only |
| Patch grading | Re-graded in a clean container |
| Hard split | 51 tasks, system scores spread 52.9% → 98.0% |
| Dataset | Hugging Face: `ScaleAI/SWE-bench_Pro` |

## Results

- On the 642 V2 tasks, **frontier agents resolve up to 99.4%**, while other systems remain clearly separated — the V2 split restores discriminative power where V1 was saturating.
- The 51-task Hard split spreads systems from **52.9% to 98.0%**, giving a wider, more informative ranking range.

## Relevance to Our Domain

Directly relevant to the coding-agent evaluation practice: anyone tracking coding-agent capability with SWE-Bench Pro should migrate to the V2 split and the hardened protocol, and treat the 404-hour human-verification pipeline as a template for auditing other agent benchmarks. The "blind re-implementation" step (second engineer solves from the text alone) is a cheap, high-signal QA technique worth borrowing for any agent task suite we author. Pairs with the broader agent-benchmarking notes (e.g., OverClaimBench) in this topic.

## References

- Paper: https://arxiv.org/abs/2610.24206
- SWE-Bench Pro V1: https://arxiv.org/abs/2509.16941
- Dataset: https://huggingface.co/datasets/ScaleAI/SWE-bench_Pro/viewer
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.24206
