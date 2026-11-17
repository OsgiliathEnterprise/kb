---
title: Scaling Adaptive Prompt Injection Attacks with Agent Swarms
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.11861
date: '2026-11-17'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Scaling Adaptive Prompt Injection Attacks with Agent Swarms

## Overview
Prompt injection is the canonical attack on LLM applications, but real deployments hide behind guardrails and classifiers that single-prompt attacks struggle to bypass. This paper reframes red-teaming as a **search problem over an exponentially large adversarial prompt space** and attacks it with a **massively parallel, adaptive multi-agent system**: an agent swarm that explores attack strategies in parallel, learns from what lands, and reallocates effort accordingly.

## Problem Statement
The adversarial prompt space grows exponentially with prompt length, and defensive layers (input filters, output classifiers, system-prompt hardening) shift the effective landscape. Static or single-threaded attack generation cannot cover that space; human-in-the-loop crafting doesn't scale across models and defenses.

## Approach
- **Parallel exploration**: many agents generate and mutate injection strategies concurrently rather than sequentially refining one prompt lineage.
- **Adaptivity**: the swarm uses observed success/failure feedback to steer exploration toward promising regions (evolutionary search over attack strategies).
- **General evaluation surface**: tested against **both open-weight and proprietary models**, across several distinct defenses.

## Results
- **Up to 92% attack success rate** across the evaluated models and defenses.
- **2× higher ASR than previous methods** on the same settings.
- The paper also analyzes the **scaling behavior of ASR** (how success grows with swarm effort) and **cross-model transferability** of discovered strategies — strategies found against one model carry over to others.

## Defensive Implications
- Defenses evaluated only against single-shot or hand-crafted injections are **under-tested**; assume an adversary with parallel search budget.
- Transferability results mean a bypass found on one model is a warning for the rest of the fleet — defense-in-depth, not per-model patching.
- The same swarm architecture is available to defenders: use it continuously as an automated red-team before attackers do.

## References
- Paper: https://arxiv.org/abs/2611.11861
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.11861 (0 citations at ingest, 2026 paper)
- Related: [[Beyond Prompt Injection: The Tool Update Gap in LLM Agent Security]]
