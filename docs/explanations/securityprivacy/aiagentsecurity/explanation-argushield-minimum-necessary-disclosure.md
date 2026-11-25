---
title: 'ArguShield: Enforcing Minimum-Necessary Disclosure in Tool-Calling LLM Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.30360
date: '2026-11-25'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# ArguShield: Enforcing Minimum-Necessary Disclosure in Tool-Calling LLM Agents

**Authors:** Ying Fu, Yulong Fu

## Overview
Fu & Fu (arXiv:2611.30360, cs.CR, submitted 2026-11-23) address a quiet failure mode of tool-calling agents: **even without malicious intent**, agents fill broad or weakly constrained tool-call fields with private information the receiving tool doesn't need — a call that satisfies the schema and completes the task, yet violates **minimum-necessary disclosure**. Their answer, **ArguShield**, is a mediation layer that intercepts proposed tool calls *before execution* and justifies each candidate value individually.

## Problem Statement
Agents increasingly hand user data to third-party tools via tool calls. Tool schemas validate *structure*, not *necessity*: a field that legitimately accepts a string will happily receive a phone number, an address, or a medical detail the task never required. The result is silent over-disclosure to external endpoints, invisible to task-success metrics. Prompt-level protection ("don't share unnecessary data") reduces unauthorized disclosure but substantially lowers task success.

## Key Contribution
- **Principle**: minimum-necessary disclosure as a per-value governance rule for tool calls — every sensitive field must be justified before it leaves the agent.
- **Three-signal evaluation** of each candidate value before execution:
  1. **Value Provenance** — where did this value come from?
  2. **Task Relevance** — does the task actually require this field to carry this value?
  3. **Disclosure Boundary** — is this value within the permitted scope for the receiving tool?
- **Three-way enforcement actions**: *release* justified values, *defer* values that need user confirmation, *withhold* values outside the permitted scope — instead of an opaque allow/block.

## Results
Evaluated with **four tool-calling models** on **ArgPrivBench** — a 120-task benchmark spanning Travel, Shopping, and Healthcare:
- Unprotected agents frequently over-disclose private information despite high task success.
- Prompt-only protection cuts unauthorized disclosure but at a substantial cost to task success.
- **ArguShield reduces unauthorized silent release to 9% on Standard tasks and 6% on High-risk tasks**, while preserving recoverable task success under simulated user confirmation (deferred values flow back through the user).

## Relevance to Our Domain
This pushes least privilege from *access control* down to the **argument/data-field level** of tool calls — the natural next control plane for agent gateways and MCP-style tool bridges. The release/defer/withhold trichotomy maps cleanly onto human-in-the-loop approval UIs (defer = ask the user), and the three signals are implementable as a pre-execution check without touching model weights. Pairs with our agent-security cluster (tool misuse, data exfiltration, prompt injection) and with the hub-detector audit note added the same day.

## References
- Paper: https://arxiv.org/abs/2611.30360
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30360
