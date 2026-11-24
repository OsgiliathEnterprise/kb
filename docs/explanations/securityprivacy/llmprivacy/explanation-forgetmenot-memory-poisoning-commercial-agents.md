---
title: 'FORGETMENOT: Auditing Memory Driven Privacy Risks in Commercial AI Agents'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.29804
date: '2026-11-24'
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# FORGETMENOT: Auditing Memory Driven Privacy Risks in Commercial AI Agents

## Overview
Commercial AI agents increasingly rely on long-term memory — both a persistent memory store and the chat history — to personalize answers. FORGETMENOT is an **auditing framework** that measures the privacy risks of that memory across four dimensions nobody had measured together on production systems: **storage** (what gets remembered), **disclosure** (what leaks out), **transparency** (what the user can see), and **deletion control** (whether forget actually means forget). It is the first large-scale empirical audit of memory behaviour in commercial agents.

## Study Scale
~**3,800 multi-turn sessions**, ~**6M tokens**, across **five popular commercial AI agents** — a corpus large enough to characterize memory behaviour statistically rather than anecdotally.

## Key Findings
1. **Broad attribute collection.** Agents store wide-ranging personal attributes from ordinary conversation — demographics, **health**, and other sensitive details.
2. **A large transparency gap.** The memory view exposed to users reveals only **~20 % on average** of the attributes agents actually store. What users can inspect is not what the system knows.
3. **Stealthy Memory Injection (SMI).** An injection technique that gets extra personal/sensitive attributes written into memory, raising stored-attribute counts by **+25 % (Copilot)** and **+15 % (Claude)** — attacker-influenced memory is feasible on production platforms.
4. **Deletion doesn't delete.** All five agents show **non-zero post-deletion leakage**, including health and self-harm-related attributes — a compliance-relevant failure under GDPR-style erasure rights.
5. **Exfiltration path demonstrated.** A proof-of-concept shows stored memory being disclosed to a **third-party email recipient**, with a **31.9 % leakage rate on Gemini** — memory + tools turns stored facts into outbound data flows.

## Why It Matters (Explanation)
The audit reframes agent-memory privacy as a **lifecycle** problem: collection breadth, user visibility, injection resistance, and erasure guarantees are four separable properties, and production platforms fail each one measurably. Two systemic conclusions: (a) user-facing memory UIs are not a trustworthy mirror of stored state, so transparency obligations need technical enforcement, not UI affordances; (b) once memory can condition tool actions (email), post-deletion retention becomes an exfiltration risk, not just a hygiene issue. The authors close with design implications and regulatory recommendations for memory privacy.

## References
- Paper: https://arxiv.org/abs/2611.29804
- Related in KB: `explanation-kv-cache-shuffling-token-recovery.md`, GapLeak web-agent disclosure note under security-privacy/llm-privacy
