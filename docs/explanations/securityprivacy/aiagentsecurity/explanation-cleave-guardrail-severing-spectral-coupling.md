---
title: 'Cleave: Severing Guardrails and Auditing Spectral Coupling in Open-Weight
  LLMs'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27426
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Cleave: Severing Guardrails and Auditing Spectral Coupling in Open-Weight LLMs

## Overview
Cleave is a weight-surgery technique that surgically strips safety guardrails from open-weight LLMs. Rather than prompt-level jailbreaking, it locates refusal behavior in parameter space and removes it directly, while introducing a new *spectral coupling* audit that measures how entangled safety behavior is with the model's reasoning geometry.

## Problem Statement
Safety alignment in post-trained open-weight models is a thin layer over the pretrained base. Existing removal attacks (abliteration) rely on coarse, global linear concepts and therefore either fail to disable refusal or damage general capability. The open-weight supply chain has no rigorous, quantitative way to certify whether a model's guardrails remain intact after third-party fine-tuning.

## Key Contribution
- A surgical removal method that exploits **anisotropic, high-frequency structure** of safety signals, replacing coarse global linear-concept edits.
- A **spectral coupling audit**: a quantitative measure of how entangled safety behavior is with general reasoning — higher coupling means removal costs more capability.
- A large-scale audit of the open-weight ecosystem: **389 models, 11 architectural families**.

## Technical Approach
The method treats refusal as a high-frequency component in parameter space rather than a single direction, enabling targeted edits that spare reasoning circuitry. The audit combines the removal attack with spectral analysis: if a model can be "cleaved" at zero validation-loss cost, its alignment was shallow from the start.

## Results
Across 10 model families, Cleave disables refusal **without validation loss** on every family. **17 of 389 audited models show pre-existing, zero-cost alignment decay** — guardrails already effectively removable in publicly distributed checkpoints. The authors release the tooling as an auditing instrument for the open-weight supply chain.

## Relevance to Our Domain
Sets the threat model for any pipeline that pulls third-party open-weight models: guardrail integrity must be *verified*, not assumed, and this note's audit metric is a candidate check in our model-intake process. Pairs with DistDNA (provenance) as the "what is it / is it tampered with" pair of supply-chain controls.

## References
- Paper: https://arxiv.org/abs/2611.27426 (cs.CR, 2026-11-26)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27426
- Related: explanation-distdna (how-to-distdna-lm-fingerprinting-stochastic-decoding.md), explanation-open-weight-model-provenance.md
