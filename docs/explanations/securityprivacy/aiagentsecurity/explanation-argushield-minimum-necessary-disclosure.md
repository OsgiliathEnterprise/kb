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

## Overview
Shayegan, Mohammadi, Pourreza, Farnia & Afroz (arXiv:2611.30360, cs.CR/cs.AI/cs.CL, submitted 2026-11-23) formalize a governance principle for agentic tool use — **minimum necessary disclosure**, the agentic analogue of least privilege — and implement it in **ArguShield**, a defense that verifies whether every sensitive field in a proposed tool call is actually justified by the user's stated goal *before* execution.

## Problem Statement
Tool-calling agents mediate access to sensitive systems (email, cloud APIs, internal data), and a growing class of attacks exploits this by inducing **unauthorized tool invocations that expose sensitive information**, amplified through indirect prompt injection and malicious tool outputs. Existing defenses fail in three ways: they react *after* the action has happened; they check the *action type* without reasoning about *data flow* (which fields, why); and they lack an explicit, auditable decision record.

## Key Contribution
- **Policy formulation**: minimum necessary disclosure — every field of a requested tool call must be justified by the user's stated goal for the call to be permitted.
- **Runtime verification architecture**: two independent **Verifier Agents** score field-level sensitivity and goal-relevance; a **Policy Agent** consolidates the justifications and applies a thresholded, fine-grained accept/reject decision.
- **Governance-grade auditability**: every decision emits structured justifications — decision rationale, per-field relevance scores, risk attribution — instead of an opaque allow/block.
- **Adversarial robustness study**: three novel attack vectors probing the defense mechanism itself (subverting the verifiers or the policy aggregation).

## Technical Approach
The design decouples *what the model wants to send* from *what the goal warrants*: sensitive-field detection and goal-relevance scoring run in parallel verifiers, and the policy layer enforces thresholds on aggregated justification quality. Because the decision process is itself a small multi-agent protocol, it is also an attack surface — hence the dedicated adversarial evaluation of the defense internals, not just the agent.

## Results
Substantially reduces unauthorized data disclosure relative to strong baselines across benchmark settings, while preserving task utility; the paper reports the defense remains effective under the three proposed defense-targeting attacks.

## Relevance to Our Domain
Least privilege is standard for *access*; this work pushes the same discipline down to the *argument/data-field* level of tool calls — the natural next control plane for agent gateways. Our KB's agent-security cluster (prompt injection, data exfiltration, tool misuse) gains a concrete enforcement pattern: dual independent verifiers + policy aggregator + justification log, directly reusable in agent platform design.

## References
- Paper: https://arxiv.org/abs/2611.30360
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30360
