---
title: 'Mind the Gap: A Deployed Multi-Agent System for Documentation Maintenance'
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.23142
date: 2026-11-18
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# Mind the Gap: A Deployed Multi-Agent System for Documentation Maintenance

## Overview
Software ships faster than ever, but customer-facing documentation lags — and the cost of that gap is worsening because **users increasingly consume documentation through LLM-based agents, which propagate stale information as authoritative** (arXiv:2611.23142; Lorenzo Masoero). The paper reports a **deployed multi-agent system** built around a triage agent called **"TriAgent"** that continuously extracts drift signals from channels that already exist and repairs documentation drift.

## Problem Statement
Documentation goes stale relative to code; humans can't keep pace. The paper's key reframing: **signals for where docs have fallen behind already exist in abundance** —
- **explicit**: resolved support tickets revealing what documentation lacks;
- **implicit**: code–documentation discrepancies detectable from automated loops.
The missing piece is a pipeline that turns those signals into reviewed fixes.

## Architecture
- **TriAgent (triage agent)**: continuously extracts explicit and implicit drift signals, surfaces documentation gaps, and drafts repairs.
- **Multi-agent coordination** around triage, with human review before fixes land.
- **Closed self-improvement loop**: when a human reply to a ticket contains an insight buried in (or missing from) the documentation, the system turns that insight into a **documentation gap and, after human review, a fix** — repairing the corpus that the answering agent itself consumes.

## Evaluation (43 days, shadow mode)
- **499 tickets triaged**, **92 documentation gaps** surfaced.
- Correctness: judged by a **panel of LLM judges from independent model families** (majority of three), **81.1% of TriAgent's verifiable assertions were correct** (245 of the 302 assertions the human resolution addresses).
- Preference on length-comparable pairs: panel preferred **TriAgent's response in 70.5%** of pairs vs. **23.2%** for the human engineer's (remainder no majority).
- **Complementarity**: human replies often surfaced insights absent from docs — exactly the raw material the gap-extraction loop harvests.
- **Repair efficacy**: re-answering the same ticket after the repair, blinded judges preferred the **post-repair answer over its own pre-repair answer 71.4%** of the time (n=35). A blinded human audit confirmed strong alignment on self-improvement.

## Why It Matters
Rare production evidence, with independent-model-family judge panels and blinded human audits, that (a) agent-drafted doc fixes can out-prefer human drafts on comparable pairs, and (b) doc repair measurably improves downstream agent answers — documentation becomes a learnable substrate for agent self-improvement rather than a static artifact.

## Relevance to Our Domain
A direct blueprint for our knowledge-base operations: mine drift signals from support/QA channels and code-vs-doc diffs, triage with a dedicated agent, gate fixes behind human review, and measure end-to-end impact by re-running previously-answered questions against the repaired corpus. The judge-panel methodology is a good template for evaluating our own content-pipeline automation.

## References
- Paper: https://arxiv.org/abs/2611.23142
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23142?fields=citationCount,year
