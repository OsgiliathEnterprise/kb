---
title: Backtracking Agent Applications Security Incidents
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.26525
date: 2026-11-20
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# Backtracking Agent Applications Security Incidents

## Overview
When an LLM agent application suffers a security incident (e.g. prompt-injection-driven compromise), responders must find the compromise entry point (CEP) — the first malicious interaction — to remediate and prevent recurrence. This paper presents **Origin**, a backtracking tool that closes the semantic gap between agent trajectory logs (agent-functionality level) and application source code (function-call level), letting an analyst pinpoint CEPs with a small number of queries instead of manually reading code for every candidate.

## Problem Statement
The main forensic artifacts for agent apps are trajectory logs and source code; application-specific function-call logs are usually thin. Trajectory logs live at the *agent functionality* abstraction layer, but CEP candidates are *function calls* in the app code. Because of this semantic gap, an analyst must manually inspect the code behind each candidate to infer which agent functionality it corresponds to — slow and error-prone.

## How to Backtrack an Agent-App Incident with Origin
1. **Collect the two layers**: ingest the agent trajectory log (recorded agent functionalities) and the application source code. Do not expect rich app-level call logs — assume they are limited.
2. **Build the intermediate abstraction**: Origin constructs a **cross-layer dependency graph (CLDG)** that connects *region-inferred functions* (the semantic layer: regions are groups of agent functionalities) to *variables in the low-level taint-propagation subgraph* (the execution layer).
3. **Run region inference**: use Origin's region-inference algorithm to determine the region-to-variable mapping — i.e. which groups of agent functionalities correspond to which tainted variable flows in code.
4. **Query across layers**: submit a small number of queries in Origin's query language to link observed agent behaviour to suspicious code execution and narrow the CEP candidate set.
5. **Confirm the CEP**: validate the identified entry point — the first interaction where hostile content entered the agent's dataflow and propagated through the taint subgraph.
6. **Remediate and harden**: patch the exploited functionality path and add monitoring at the identified region/function boundary.

## Why It Works
The CLDG removes the manual code-inspection step: instead of an analyst guessing which functionality a function call implements, the graph and query language encode the mapping between the two semantic layers. In case studies on **five popular agent applications across eight attack incidents**, an analyst using Origin correctly identified **all** the CEPs — cases existing tools could not resolve.

## Practical Takeaways for Teams Running Agent Applications
- Instrument now: keep trajectory logs at the agent-functionality layer, but plan forensics around the fact that they alone cannot locate code-level entry points.
- Taint-style variable tracking over the app code plus region inference bridges the gap — evaluate tooling that builds cross-layer graphs rather than log-correlation only.
- Expect the first question in any agent-incident postmortem to be "which interaction was the entry point" — pre-build query capability against trajectories and source.

## References
- Paper: https://arxiv.org/abs/2611.26525
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26525
- Related: [[explanation-miasma-worm-agentic-supply-chain-attack]], [[explanation-llm-agents-tamper-with-their-own-traces]] (ai-agent-security)
