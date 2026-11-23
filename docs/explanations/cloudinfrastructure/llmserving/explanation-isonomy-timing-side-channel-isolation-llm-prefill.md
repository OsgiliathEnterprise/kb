---
title: 'Isonomy: Isolating Every Request from Timing Side Channels at Nearly Full-Sharing
  Throughput in Multi-Instance LLM Prefill'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.27596
date: '2026-11-23'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Isonomy: Isolating Every Request from Timing Side Channels at Nearly Full-Sharing Throughput in Multi-Instance LLM Prefill

## Overview
Prefix caching is one of the biggest cost savers in LLM serving — but a cache hit leaks information: when another tenant's prompt shares a prefix with yours, your first token arrives measurably earlier. Isonomy attacks this leak head-on, proposing a serving gateway that isolates *every* request by default (not just per-account) while still reusing a single shared prefix cache across accounts. The key insight is that you don't need to disable cache reuse; you only need to hide *hits on prefixes cached outside your sharing group* inside the request's own timing.

## Problem Statement
Providers today confine KV-cache sharing to a single account because a cross-account hit is observable through time-to-first-token. The authors argue this is insufficient under least privilege: permission to send and pay for requests should not let one request infer other requests' prompts — even inside the same account. Real scenarios make this urgent: agents fire unreviewed requests carrying private data, resellers pool many users behind one account, and stolen credentials expose the whole pool.

## Key Contribution
- A default-isolation model: each request starts isolated and must explicitly opt into a sharing group; one global cache remains shared, but only hits *within* the group are visible in timing.
- Two complementary mechanisms built on vLLM, targeting deployments where clients cannot observe each other's load:
  - **Prediction mode**: the gateway routes using only load and visible cache entries, predicts when TTFT *would* be if hidden hits missed, and gates token release until that time.
  - **Execution mode**: reserves the work a hidden hit would skip, filling it with other requests' prompts where possible.
- Evaluation on three commercial APIs showing that added prefill work was indistinguishable from a short request beyond measurement noise; direct-probe tests on 2, 4 and 8 instances kept a probe's advantage within measurement noise at both prefix lengths.
- Throughput at saturation: prediction mode retains 0.98 of unprotected sharing's throughput with account labels (vs 0.95 for account-level isolation, dropping to 0.80 when much reuse crosses accounts).

## Technical Approach
The gateway applies the deployment's routing rule to load and the request's *visible* cache entries only, effectively simulating "the instance where the request would run if hidden hits were misses." On that instance the first-token-ready time is estimated from the queue and visible prefix, and release is delayed to match. This turns a security property (hit indistinguishability) into a scheduling/leasing problem rather than a cache-disable problem.

## Results
- Probe advantage bounded within measurement noise across instance counts (2/4/8) and prefix lengths.
- 0.98 throughput retention vs unprotected sharing (prediction mode, two labeled workloads); beats per-account isolation where cross-account reuse is common.

## Relevance to Our Domain
Complements the KB's existing note on cross-tenant cache-hit leakage (2611.20291, which showed queue-shift side channels defeat naive "share globally, hide hits" defences) with a concrete gateway design and quantitative throughput costs of isolation. Directly actionable for anyone operating shared vLLM fleets, reseller gateways, or agent platforms where many tenants' prefixes overlap.

## References
- Paper: https://arxiv.org/abs/2611.27596
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27596
- Related KB note: `cloud-infrastructure/llm-serving/explanation-cross-tenant-cache-hit-leakage-llm-serving.md`
