---
title: Adaptation or Poisoning? Security Risks of Conversational Test-Time Learning
  in Large Language Models
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.29532
date: '2026-11-24'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Adaptation or Poisoning? Security Risks of Conversational Test-Time Learning in Large Language Models

## Overview
Test-time learning (TTL) lets an LLM adapt during deployment: a **lightweight adapter** is updated by minimizing next-token prediction loss on the inputs it receives. When those updates **persist across conversation turns**, every user query plays a double role — the request answered this turn *and* training data for later turns. The paper shows an attacker who controls the query stream can steer the adapter's parameter updates and **weaken safety alignment through ordinary chat**, and demonstrates it with **P-TAP** (Progressive Test-Time Adaptation Poisoning).

## Threat Model
- **Query-only, multi-turn**: the attacker interacts with a TTL-enabled chat service like any user — no weights, no gradient access.
- The attack surface is the service's **own adaptation mechanism**: legitimate per-session learning is indistinguishable, from the model's perspective, from adversarial conditioning.

## P-TAP Mechanism
1. **Escalating query sequence**: a series of gradually more adversarial queries shapes the session adapter **turn by turn**.
2. **The final harmful request is deliberately excluded from adaptation**: it is answered under the accumulated poisoned state, so the single most dangerous query never trains the model — it only harvests the poisoned adapter.
3. This "answer without adapt" trick is what separates P-TAP from naive multi-turn jailbreaks: the harmful payload stays out of the gradient path.

## Results
- **Four open-weight instruction-tuned models.** Enabling adapter updates raises attack success rate by **+13.00 points on average under greedy decoding** and **+22.25 points under best-of-10 sampling**, versus matched control sessions receiving identical queries without updates.
- **Causal ablation**: answering the adversarial queries but adapting on unrelated text — or on benign text about the same topic — **removes most of the increase**, confirming it is the adaptation on the attacker's queries, not exposure to their content, that does the damage.
- **Defence asymmetry**: an **incoming-query screener flags every attack stream before the final request** (but screening content is exactly what TTL claims to sidestep), while a **perplexity-based detector of unsafe adaptation data flags none** of the successful attacks — adversarial queries look like normal text.

## Why It Matters (Explanation)
The paper locates the vulnerability in a mechanism class, not a model: any deployment that keeps gradient updates across turns converts conversation into training data, and training data is an injection channel. The practical guidance follows the ablation: what matters is **what the adapter is allowed to learn from**, not what it is allowed to say — so defences belong on the adaptation path (curating or gating adaptation data, session-scoped adapters, screening what enters the gradient) rather than only on the output path. Perplexity-style filters are shown to be structurally blind to this attack.

## References
- Paper: https://arxiv.org/abs/2611.29532
- Related in KB: `explanation-forgetmenot-memory-poisoning-commercial-agents.md` (memory-state poisoning), prompt-injection notes under security-privacy/ai-agent-security
