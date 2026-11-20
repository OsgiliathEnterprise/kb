---
title: 'SWE-Recreation: Benchmarking Coding Agents for Software Recreation'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.26311
date: 2026-11-20
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# SWE-Recreation: Benchmarking Coding Agents for Software Recreation

## Overview
SWE-Recreation tests a capability most coding-agent benchmarks ignore: can an agent **understand an unfamiliar product by using it, then rebuild it** — given nothing but rendered pixels and pointer/keyboard control? Unlike goal-given benchmarks (spec, mock-up, demo), the agent must explore the original app itself, generate a replica, and self-check before evaluation.

## Benchmark Specification
| Dimension | Value |
|-----------|-------|
| Applications | 54 real apps — 28 websites + 26 Android apps |
| Requirements | 1,446 **hidden** requirements |
| Requirement style | multistep, stateful workflows + explicit exclusions for out-of-scope behavior |
| Agent interface | rendered pixels only; pointer + keyboard actions; **no DOM, source, logs, or back-end access** |
| Agent task | explore → generate replica → self-check before evaluation |
| Grading | fixed judge grades workflows with **pixel evidence**; separate post-hoc judge estimates **exploration coverage** |
| Code/data | https://github.com/nologistic/recreateanything |

## Headline Scores (5 frontier systems, application-equal averaging)
- Weighted fidelity: **≤ 0.530**
- Fully reproduced requirements: **≤ 22.9%**

The results expose two distinct failure modes: **exploration-evidence gaps** (agents don't gather enough behavioral evidence before building) and **implementation shortfalls** (they gather it but can't reproduce it).

## When to Use This Benchmark
- Evaluating computer-use / GUI agents on *comprehension-through-interaction*, not instruction-following.
- Separating exploration quality from codegen quality via the dual-judge design (workflow judge vs exploration-coverage judge).
- Regression-testing agent self-verification loops: the self-check phase is part of the protocol.

## Comparison Context
Contrasts with SWE-Bench-style suites (issue → patch, repo access granted) and with our [[reference-agentssl-programselectbench]]: here the specification is *implicit in the running app*, closer to "clone this product" than "fix this ticket."

## Relevance to Our Domain
For teams shipping agentic developer tooling, the ≤0.53 fidelity ceiling shows that black-box product reverse-engineering remains far from solved — a caution against claiming "agent can rebuild any app from a URL" capabilities in agent product positioning.

## References
- Paper: https://arxiv.org/abs/2611.26311
- Paper (HTML full text): https://arxiv.org/html/2611.26311
- Repository: https://github.com/nologistic/recreateanything
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26311

*Verification (2026-11-20): headline numbers cross-checked against the arXiv abstract — 54 real applications, rendered-pixels-only interface, fixed pixel-evidence judge + post-hoc exploration-coverage judge, and the ≤0.530 weighted fidelity / ≤22.9% fully-reproduced-requirements ceilings for 5 frontier systems all match the source.*
