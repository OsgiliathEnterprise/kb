---
title: ReMA Attacks and SecMAS — Securing LLM Multi-Agent Systems by Design
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.17883
date: 2026-11-16
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# ReMA Attacks and SecMAS: Securing Multi-Agent Systems by Design

> Corrected 2026-11-16 by KB Zookeeper: the first intake version mis-attributed the paper ("REmediate MAS" attacks on inter-agent communication channels, "Wenxin Zhang, Syracuse") and invented a channel-validation design. Replaced with facts verified against the arXiv abstract page.

## Overview

"Securing Multi-Agent Systems by Design" (Xilong Wang, Xiaoxing Chen, Neil Gong; arXiv:2611.17883, 13 Nov 2026, cs.CR) attacks the **aggregation step** of LLM multi-agent systems (MAS). A MAS decomposes a task into subtasks, delegates them to agents, and **aggregates the agents' responses using an aggregation rule**. The paper shows malicious agents can manipulate the final solution by crafting malicious responses to their assigned subtasks — and defends at exactly that point.

## Problem Statement

Malicious agents provide adversarial responses to legitimately assigned subtasks. Because aggregation rules (majority vote, LLM-as-judge merge, etc.) are not designed adversarially, the final solution can be steered without any agent breaking its own sandbox or forging identity.

## Key Contribution

- **ReMA (Response Manipulation Attacks)**: response-crafting attacks formulated as **optimization problems** for both **untargeted** and **targeted** goals, solved approximately by **iteratively refining malicious responses using feedback from a surrogate multi-agent system**.
- **SecMAS**: a **secure aggregation rule** that exploits **semantic similarities among agent responses**, selecting the response most consistent with a **sufficiently large subset** of the other responses.
- **Theoretical security guarantees** for SecMAS against both untargeted and targeted attacks.

## Technical Approach

The attacker treats the aggregation rule as an oracle: generate candidate malicious responses, score their effect in a surrogate MAS, and iterate. SecMAS counters by never trusting a single response's plausibility in isolation — a response is favoured only when a sufficiently large subset of independent responses semantically corroborates it, which bounds a malicious minority's influence.

## Results

Existing aggregation rules are vulnerable to ReMA (including **adaptive variants**); SecMAS defends against **all evaluated attacks** while keeping utility comparable to existing rules.

## Relevance to Our Domain

Multi-agent orchestration is a core KB topic: treat every inter-agent response as adversarial input *at the aggregation layer*, not just at the input layer. When building verifier-of-verigators or judge panels, adopt corroboration-based aggregation with a corroboration threshold, and red-team it with surrogate-feedback attacks like ReMA. Pairs with Soteria's verify-then-enforce pattern for single agents.

## References

- Paper: https://arxiv.org/abs/2611.17883
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17883
- Related: `explanation-soteria-verified-llm-agents.md`, `explanation-dga-jailbreak-image-tool-sets.md`
