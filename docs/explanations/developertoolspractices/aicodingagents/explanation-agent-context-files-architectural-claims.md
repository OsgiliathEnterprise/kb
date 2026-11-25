---
title: Does the Agent's Map Match the Territory? Architectural Claims in AI Agent
  Context Files and Their Fit with the Code
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.29916
date: '2026-11-25'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Does the Agent's Map Match the Territory? Architectural Claims in AI Agent Context Files and Their Fit with the Code

## Overview
Boukhris, Gharbi, Hassine & Bouassida (arXiv:2611.29916, cs.SE, submitted 2026-11-22) study **agent context files** — AGENTS.md, CLAUDE.md, .cursorrules and friends — as a new artifact class in AI-assisted development. These files are "instructions-for-observing" repositories: they claim what the architecture is and how to work with it. The paper asks whether those claims actually hold against the code, and finds a striking **claim–code gap**.

## Problem Statement
Context files are now central to how coding agents orient in a codebase, yet they are maintained outside the repository's normal validation regime — no tests, no CI, no review gate. Nothing enforces that their architectural claims match the code they describe. Stale or aspirational context files risk steering agents toward non-existent modules, wrong boundaries, and phantom workflows.

## Key Contribution
- **First systematic audit of context-file architectural claims vs code** across **50 real-world repositories** spanning **22 languages**, using a two-stage LLM-assisted pipeline that extracts claims from context files and checks each against the corresponding code evidence.
- **Headline result**: only **44%** of architectural claims are **supported** by the code.
- **Distribution of the rest**: **21% partial** support, **14% undocumented** (code exists but doesn't match the framing), **13% unsupported**, **8% absent** (the thing described simply isn't there).
- **A typology of claim–code relationships** — supported / partial / undocumented / unsupported / absent — giving the field a vocabulary for context-file fidelity.

## Technical Approach
The pipeline separates *claim extraction* (what the context file asserts about modules, dependencies, patterns, workflows) from *code-side adjudication* (does the repository evidence support, partially support, or contradict the claim?). The five-way typology is what makes the results interpretable: "absent" claims (pure hallucination or drift) are qualitatively different from "partial" ones (right idea, incomplete code).

## Results
44% supported / 21% partial / 14% undocumented / 13% unsupported / 8% absent across 50 repos, 22 languages. Implication: more than half of the architectural guidance agents read is at best partially grounded in reality.

## Relevance to Our Domain
Directly actionable for our own agent workflows (this KB's agent setups rely on context files too): context files should be treated as *code-adjacent artifacts needing validation*, with periodic claim-vs-code audits as a maintenance practice. Motivates tooling: CI checks for context-file drift. Fits our growing cluster of notes on agent memory/context quality and repo-understanding.

## References
- Paper: https://arxiv.org/abs/2611.29916
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.29916
