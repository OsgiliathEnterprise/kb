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
This paper identifies the **tool update gap**: once a tool is admitted to an agent framework (reviewed at admission time), **subsequent updates to that tool can be adopted without re-examining the updated implementation**. The authors instantiate the threat as **ETUDE** (*Exploiting Tool Updates for Direct Execution*): malicious functionality is embedded inside an otherwise legitimate tool update. It is a supply-chain class of attack that sits *outside* the model's context window entirely — a different threat surface from prompt injection.

## Why Existing Defenses Miss It
- Malicious code rides in the tool update and executes **without ever entering the LLM's context and with no adversarial instructions**, so defenses restricted to model-visible content — prompt-injection detectors, static skill scanning — cannot see it.
- **Integrity verification and code review can be bypassed** through obfuscation, or bypassed in practice because blocking updates would disrupt legitimate maintenance.
- The structural flaw is at the **admission/review boundary**: review happens once, at admission; updates are trusted by inheritance.

## Attack Anatomy (ETUDE)
1. A tool is published and passes admission review as a legitimate tool.
2. A later update embeds the malicious functionality in the tool's implementation.
3. The agent framework adopts the update; the malicious code runs **directly on the host with the agent's privileges** — no tokens ever enter the model's context.
4. Delivery timing × execution path yields four conditions; ETUDE occupies the one no in-context defense reaches.

## Measured Impact
- Evaluated across **three representative attack workloads** and **seven widely used commercial and open-source agentic frameworks**, including Gemini CLI, Codex CLI, and Claude Code.
- **97.6% attack success rate while maintaining a 95.9% legitimate task completion rate** (the attack is not degrading normal use).
- Best framework–workload cell: **100.0% ASR / 99.6% task completion**, versus **20.2% ASR for the strongest in-context baseline** (context-delivered execution) — a ~79-point ASR gap between out-of-context tool-update delivery and in-context delivery.

## Defensive Implication
Trust must be tied to the **current implementation of each tool**, not to an admission-time snapshot: re-review (or pin/diff) on every update, treat a tool update as a fresh privilege grant, and add integrity checks that run on the *executed binary*, not on declared content — because content-level review is bypassable by obfuscation.

## References
- Paper: https://arxiv.org/abs/2611.01976
- Related: [[Scaling Adaptive Prompt Injection Attacks with Agent Swarms]], tool-poisoning literature in this topic
