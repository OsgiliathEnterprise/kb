---
title: 'SmartLens: Turning AI Agent Changes into Learning, Review, and Risk Signals
  in the IDE'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.34377
date: '2026-11-27'
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# SmartLens: AI-Attributed Pending Changes as Learning, Review, and Risk Signals in the IDE

## Overview
Etemadi & Robles (arXiv:2611.34377, submitted 2026-11-25) reframe the developer's role: developers increasingly **manage AI coding agents**, then must understand, verify, ship, and *learn from* what the agents produce. Existing tooling can show which *committed* lines were AI-written, but does **not attribute pending (uncommitted) changes from external agents**, and does not use attribution to support review, learning, or risk judgement. **SmartLens** is an **IntelliJ IDEA plugin** that fills both gaps.

## Problem Statement
Agent-authored pending changes are invisible as such until committed. The developer reviews them blind to provenance, cannot compare them against their own competence map, and cannot flag long-term risk from AI-written code they don't understand.

## Key Contribution — Three Goals from One Signal (attribution + Git history)
SmartLens attributes each pending change to **the AI agent, the developer, or both**, then derives:
1. **Learn** — compares the *skills* (APIs, language features, annotations) the agent used against skills the developer has used in their own commits: surfacing what the agent knows that you don't.
2. **Understand** — ranks pending changes by **review priority**.
3. **Risk** — surfaces **hotspots**: files that change often, are mostly AI-written, and the developer barely knows.

## Results (preliminary evaluation)
- Attribution: **8 of 12 scripted IDE scenarios** correct; all failures were in expected blind spots.
- On **8 OSS repositories** with agent co-authored commits, agents introduced **up to 253 skills absent from the main developer's own commits** — the learning gap is real and large.
- The Risk ranking predicted later bug fixes **as well as or better than plain churn**, though part of the gain traces to recency.

## Relevance to Our Domain
Concrete IDE-side mechanism for the "developer as agent manager" workflow: provenance-aware review and long-term comprehension-risk visibility, complementing CI-side validation ([[tutorial-harbor-coding-agent-evaluation-oracle-nop]]).

## References
- Paper: https://arxiv.org/abs/2611.34377
