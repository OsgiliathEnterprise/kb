---
title: Callo — Serving Cache-Miss Requests with Speculative Decoding on Invalidated
  KV under Prefill-Decode Disaggregation
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
In prefill/decode (PD) disaggregation, cache-miss requests suffer a split critical path: prefill fills the KV cache while decode waits idle. Existing designs close that gap by *prefill-speculating* draft tokens — but those draft KV entries are written back as "invalidated KV". Callo shows this invalidated KV is not dead weight: under a unified position-addressed KV organization, it can serve as the speculative-decoding draft for the **same** request. Two serving instances run concurrently — the original PD pipeline plus a speculating pipeline — and the faster one's output wins, with a KV-aware restoration protocol keeping the two views consistent.

## Problem Statement
Cache misses make the prefill stage dominant: decode sits idle and speculative decoding (SD) only accelerates the short decode phase. Meanwhile, invalidated KV produced by prefill-speculation has no consumer and is simply ignored. The result is a split critical path that neither PD disaggregation nor SD alone fixes.

## Key Contribution
- **First systematic exploitation of invalidated KV**: repurposing it as SD draft KV for the same request, so SD accelerates the *prefill-dominated* phase instead of only the decode-dominated one.
- **Unified position-addressed KV organization**: an abstract logical layer over the physical blocks so original and speculative KV stay mutually visible, without modifying either engine's physical layout.
- **Dual-instance racing**: concurrent original-PD + speculating pipelines; whichever finishes first supplies the output.
- **KV-aware restoration protocol**: guarantees consistency between the racing KV views.

## Results
On vLLM, A100 and H100, Qwen3-8B/14B/32B:
- TTFT reduction up to **3.7×**
- throughput improvement up to **2.1×**
- up to **2.3×** lower decode latency and **3.4×** faster prefill
- energy per token reduced up to **58.2%**

## Relevance to Our Domain
PD disaggregation (DistServe/Splitwise-style) is now the default architecture for GPU serving platforms; cache-miss handling is the main TTFT lever for prefix-cache-unfriendly workloads. Callo's "race both pipelines, keep the winner" pattern and its reuse of garbage KV is a concrete design idea for serving stacks like vLLM/SGLang and for our GPU fleet cost/energy analysis. See also [[reference-kvcompass-prefix-cache-discovery]] and [[explanation-mosaickv-dynamic-2d-kv-cache-compression]] in this topic.

## References
- Paper: https://arxiv.org/abs/2611.18459
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18459
