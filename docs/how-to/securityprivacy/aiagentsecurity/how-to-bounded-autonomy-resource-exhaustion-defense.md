---
title: 'Bounded Autonomy: A Trust-Anchored Defense Against Resource-Exhaustion Attacks
  on Tool-Augmented LLM Agents'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.30383
date: '2026-11-25'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# Bounded Autonomy: A Trust-Anchored Defense Against Resource-Exhaustion Attacks on Tool-Augmented LLM Agents

## Overview
Chen, Lyu, Li, Chen & Shan (arXiv:2611.30383, cs.CR, submitted 2026-11-23) target a specific, under-defended attack class against tool-augmented LLM agents: **resource-exhaustion attacks** that inflate token spend. Their answer, *Bounded Autonomy*, is a trust-anchored, closed-loop defense framework with four deterministic runtime phases — a shift from prompt-level safeguards toward accountably *enforced* budgets.

## Problem Statement
Adversaries can drain an agent's token budget through three amplification channels: persistent **context amplification** (stuffing the conversation), **large tool-output amplification** (tools returning oversized payloads), and **error-induced agentic loops** (repeated failing retries). Existing general-purpose agent defenses use prompt-level guards or coarse resource limits, lack *deterministic* runtime control over cumulative token consumption, and handle poorly the tension between fault recovery and re-running resource-consuming steps.

## How-to: Deploy the Four-Phase Closed-Loop Defense
The framework is specified as a pipeline you can map onto an agent orchestrator:

1. **Certificate-guided orchestration with deterministic handoffs.** Only trusted nodes carrying certificates participate in execution; control handoffs between stages are deterministic, so the orchestration path is analyzable before spending anything.
2. **Calibrated one-time node budgeting.** Assign each execution node a budget calibrated *once*, covering **both input and output tokens across all model invocations** — not per-call limits that an amplifier can multiply.
3. **Gateway-based runtime enforcement.** A gateway enforces the budgets at runtime rather than trusting agents to self-limit; this is where the deterministic token accounting lives.
4. **Bounded recovery via a shared, non-resettable recovery pool.** Fault recovery is allowed but draws from a global pool that cannot be reset — an attacker driving error loops cannot farm infinite retries, while benign tasks still get their recovery allowance.

## Key Contribution
- First systematic defense framework aimed specifically at agent resource-exhaustion (vs. broad agent-security frameworks).
- Deterministic, token-exact accounting (input + output, all invocations) instead of coarse limits.
- Explicit mechanism (non-resettable recovery pool) to balance fault tolerance against repeated-consumption abuse.

## Results
Experiments show the framework bounds cumulative token consumption, mitigates the three resource-amplification attack families, and preserves benign task utility — under the stated trusted-execution assumptions (certificates and honest infrastructure).

## Relevance to Our Domain
Directly operational for anyone running production agent platforms: it reframes agent DoS defense from "ask the model nicely" to an infrastructure control plane (certificates, gateways, budgets) — the same posture as API gateway rate-limiting, but token-semantics-aware. Complements our KB notes on agent sandboxing and denial-of-wallet risks.

## References
- Paper: https://arxiv.org/abs/2611.30383
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30383
