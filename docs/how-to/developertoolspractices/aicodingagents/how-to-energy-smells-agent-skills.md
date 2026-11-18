---
title: Identifying and Repairing Energy Smells with Agent Skills
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.23203
date: '2026-11-18'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Identifying and Repairing Energy Smells with Agent Skills

## Overview
Mehditabar, Rajput and Sharma tackle **energy smells** — inefficient implementations that consume more energy than functionally equivalent alternatives while preserving behavior, i.e., **green-software maintenance made proactive**. They observe that energy-efficiency concerns should **shift left** into the development environment (IDE, coding agent) instead of being assessed only at test/release time. Their contribution is **DR. GREENS**, an **agent skill** that detects and repairs energy smells in Python projects from within the developer's coding environment.

## Problem Statement
Existing energy-smell tools (i) rely on **fixed static rules** that miss smell manifestations outside the rule set, and (ii) **do not measure actual energy savings** of proposed fixes. LLM-based optimizers typically target **execution time**, not the energy-smell definitions, so they miss smells that are not latency-relevant.

## How-To: Detect and Repair Energy Smells Inside Your Coding Agent
1. **Ground the agent in an empirical taxonomy** rather than fixed rules: DR. GREENS is built on **12 energy smells, 65 identified root causes, and repair guidance distilled from 230 empirically measured cases**.
2. **Pair the LLM with deterministic tooling**: the skill integrates an **ad-hoc static analyzer** (finds manifestations beyond hand-crafted patterns) and an **independent verifier**.
3. **Verify before accepting a repair**: the verifier confirms both **behavior preservation** and **actual measured energy savings** — repairs are kept only if the saving is real.
4. **Work in-environment**: detection and repair happen inside the coding environment (e.g., agentic IDE sessions), enabling shift-left energy checks during normal development.

## Results
Exploratory study over **18 interactive sessions on three repositories and two foundation models under three configurations**: DR. GREENS produces **258 measured repairs, with 68.6% saving energy (median reduction 24.9%)**. A baseline agent **without the taxonomy produces fewer verified energy-saving repairs**.

## Relevance to Our Domain
Agent skills are emerging as the packaging format for coding-agent expertise; this is a template for **"verified optimization" skills**: taxonomy + static analyzer + independent measurement, which generalizes to performance, security and cost skills. Also feeds FinOps/GreenOps: median 24.9% energy reduction on real repos is a concrete, auditable CI-level check. Related: [[explanation-harness-maintenance-rolling-window]].

## References
- Paper: https://arxiv.org/abs/2611.23203
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23203
