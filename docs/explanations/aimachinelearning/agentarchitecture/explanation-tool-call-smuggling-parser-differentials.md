---
title: 'Oops!... I Parsed It Again: Tool-Call Smuggling Against LLM Agents'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.30624
date: 2026-11-24
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Oops!... I Parsed It Again: Tool-Call Smuggling Against LLM Agents

**Authors:** Igor Santos-Grueiro, Daniel Romero-Ruiz. (arXiv:2611.30624)


## Overview
An LLM agent acts through tool calls: the model writes call arguments as JSON, a guard decides whether the call may run, and an executor runs it. Crucially, **the same bytes are parsed several times** — by the provider, gateways, SDKs, frameworks, the guard, and the executor — and JSON leaves some decisions to each parser (e.g., which copy of a repeated key wins). This paper (arXiv:2611.30624, cs.CR/cs.AI/cs.SE) introduces **tool-call smuggling**: when guard and executor parse differently, the guard approves one call, the executor runs a *different* one, and the audit log records only the approved call.

## The Vulnerability Class
- **Root cause**: parser discretion. Duplicate keys, disguised key encodings, and JSON text embedded in string arguments are each resolved per-parser, so identical bytes can denote different calls.
- **Six distinct byte-to-call divergence mechanisms** are catalogued across the agent stack.
- **Differential testing**: a harness feeds identical bytes to 17 pinned parser/validator configurations; most pairs disagree on some inputs — even **two official MCP SDKs accept different inputs**.

## Demonstrated Attacks
- On tasks from τ-bench and AgentDojo, an attacker able to rewrite bytes in transit **cancels another customer's reservation** and **creates a file the guard blocks by name** — while the audit log names only the approved call.
- **Content-mediated split**: of ten models tested, none writes a repeated or disguised key into the tool call itself; but models will **copy such content verbatim into JSON text inside an argument**, which a Python guard and a Go executor then read differently.
- **Schema-shadowing attack**: a malicious server clones a legitimate tool's public schema, adds one extra field (justified by a note), and the model dutifully fills it with user data — a field the guard never sees.

## The Fix: Parse Once, Seal the Call
The authors' defense defeats **all 7,412 crafted inputs** and every attack they built:
1. Parse each call **exactly once** — including JSON text embedded in arguments.
2. Keep **only the fields of the approved schema**, dropping anything else.
3. Hand the executor that single canonical call, **sealed with its call ID in transit**, so the audited/approved bytes are the executed bytes.

## Threat-Model Takeaways for Agent Platforms
1. Guard ≠ ground truth: any architecture where guard and executor independently re-parse bytes is vulnerable by construction.
2. Audit logs inherit the guard's parse, so smuggling is **invisible to forensics** by design — seal the identity of what was approved.
3. The dangerous direction is content → JSON-in-string, not model → key injection: models resist writing malicious keys directly but copy hostile JSON payloads verbatim into argument text.
4. Parser heterogeneity across the stack (provider → gateway → SDK → framework → guard → executor) is itself the attack surface; pin and test parser versions with differential harnesses, as even official SDKs disagree.

## Relevance to Our Domain
A foundational agent-security note for the KB's agent architecture and DevSecOps coverage: analogous to classic parser-differential bugs (e.g., PHP multipart CVE-2016-5734) but relocated into the LLM agent tool-call pipeline. Directly actionable for anyone building MCP-based tool gateways or guardrails.

## References
- Paper: https://arxiv.org/abs/2611.30624 (cs.CR, cs.AI, cs.SE, submitted 2026-11-23)
- PDF: https://arxiv.org/pdf/2611.30624
