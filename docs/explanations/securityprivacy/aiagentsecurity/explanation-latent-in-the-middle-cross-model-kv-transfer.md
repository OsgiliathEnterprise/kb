---
title: 'Latent-in-the-Middle: On the Security of Cross-Model Latent Communication
  in Multi-Agent Systems'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.34278
date: 2026-11-26
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Latent-in-the-Middle: On the Security of Cross-Model Latent Communication in Multi-Agent Systems

## Overview
Cross-model KV-cache transfer lets a target LLM consume a source model's internal Key-Value cache through a learned mapper, skipping re-encoding of shared context and saving prefill compute. This paper shows that the efficiency trick silently voids the target model's safety alignment: a context the target never encoded itself carries the *source's* alignment, and the handoff becomes a new attack surface.

## Problem Statement
Latent communication (sharing internal representations instead of natural language) is being adopted in heterogeneous multi-agent systems for bandwidth and prefill savings. But safety alignment is trained to hold for text the model encodes itself. What happens when the model instead ingests a foreign KV cache? Nobody had systematically characterized the attack surface of that handoff.

## Key Contribution
- **Chasm**, a framework that characterizes cross-model handoff attacks across three attack surfaces: the **source model**, the **mapper**, and the **handoff mechanism** itself.
- Empirical evidence that latent handoffs break both safety alignment and prompt-injection defenses:
  - A target that natively obeys only **0.4%** of benchmark prompt injections follows up to **44.2%** when the context arrives via a mapper from a malicious source model.
  - Jailbreak success rises by up to **24.6 percentage points** from transfer alone within a model family, and zero-shot attacks gain up to **69.2 pp**.
  - White-box optimization *through the mapper* reaches **92.5%** attack success vs **37.5%** for ordinary GCG on the same target.
- A defense: a lightweight **target-side cache guard** that corrects transferred caches to restore the target model's refusal behavior, considerably mitigating these attacks.

## Technical Approach
Rather than attacking the model's text interface, the attacker controls the latent channel: poison the source model's context, tamper with the mapper, or exploit the handoff path itself. Because gradients flow through the learned mapper, white-box optimization over the cache is dramatically more effective than text-space attacks. The proposed mitigation stays on the target side (no trust in source/mapper required), aligning with a zero-trust view of agent-to-agent interfaces.

## Relevance to Our Domain
As our agent infrastructure adopts prefill-sharing and cross-model caching (KV reuse is a hot serving optimization), this work defines a **new class of MITM-style attacks on the latent channel**. Practical takeaway: treat any KV/latent handoff from another model as untrusted input; deploy target-side cache validation; do not assume the consumer's alignment covers the producer's context.

## References
- Paper: https://arxiv.org/abs/2611.34278
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34278
