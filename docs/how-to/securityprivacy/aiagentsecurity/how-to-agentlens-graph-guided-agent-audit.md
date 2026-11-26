---
title: 'AgentLens: Graph-guided Security Auditing for LLM-based Agents'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.34380
date: 2026-11-26
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# AgentLens: Graph-guided Security Auditing for LLM-based Agents

## Overview
AgentLens is a pre-deployment auditing framework for LLM-based agents that combines static analysis of the agent's implementation with dynamic, execution-based validation. It models the agent as an Audit Knowledge Graph, derives candidate attack paths from it, and proves each suspected weakness is real by triggering it at runtime. Applied to five popular agent applications (>24k GitHub stars each), it found 44 vulnerabilities — all execution-validated — with 12 CVE IDs assigned.

## Problem Statement
Agents couple LLM decision-making with tools, files, APIs, and execution environments, so implementation weaknesses and insecure agent–resource interactions can yield RCE, arbitrary file access, SQL injection, and data leakage. Existing approaches either target single vulnerability classes or produce static findings with no proof that a weakness is actually exploitable in a realistic workflow.

## How-to: Audit an LLM agent with the AgentLens method
1. **Analyze the implementation.** Inspect the target agent's code, its component interactions (LLM ↔ tools ↔ files ↔ APIs), and its built-in defenses.
2. **Build the Audit Knowledge Graph.** Organize components, interactions, and defenses into a graph that captures how these factors combine to expose security risks.
3. **Derive candidate attack paths.** Traverse the graph to enumerate paths along which a weakness could become a concrete exploit.
4. **Generate path-specific payloads.** For each candidate path, produce validation payloads tailored to that path (not generic fuzz inputs).
5. **Construct multi-turn audit scenarios.** Embed the payloads in task-relevant, realistic multi-turn conversations so the agent processes them as normal workflow content.
6. **Validate by execution.** Run the scenarios; a risk counts as a vulnerability only when it manifests as security-violating behavior during execution.

## Results
- 44 vulnerabilities across 5 widely used agent applications; **100% validated by being triggered during execution**.
- **3.67× more vulnerabilities** than the state-of-the-art baseline (AgentFuzz).
- 12 reported issues have received CVE IDs.

## Relevance to Our Domain
Gives us a concrete, repeatable audit procedure for agent frameworks we deploy or build (tool-calling harnesses, MCP servers, coding agents). The key discipline to adopt: never accept a static finding as a vulnerability without an execution proof, and never test payloads in isolation — always inside realistic multi-turn task context, since agent exploits typically require workflow plausibility.

## References
- Paper: https://arxiv.org/abs/2611.34380
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34380
