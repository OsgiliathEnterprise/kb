---
title: 'RePrism: Joint Request and Representation Scheduling for LLM Agent Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.32545
date: '2026-11-25'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# RePrism: Joint Request and Representation Scheduling for LLM Agent Serving

**Authors:** Xijiang Shen, Aoli Zhu, Yanbo Tan, Xiyuan Hu, Huailiang Tan


## Overview
Agentic workflows call an LLM many times per session, and when the serving system can see the workflow's dependency graph, it can exploit that visibility to reorder requests and reuse prompt content. RePrism's twist: a reusable prompt (the system prompt that specifies model behavior) can exist in **multiple representations** — e.g. under different LoRA adapters or cache states — so the scheduler must decide *both* which ready request to serve *and* which eligible representation to use, as one joint decision rather than two sequential ones.

## Problem Statement
Prior agent-serving work orders requests or manages shared resources under a fixed caching scheme. That separation is suboptimal: the value of serving a request depends on which representation of its prompt is used (cache hit vs. recompute, adapter resident vs. not), and vice versa. A pipeline that first ranks requests, then picks representations, cannot capture this coupling.

## Key Contribution
- **Joint request × representation scheduling**: candidate pairs (ready request, eligible prompt representation) are ranked by combining immediate value with an estimate of future value derived from the visible workflow graph.
- **Unified GPU-memory management**: the resource manager allocates GPU memory jointly to LoRA adapters and cached KV states, coordinating admission and eviction of both as memory pressure changes.
- **Session-aware objective**: optimization targets throughput and session completion time (SCT), not just per-request latency.

## Results
| Setting | Result vs. S-LoRA |
|---|---|
| Dynamic workload, 1.8 sessions/s | 1.37× request throughput; P95 SCT ÷ 4.10 |
| Controlled load | mean TTFT ÷ 5.26 |
| Joint scoring vs. two-phase (rank requests, then representations) | +2.7% throughput; −12.3% mean SCT |

## Relevance to Our Domain
As our platforms shift from chat serving to agent serving, the schedulable unit moves from the request to the session. RePrism demonstrates that workflow-visible dependencies plus multiple prompt representations form a richer scheduling space — and that splitting the two decisions into phases leaves measurable wins on the table. The joint LoRA-adapter + KV-cache budget is directly applicable to multi-tenant gateways that pin per-agent LoRAs while prefix-caching agent prompts. Complements our Callo (cache-miss speculative decoding) and Evolving Infra (agent-adaptive serving) notes.

## References
- Paper: https://arxiv.org/abs/2611.32545
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32545
- Related in KB: explanation-callo-invalidated-kv-speculative-decoding.md, how-to-evolving-infra-agent-adaptive-serving.md
