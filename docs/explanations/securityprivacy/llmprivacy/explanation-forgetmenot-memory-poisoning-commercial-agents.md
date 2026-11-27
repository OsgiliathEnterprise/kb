---
title: 'FORGETMENOT: Auditing Memory Driven Privacy Risks in Commercial AI Agents'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.29804
date: 2026-11-24
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# FORGETMENOT: Auditing Memory Driven Privacy Risks in Commercial AI Agents

**Authors:** Ismat Jarin, Tu Le, Athina Markopoulou

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

## Methodology (from the full paper, v1)

**Affiliations:** UC Irvine (Jarin, Markopoulou) and The University of Alabama (Le). arXiv 2611.29804, cs.CR, submitted 2026-11-22.

**Audited agents:** ChatGPT (OpenAI), Gemini (Google), Copilot (Microsoft), Claude (Anthropic), Replika (Luka) — via their web interfaces.

**Audit pipeline:**
1. **Synthetic personas** spanning 11 categories and 83 personal attributes grounded in the CCPA definition of personal information; attribute *values* are canary-inspired (rare, synthetic) so genuine memory disclosure can be distinguished from general model knowledge. Sensitive values (e.g., self-harm) are elicited with crafted prompts/templates that avoid guardrail blocking.
2. **Account training** with two multi-turn datasets per persona: *naive* (natural disclosure without memory-triggering cues like "remember") and **SMI** (embeds memory-triggering cues in copy-pasted benign content).
3. **Automated crawler** drives the audit space: 2 personas × 2 training methods × **3 memory settings** (S1 all memory enabled, S2 persistent memory only, S3 all deleted) × 5 prompting strategies — ~3,800 sessions, ~6M tokens.
4. **LLM-as-a-judge** analysis over six research questions (RQ1–RQ6); authors commit to releasing the software artifact and dataset as a reusable benchmark.

**Additional verified findings:**
- SMI also raises stored sensitive attributes **+10% on Gemini** (besides +25% Copilot, +15% Claude).
- Disclosure rates are measured per attribute category (health, financial, preferences, harmful preferences); overall disclosure spans roughly **21–82% across the audited agent matrix** — stored memory reliably resurfaces when prompted.
- Context statistic: prior work found **96% of ChatGPT memory entries were not user-initiated** and 28% contained personal information.
- Ethics posture: all experiments used synthetic personas and fake accounts in private browser sessions — no real-user data, one account at a time per platform, no rate-limit or access-control bypass; deemed minimal-risk, no IRB review required.

## Why It Matters (Explanation)
The audit reframes agent-memory privacy as a **lifecycle** problem: collection breadth, user visibility, injection resistance, and erasure guarantees are four separable properties, and production platforms fail each one measurably. Two systemic conclusions: (a) user-facing memory UIs are not a trustworthy mirror of stored state, so transparency obligations need technical enforcement, not UI affordances; (b) once memory can condition tool actions (email), post-deletion retention becomes an exfiltration risk, not just a hygiene issue. The authors close with design implications and regulatory recommendations for memory privacy.

## References
- Paper: https://arxiv.org/abs/2611.29804
- Related in KB: `explanation-kv-cache-shuffling-token-recovery.md`, GapLeak web-agent disclosure note under security-privacy/llm-privacy
