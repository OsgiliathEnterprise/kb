---
title: 'Beyond Prompt Injection: The Tool Update Gap in LLM Agent Security'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.01976
date: '2026-11-17'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Beyond Prompt Injection: The Tool Update Gap in LLM Agent Security

## Overview
This paper identifies the **tool update gap**: a vulnerability window that opens when an agent keeps using a tool whose schema has changed underneath it. Unlike prompt injection (malicious content entering the context), the threat here is a *trust-reuse* problem — the agent grants a tool continued trust because of prior approval, ignoring that its interface evolved. The authors instantiate it as **ETUDE** (Evolved Tool Undetected Dynamic Execution) against Model Context Protocol (MCP) ecosystems, a supply-chain class sitting between traditional software supply-chain attacks and prompt injection.

## Why Existing Defenses Miss It
Current tool-poisoning defenses inspect tools only **at the moment of registration**. After approval, schema evolution goes unexamined. MCP makes this concrete: its tools and prompts can be modified dynamically through **ListChanged notifications** — a legitimate protocol feature that becomes the attack vector when nobody re-inspects what changed.

## How ETUDE Works (attack anatomy)
1. Attacker registers a benign-looking tool in the MCP ecosystem.
2. Agent approves it during normal onboarding.
3. Later, the tool's schema is **mutated post-approval** via ListChanged-style updates, altering the instructions the agent reads for that tool.
4. The agent, trusting its earlier approval decision, executes with the evolved schema — attacker-controlled semantics without any prompt injection into the conversation.

## Measured Impact
- **60% attack success rate (ASR)** against Claude Code in tool-hijacking scenarios.
- **96% ASR** for sensitive-information exfiltration.
- **40% ASR for persistence** — the evolved tool keeps acting across sessions.
- **68% median ASR against GPT-5** — severity does **not** diminish with model capability.
- Evaluated across three MCP environments: **68 MCP servers, 185 MCP tools**.

## Defensive Implication
Trust in agent tool ecosystems must be tied to the **current schema**, not to a registration-time snapshot. Practical mitigations: re-validate tool schemas on every ListChanged notification, pin/diff schemas, and treat post-approval schema mutation as a privilege-escalation event requiring fresh consent.

## References
- Paper: https://arxiv.org/abs/2611.01976
- Related: [[Scaling Adaptive Prompt Injection Attacks with Agent Swarms]], tool-poisoning literature in this topic
