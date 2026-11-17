---
title: 'Where the Savings Go: The Limits of Hiding Cross-Tenant Cache Hits in LLM
  Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.20291
date: 2026-11-17
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Where the Savings Go: The Limits of Hiding Cross-Tenant Cache Hits in LLM Serving

## Overview

Serving engines cache prompt prefixes, so a cache hit computes less and returns faster — meaning a **shared prefix cache leaks whether anyone else has sent a given text**. Per-account salting closes the channel but forfeits cross-tenant reuse and only isolates whole accounts. Defences that "share globally but hide hits" promise reuse without trusting account boundaries. This paper shows those defences have a fundamental limit: follow where the *saved time goes*, and the hit is detectable anyway.

## Problem Statement

Prior defences attack the **hit–miss gap** of the hit request itself. The authors shift the attack surface to the **scheduler**: with step-based schedulers that never idle while work waits, the time saved by a hit is passed on **in full to every request queued behind it**, shifting each one earlier by the same amount — an observable signal, even if the hit request itself is perfectly hidden.

## The Attack

An attacker within ordinary rate limits brackets a probe with **two groups of one-token listeners**, fires them in a short burst, and counts in how many scheduling steps they finish. The shift fingerprint reveals whether the probed text is cached.

## Results

- Replaying a production trace on one vLLM instance at ≤50% capacity: a **single probe** detects cached texts ≥256 tokens with **advantage ≥ 0.98**.
- Defences that hide only the hit request fall to **one probe** on both vLLM and SGLang.
- Random delays must reach **~10× the shift** to push the advantage down to 0.1.
- Narrowing what is shared gives **no guarantee** against this inference.
- **Impossibility-style theorem**: any observable tenant benefit is a signal — a rate-limited tenant's gain from content written by *k* other accounts is bounded by O(k × allowed leakage), whatever the provider does with identities; at zero leakage, **only the provider keeps the savings**.
- Exact hiding is attainable in principle on one instance, but pause/hold-style mechanisms know skipped work's duration only approximately, so under saturated prefill they must pad every step that *may* hold a hit — a cost that grows with **time, not hits**.

## Relevance to Our Domain

This is the privacy bottom line for shared prompt caching — a feature we rely on heavily for coding-agent workloads (shared prefixes across sessions and users). Key takeaways: cross-tenant savings and cross-tenant privacy are provably in tension; "hiding the hit" is insufficient — queue effects must be neutralised; and the one-token-listener burst is a cheap, practical red-team probe for any multi-tenant serving stack we operate or consume.

## References

- Paper: https://arxiv.org/abs/2611.20291 (cs.CR — Bowen Sun, Chaowei Xiao)
- Related: `reference-kvcompass-prefix-cache-discovery.md`, `explanation-policysniff-shared-gpu-policy-side-channel.md` (ai-agent-security)
