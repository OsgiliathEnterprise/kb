---
title: 'BlockJack: Cross-Tenant Redirection Fault Attacks on Paged KV Cache Address
  Translation in LLM Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.25945
date: 2026-11-20
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# BlockJack: Cross-Tenant Redirection Fault Attacks on Paged KV Cache Address Translation in LLM Serving

## Overview
BlockJack (Block Hijack) is the first fault attack that targets the *mapping* layer of the paged KV cache in LLM serving frameworks rather than the cache contents themselves. Paged serving engines like vLLM maintain block tables — software-managed analogues of OS page tables that map each request's logical KV blocks to physical KV blocks. By bit-flipping block-table entries (demonstrated with Rowhammer), an attacker redirects a victim request's KV reads to blocks belonging to another tenant, achieving both confidentiality and integrity violations without touching model weights, prompts, or cached states.

## Problem Statement
Prior fault attacks on LLM inference focused on the data plane: corrupting model weights or KV-cache values. The control plane — the address translation that decides *which* physical block each request reads — had not been examined, even though it is security-critical serving metadata in multi-tenant deployments, and fault attacks (Rowhammer) have a long history of exploiting OS page tables to redirect memory accesses.

## Key Contribution
- First fault attack on KV-cache address translation in LLM serving (control-plane, not data-plane).
- Formal characterization of when corrupted redirect targets are predictable in vLLM's paged KV-cache mapping.
- Two demonstrated violations: **confidentiality** (victim context leaks into the attacker's response) and **integrity** (attacker-supplied context silently steers the victim's answers).
- Physical feasibility validated with Rowhammer; assignment validation evaluated as a defense.
- Responsible disclosure: vLLM and Sonar confirmed the vulnerability; the proposed patches were reviewed and validated by the authors.

## Technical Approach
The attack corrupts block-table entries so that a request's logical KV blocks resolve to physical blocks assigned to another tenant's request. Because neither the model parameters, the prompts, nor the KV values are modified, the resulting responses still look self-consistent. The authors study how topic proximity, intra-topic divergence, and model behavior shape the steered responses. Evaluation spans seven models from the Qwen, Llama, Gemma, and Phi families.

## Results
- On a 248-scene medical benchmark, the integrity attack causes up to **41.1%** of responses to recommend less urgent care — while still appearing consistent with the victim's question.
- A faulted mapping exposes victim context across tenants across the evaluated model families.
- Assignment validation (checking block-table mappings) is shown to be a viable mitigation path.

## Relevance to Our Domain
Multi-tenant LLM serving has an OS-like memory-management substrate that inherits OS-class threats. This parallels earlier findings on cross-tenant cache-hit leakage and KV bit-flip task failures in this KB: serving-framework internals (block tables, prefix caches) are now first-class attack surface. Operators running shared vLLM fleets should track the vendor patches and consider isolation/monitoring of KV metadata.

## References
- Paper: https://arxiv.org/abs/2611.25945
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25945
- Related in KB: `explanation-cross-tenant-cache-hit-leakage-llm-serving.md`, `explanation-kv-cache-bit-flip-silent-task-failures.md`
- Background: vLLM PagedAttention design docs (https://docs.vllm.ai/en/latest/design/paged_attention/)
