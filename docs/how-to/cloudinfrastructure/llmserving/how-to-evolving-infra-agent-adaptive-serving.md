---
title: 'Evolving Infra: Agent-Adaptive LLM Serving at Scale'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.12304
date: '2026-11-17'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Evolving Infra: Agent-Adaptive LLM Serving at Scale

## Overview
How to run a prefill/decode (PD) disaggregated LLM serving fleet that **adapts to agentic workloads at runtime** instead of assuming chat-like traffic. Evolving Infra (Georgia Tech / UIUC, with authors including Ion Stoica and Song Han) identifies where prefill–decode disaggregated serving mismatches agent traffic, then fixes each mismatch with a concrete infrastructure component.

## Problem Statement (measured mismatches)
Agent traffic differs from chat: sessions switch phases, reuse long contexts, and shift demand over time. The paper's production study of **11.7 million requests** shows user-triggered task starts follow workday rhythms while automatic/agent-driven traffic varies differently — static fleet assumptions decay. Three concrete failures motivate the design:
1. **Costly phase switches** — in PD-disaggregated engines, an agent flipping between prefill-heavy and decode-heavy phases forces expensive engine/role switches.
2. **Misestimated compute demand** — prefill vs decode split planned for chat traffic misallocates GPUs for agents.
3. **Misjudged KV reuse** — routers and evictors unaware of agent context management evict exactly the KV prefixes agents will reuse.

## Procedure (the design recipe)
1. **Symmetric engines for online phase switches**: deploy prefill and decode capabilities symmetrically so an agent session switching phase does not pay an engine reconfiguration/switch penalty.
2. **Shared host-memory KV pool**: keep reusable KV beyond per-GPU HBM in a cluster-visible host-memory pool (fetch-through design evaluated against adding latency); agents' reused contexts survive eviction decisions made GPU-locally.
3. **Agent-aware cluster-wide KV directory**: index KV blocks fleet-wide and score routing on actual reuse potential (what a plain KV index does *not* record matters — encode agent context structure into the routing/eviction signals).
4. **Agent-adaptive compute allocation**: adjust the prefill/decode compute split at runtime from observed agent workload mix rather than a static split.

## Results
- Workloads: **mini-SWE-agent on PutnamBench** (decode-heavy, single agent hammering one session) and **Anthropic's computer-use agent on OSWorld 2.0**; models **GLM-5.2 and Kimi K2.6**.
- On **up to 256 GB300 GPUs**: reduces **mean end-to-end request latency and P95 TTFT by up to 4.1× and 14× over NVIDIA Dynamo**, NVIDIA's production serving framework; gains hold in simulation at **3,072 GPUs** (with open-loop arrivals and asymmetric prefill/decode parallelism).

## Gotchas
- The 14× P95 TTFT win is against Dynamo's chat-oriented defaults on agent workloads — expect smaller deltas if your traffic is actually chat-like.
- Host-memory KV pooling adds a fetch-through latency path; the paper evaluates why fetching through the pool adds latency — measure your KV reuse rate before adopting.

## References
- Paper: https://arxiv.org/abs/2611.12304
- Related: [[ROCm InferaSim: Cut LLM Serving Trial Costs and Deploy the Best Configuration]], [[ServerBench: How can your coding agents design specialized LLM serving systems?]]
