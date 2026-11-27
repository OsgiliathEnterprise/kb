---
title: 'Callo: Serving Cache-Miss Requests with Speculative Decoding on Invalidated
  KV under Prefill-Decode Disaggregation'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.18459
date: '2026-11-24'
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

## Follow-up & Reproduction (checked 2026-11-24)

- **Authors**: Jianjun Ou and Matthew Lentz; v1 posted 2026-11-13 (arXiv cs.DC). No official code release.
- **Independent reproduction**: [`tatra-labs/stale-kv`](https://github.com/tatra-labs/stale-kv) (MIT-licensed, laptop-scale, Qwen3-0.6B/1.7B on a SWE-smith SWE-agent trajectory shard) confirms the core mechanism and several specifics:
  - **Workload reproduces**: ~81% cache-miss rate under L5 `LastNObservations` masking, median re-prefill ~2.9k tokens — close to the paper's 79% / 3.1k for Llama-3.3-70B.
  - **Drafting on stale KV crushes naive baselines**: prompt-lookup n-grams and valid-prefix-only drafting accept near-zero drafts, vs 11.5–16.6 accepted of 32 for stale-KV drafting.
  - **RoPE key re-rotation matters**: skipping re-rotation of reused runs drops whole-window acceptance from ~21–32% to 6–9%.
  - **Scale caveat**: whole-window acceptance is only 15–32% at 0.6–1.7B vs the paper's 65–70% at 70B — the benefit appears strongly model-size-dependent, and the repo does not establish where the knee sits.
  - **Gotcha**: chat templates that mutate the previous reply (Qwen3's empty `<think>` block) silently stale the KV even before masking; normalizing the reply to its in-history form substantially lifts acceptance.
  - What was *not* reproduced: real disaggregated serving (no vLLM / KV transfer / preemption) — all latency figures there are modelled, and the paper's speedup claims should be treated as unreplicated.

## References
- Paper: https://arxiv.org/abs/2611.18459
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18459
- Third-party reproduction: https://github.com/tatra-labs/stale-kv
