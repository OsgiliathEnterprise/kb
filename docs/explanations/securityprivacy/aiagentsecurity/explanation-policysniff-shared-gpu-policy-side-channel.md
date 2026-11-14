---
title: 'PolicySniff: Inferring Agent Policy States through Shared-GPU Execution'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.16158
date: 2026-11-14
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# PolicySniff: A Co-Resident Attacker Can Read an Agent's Policy from GPU Timing Alone

## Overview

Agentic LLM systems increasingly rely on policy machinery — guardrails, safety settings, moderation hooks, routing and tool policies — that is treated as a *hidden, trusted* component: the agent obeys it, but the environment supposedly cannot see it. **PolicySniff** breaks that assumption. The authors design and instantiate a side-channel attack in which an unprivileged **co-resident attacker** on the same GPU infers the *operating state* of a victim agent's policy stack — which guardrail, safety setting, or routing configuration is active — purely from the timing of the attacker's **own** kernel launches, with **no access to victim kernels, prompts, or responses**.

## Problem Statement

Prior GPU side channels target *data* (keys, prompts, model identity). But modern agent security leans on *control state*: is the guardrail armed? which safety tier is active? did routing pick the moderated model? This state changes the sequence and shape of GPU work the serving stack performs. If an attacker can observe that shape, the "hidden" policy becomes observable — and an adversary who knows the active policy can probe, time, or sequence their own agent interactions to evade it.

## Key Contribution

- **New target class**: policy/agent **control state** (not secrets, not inputs) as a side-channel leakable asset, extending co-resident GPU attacks from cryptography/serving into agent security.
- **Attack design**: the attacker issues its own kernels and measures launch/execution timing; the victim's policy-driven GPU activity (extra guardrail passes, moderation forwards, routing-dependent model selection) perturbs shared GPU resources in a way that is detectable from the attacker's side.
- **Native attack variant**: a **response-free** attack against an eager sparse-MoE runtime that identifies the deployed policy setting from the attacker's own GPU timing — no victim responses needed at all.
- **Scope**: demonstrated on realistic open-weight agentic stacks spanning **local and API serving**, with a taxonomy of which policy mechanisms are most leaky (those that add model forwards are the loudest).

## Technical Approach

The attack is a classic co-residency channel applied to a new observable: kernels from different processes share SM scheduling, L2, and memory bandwidth. Guardrail/moderation policies insert additional model forwards or route to different experts; each configuration yields a distinguishable timing fingerprint on the attacker's probe kernels. Classification of the active setting is done from the attacker's own launch-timing distributions, making the strongest variant response-free and hard to attribute.

## Relevance to Our Domain

For anyone deploying agent guardrails on shared or multi-tenant GPUs, "the policy is not observable" is no longer a safe threat-model assumption. Practical implications: treat guardrail activation state as sensitive; prefer dedicated GPUs or MIG partitioning for tenant isolation; and remember that attackers who can *sense* your guardrail state can adapt injection timing around it. Complements the timing side-channel literature on system-prompt leakage (arXiv:2409.20002) and CPU→GPU channels (arXiv:2608.09075).

## References

- Paper: https://arxiv.org/abs/2611.16158 (cs.CR, submitted 2026-11-12)
- Related: "The Early Bird Catches the Leak" (arXiv:2409.20002); SLAC (arXiv:2608.09075)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16158
