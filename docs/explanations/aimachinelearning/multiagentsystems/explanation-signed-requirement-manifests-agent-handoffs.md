---
title: Signed but Not Safe — Requirement Integrity in Multi-Agent LLM Handoffs
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.07483
date: '2026-11-08'
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# Signed but Not Safe — Requirement Integrity in Multi-Agent LLM Handoffs

## Overview
Pavlovic, Laumüller & Kerber (2026) identify a security gap that classic prompt-injection defences structurally miss: in multi-agent pipelines, the **requirement list attached to a delegated task can be tampered with after the task is accepted**. Their key insight: adding a standard HMAC integrity check to task handoffs detects modification, yet **does not prevent re-injection of the original, validly-signed document into a different context** — integrity and context binding are two different properties.

## Problem Statement
Multi-agent LLM systems delegate goals by embedding explicit requirement lists into structured handoff objects. Existing defences focus on adversarial content *inside* prompts. None of them protects the **integrity lifecycle of the requirement document itself** — the contract that says what the downstream agent must accomplish.

## Key Contribution
- **Requirement Tampering Attack (RTA)**: an attacker adds a covert objective to the requirement list of an accepted task, piggybacking on its authority. Evaluated on three realistic pipelines, RTA reaches **0.70 average attack success rate**.
- **Requirement Integrity Protocol (RIP)**: an HMAC-authenticated **Requirement Manifest** — a signed, versioned document that makes every requirement traceable to its origin across multi-hop delegation. Tested with a four-agent pipeline plus an orchestrator.
- **Critical negative result**: HMAC verification detects tampering but does not stop re-injection of a validly signed manifest into an unintended context — authentication without context binding is insufficient.
- An **eight-dimensional integrity assessment** showing no prior method covers all dimensions.

## Technical Approach
RIP treats requirements as first-class authenticated artefacts: each delegation carries a signed manifest with versioning, so any edit is detectable and lineage is auditable. The paper's evaluation deliberately separates two threat classes: (1) modifying requirements (caught by HMAC), and (2) replaying a legitimately signed manifest elsewhere (not caught). Their experiments also reveal that agent behaviour **degrades under strict policy enforcement** — security rigidity has a capability cost.

## Results
- RTA: 0.70 average ASR across three pipelines, across diverse settings.
- RIP: effective for tamper detection and provenance; insufficient alone against context re-injection.
- Open problem stated: enforcing requirement integrity without collapsing agent capability.

## Relevance to Our Domain
This paper reshapes how we should design agent handoff protocols in our own orchestrators: sign the *task contract*, not just messages, and bind every signed contract to a session/context identifier to block replay. It complements direct prompt-injection defences (PIAtlas, INFUSE notes in this KB) by covering the delegation layer that those defences assume is trustworthy.

## References
- Paper: https://arxiv.org/abs/2611.07483
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.07483
- Related KB: `explanations/aimachinelearning/multiagentsystems/`, `explanations/aimachinelearning/agentarchitecture/`
