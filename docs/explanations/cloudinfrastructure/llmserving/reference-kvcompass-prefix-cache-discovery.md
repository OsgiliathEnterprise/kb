---
title: 'KVCompass: A Discovery Plane for Internet-Scale Prefix Cache Sharing in LLM
  Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: 'arXiv: KVCompass: A Discovery Plane for Internet-Scale Prefix Cache Sharing
  in LLM Serving (arXiv:2610.24179)'
source_url: https://arxiv.org/abs/2610.24179
date: 2026-10-25
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# KVCompass: Discovery Plane for Internet-Scale Prefix Cache Sharing

## Overview

KV cache reuse is one of the most effective ways to cut LLM inference cost, but its benefits today are confined to a single cluster. When one provider serves the same model from geographically distributed regions, each region repeatedly **re-prefills the same popular prefixes**, wasting GPU time and inflating time-to-first-token. This paper (cs.DC, Oct 2026; accepted at POMACS) tackles the missing piece: **discovering which worker currently holds a reusable KV cache for a request's prefix** — and shows this discovery problem is structurally harder than conventional distributed lookup.

## Problem Statement

In DHT-style object lookup, an object's location is a *deterministic function of its key*, so discovery is trivial. KV caches are different: they are **created on the workers that serve requests**, and the set of workers holding a given prefix **changes with every subsequent request and every eviction**. So the holder set is dynamic, and the cache's identity cannot be pinned to a placement rule. The paper's thesis: **KV cache discovery requires decoupling cache identity from cache placement** — you need a discovery plane, not a hash ring.

## Key Contribution

- **A discovery plane for Internet-scale KV cache sharing**: a global index that answers "which workers hold (part of) this prefix right now" without moving the caches themselves.
- **Variable-length prefix lookup** with **constant-time local table reads at the edge** — the routing decision for each request is a local O(1) table lookup at the edge, not a global query.
- **Routing policy**: each request is forwarded to the worker that best balances **KV cache reuse vs. load vs. network distance** — reuse is traded explicitly against load and hop distance, not maximized blindly.
- **Evaluation at two scales**: a 64-worker geo-distributed simulation and a **14-worker, three-continent real-machine testbed**.

## Results

| Metric | Result vs. baselines |
|--------|---------------------|
| P99 TTFT | **1.3×–14× lower** |
| P99 end-to-end latency | up to **3.7× lower** |
| Throughput | up to **4.7× higher** |
| Peak load balance | within **2% of the Oracle floor** (perfect-knowledge lower bound) |

## Relevance to Our Domain

This extends the single-cluster prefix-caching notes in this KB (see the PrefixBench H100 note) to the multi-region regime, and the identity-vs-placement separation is the design principle worth keeping: any future cross-cluster KV cache layer we build needs a discovery index with local edge lookup, because DHT placement does not apply to request-created caches. The oracle-near load balance within 2% suggests the routing policy is close to optimal for its inputs — a useful property when composing with existing autoscaling.

## References

- Paper: https://arxiv.org/abs/2610.24179
- Related: PrefixBench (H100 prefix-reuse TTFT) — `AI-LLM/LLM-Infrastructure/explanation-prefixbench-h100-prefix-reuse-ttft.md`
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.24179

## Further Reading (added 2026-10-25 by KB Zookeeper audit)

- [Mooncake: A KVCache-centric Disaggregated Architecture for LLM Serving (arXiv:2407.00079)](https://arxiv.org/abs/2407.00079) — closest prior work: prefill/decode disaggregation with a global KVCache pool; KVCompass extends this regime with an explicit discovery plane
- [SGLang: Fast and Expressive LLM Inference with RadixAttention (LMSYS)](https://www.lmsys.org/blog/2024-01-17-sglang/) — single-cluster automatic prefix-cache reuse via a radix tree; the baseline KVCompass generalizes across workers
- [Inside vLLM: Anatomy of a High-Throughput LLM Inference System (vLLM blog)](https://vllm.ai/blog/2025-09-05-anatomy-of-vllm) — prefix caching as a subsystem inside a production engine; includes LMCache for KV offload
