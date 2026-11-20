---
title: 'TripleKV: Predict, Prefetch, Protect -- KV Cache Management for AI Agents'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.25112
date: 2026-11-20
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# TripleKV: Predict, Prefetch, Protect -- KV Cache Management for AI Agents

## Overview
LLM agents interleave inference with tool execution and repeatedly re-query with a *growing* context. At high concurrency the aggregate KV-cache working set reaches **hundreds of GiB**, far beyond GPU HBM. Standard tiered serving evicts idle KV blocks to slower tiers, so a "returning" agent (one whose tool call just finished) pays expensive storage retrievals on the critical path before its next token. TripleKV is a three-tier (GPU / host DRAM / SSD) KV manager that hides those retrievals by exploiting the structure of agentic workloads.

## Problem Statement
The key observation that makes agents different from chat serving: for the next inference request, **the set of needed KV blocks is known in advance** (the context is just the previous context plus the tool result) — only the *time of reuse* is uncertain. Existing tiered KV systems treat retrievals as unpredictable demand misses and put SSD reads on the request critical path.

## Key Contribution
- **Tool-aware latency prediction:** estimates when each in-flight tool call will complete, so the KV blocks that call's agent will need next are **prefetched from SSD into host DRAM ahead of time** — during the tool execution window that is otherwise wasted.
- **Prefetch to DRAM, not GPU:** deliberately avoids reserving scarce GPU memory and avoids interfering with concurrent inference, unlike GPU-direct prefetch schemes.
- **Protect (DRAM efficiency):** (1) eliminates duplication between GPU-resident blocks and their DRAM copies; (2) a **victim-cache** mechanism refills blocks from SSD the moment they are evicted from GPU memory, keeping them warm before they are ever requested.
- **Results:** across data, web, and coding agents, requests needing critical-path SSD reads drop from **45–76% to under 10%**; P95 TTFT drops up to **49%** vs vLLM extended with DRAM+SSD KV tiers; **1.5–7× lower P95 TTFT** than recent agent-aware systems.

## Technical Approach
Three ideas map to the name: *predict* (tool-completion time model drives prefetch scheduling), *prefetch* (SSD→DRAM staging during tool windows, never occupying HBM), *protect* (dedup GPU/DRAM copies + victim-cache refill-on-eviction keeps DRAM populated with blocks likely to be recalled). The known-set/unknown-time asymmetry of agentic KV reuse is what makes prediction-based prefetch effective where generic LRU-style tiering fails.

## Relevance to Our Domain
Direct evolution of the KB's KV tiering notes: KVCompass covers discovery, MoE-CORE covers expert offloading, Stint covers preemption — TripleKV adds the **agent-aware timing dimension**: tool calls are free scheduling windows for cache warmth. Any serving platform running coding/data agents at concurrency should model tool latency and prefetch accordingly; the &lt;10% critical-path SSD read target is a concrete SLO-relevant metric.

## References
- Paper: https://arxiv.org/abs/2611.25112
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25112
