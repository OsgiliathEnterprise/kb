---
title: Poisoning Self-Evolving Security Policies in LLM Agents
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.33385
date: '2026-11-27'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Poisoning Self-Evolving Security Policies in LLM Agents

**Authors:** Aymen Noor, Honglu Jiang (arXiv 2611.33385, submitted 2026-11-24, primary cs.CR)

## Overview
Self-evolving agent defenses learn reusable security policies from observed attacks — a pattern increasingly adopted in production agent harnesses. Noor & Jiang show that **the learning loop itself is an attack surface**: a single successful prompt-injection episode can trick the defense (SED, evaluated on AgentDojo) into synthesizing an over-broad policy that refuses *legitimate* user requests afterwards. This is a denial-of-service-on-yourself failure mode where the defender's own adaptivity becomes the weapon.

## Problem Statement
Adaptive defenses assume that learning from attacks strictly improves security. But if an attacker can influence *what* the defense learns, the defense can be steered into availability failures while still looking "secure" (the original injection is still blocked). No prior work had tested policy synthesis as an attack surface.

## Key Contribution
- **Policy poisoning via one injection episode**: a crafted prompt makes SED learn an over-broad refusal policy. Across 10 Nemotron runs, *every* poisoned run over-refuses at least one legitimate task.
- **Stealthiness**: performance on unrelated tasks is unchanged, and the original prompt-injection defense remains effective — the damage is only visible when legitimate traffic is tested.
- **Transfer limits**: the attack transfers to gpt-oss-120b, but only if the initial prompt injection succeeds on the target; agents that resist the underlying injection neutralize the whole chain.
- **Negative results matter**: direct integrity attacks on SED's judge, policy synthesis, retrieval and organization components all *failed* in the evaluated settings — over-refusal is the primary exploitable failure mode found.
- **Self-poisoning**: the same over-refusal can arise without an attacker, from false-positive harm judgments feeding the learning loop.

## Technical Approach
The authors operationalize SED (a self-evolving defense that distills observed attacks into reusable policies) inside the AgentDojo benchmark. An attacker episode is engineered so the judge classifies it as harmful; the synthesized policy generalizes too far and later blocks benign tasks. Defense-side experiments add a contrastive policy synthesis variant and an automatic "broadness-check" gate before a learned policy is activated.

## Results
- 10/10 poisoned Nemotron runs over-refuse ≥1 legitimate task.
- Unrelated-task accuracy unchanged; original injection defense still works.
- Contrastive synthesis + broadness gate substantially reduce over-refusal **without eliminating it**, with no observed security regression in the evaluated settings.

## Relevance to Our Domain
Agent-harness hardening is a core KB theme (see [[explanation-caplite...]]-style defenses and the agent-skill security notes). This paper adds a rule for anyone deploying self-learning guardrails: **treat learned policies as untrusted input**, gate them by specificity checks, and monitor legitimate-task refusal rates as an availability SLA — not just attack-block rates. It also warns that the injection → policy-learning chain compounds risk: defense quality inherits the base model's injection robustness.

## Practical Checklist (derived)
1. Audit learned policies for over-broad refusal patterns before activation (broadness gate).
2. Track false-positive harm judgments — they can poison the policy store without any attacker.
3. Keep a regression suite of legitimate tasks specifically to detect over-refusal drift.
4. Do not let the policy judge share failure modes with the agent's injection defenses.

## References
- Paper: https://arxiv.org/abs/2611.33385
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33385
- Related in vault: security-privacy/ai-agent-security/ (AutoPI, PIPETTE, Evolution Under Fire)
