---
title: 'Callo: Serving Cache-Miss Requests with Speculative Decoding on Invalidated
  KV under Prefill-Decode Disaggregation'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.18459
date: '2026-11-16'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Callo: Serving Cache-Miss Requests with Speculative Decoding on Invalidated KV under Prefill-Decode Disaggregation

## Overview
Agent sessions involve frequent context edits, which effectively invalidate cached KV state and force the affected requests to wait for a full re-prefill before decoding can begin. Callo is a prefill/decode (PD) disaggregated serving system that turns this invalidated KV into an asset: it reuses it as speculative-decoding drafts for the cache-miss request itself, then verifies the drafts against the exact KV produced by the completed prefill before committing any token. Drafting overlaps the exact re-prefill, so decode capacity that would otherwise idle during the re-prefill wait is put to work.

## Problem Statement
Under PD disaggregation, a cache miss creates a split critical path: the prefill instance does the re-prefill while decode instances sit idle, and classic speculative decoding only accelerates the short decode phase — not the prefill-dominated wait. The KV entries invalidated by context edits were previously discarded even though they still encode most of what the request will need.

## Key Contribution
- **Invalidated KV as speculative draft state**: the discarded KV from pre-speculation/context-edit invalidation becomes the draft source for speculative decoding of the same request.
- **Verify-before-commit**: every drafted token is verified against the exact KV after prefill completes, preserving output equivalence with non-speculative execution.
- **Opportunistic speculation scheduling**: speculation is scheduled while decode instances are underutilized and preempted when drafts are likely not to be accepted, protecting decode capacity.
- **Drafting overlapped with exact re-prefill** plus a decode-side admission/policy layer and serving integration into a disaggregated stack.

## Results
Evaluated on a two-GPU testbed replaying SWE-agent sessions across three model families:
- All-request speedups of **1.05–1.19× over vLLM at moderate load**.
- Cluster-scale simulations driven by real-world traces show the gains carry over to larger deployments across different prefill:decode allocations.

## Relevance to Our Domain
PD disaggregation is the default architecture for GPU serving platforms; agent workloads with heavy context editing (SWE-agent-style sessions) are exactly the case where prefix caches churn and re-prefill dominates TTFT. Callo's "recycle invalidated KV as speculation, verify before commit" pattern is a concrete design idea for vLLM/SGLang-class serving stacks and for sizing P:D pools. See also [[reference-kvcompass-prefix-cache-discovery]] and [[explanation-mosaickv-dynamic-2d-kv-cache-compression]] in this topic.

## References
- Paper: https://arxiv.org/abs/2611.18459
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18459
