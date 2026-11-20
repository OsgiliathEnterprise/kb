---
title: 'Held While Waiting: What LLM Agent Sessions Reserve on Serverless and Agent
  Runtimes'
diataxis: Explanation
domain: ai-machine-learning
topic: resource-optimization
source: arXiv
source_url: https://arxiv.org/abs/2611.26480
keywords:
- knowledge-base
- resource-optimization
- ai-machine-learning
- explanations
---
# Held While Waiting: What LLM Agent Sessions Reserve on Serverless and Agent Runtimes

## Overview
A measurement study of resource *reservation* (not consumption) on serverless agent runtimes, using Amazon Bedrock AgentCore as the primary platform. The core finding: LLM agents spend nearly all their wall-clock time waiting for model replies, yet agent runtimes pin one whole environment (a VM with its own memory) per conversation until the conversation is explicitly closed — so platforms exhaust the *environment* quota long before CPU/memory.

## Key Measurement Numbers
| Metric | Value |
|--------|-------|
| Median wait per model reply (AgentCore) | **2.7 s** |
| Local compute per step (estimated) | **5–40 ms** |
| CPU billing during model wait | not charged (but environment reserved) |
| Conversations → environments | 1:1 pinning (1,000 conversations = 1,000 environments doing the work of 2–15 cores) |
| Avg conversation duration (customer-service benchmark) | **33 s** |
| Extra environment hold after conversation ends | **15 min** (unless client closes it) |
| Simulation: 64 conversations sharing one environment | **59× fewer environments** |
| Reply delay under sharing | 99 of 100 replies delayed ≤ **40 ms** |

## Two Causes, Two Fixes
1. **Delayed release** — environments stay reserved ~15 minutes after the conversation ends. Fix: *client-side close* of the conversation when done. No platform change needed.
2. **One environment per conversation** — while the conversation is mostly idle (waiting on the model). Fix: *multi-conversation environments*, which requires platform support; of the surveyed agent runtimes only one allows it, and only partially.

## The Open Problem
Agent runtimes isolate conversations because an agent runs tools — sometimes arbitrary code — chosen by a model. The unsolved challenge: **maintain that isolation without dedicating a reserved environment to each waiting conversation** (e.g. sandbox-per-activity rather than sandbox-per-session).

## Measurement Methodology Warning
The per-step compute figures (ms range) are estimates because naive approaches systematically under-report: a stubbed model, a timer wrapped only around the model call, or back-to-back step execution each produced plausible-but-too-low numbers. The paper shows how to avoid all three traps — reuse this checklist whenever benchmarking agent runtime overhead.

## Capacity-Planning Rules of Thumb
- Size agent platforms by **environment/session quota**, not by cores — it binds first.
- Always close conversations explicitly; a 33-second conversation can hold a VM for ~15 minutes.
- Consolidation ratio potential under sharing is two orders of magnitude (59× in simulation) with negligible tail-latency cost.

## Relevance to Our Domain
Directly actionable for our agent-infrastructure cost/capacity work (see [[explanation-inference-operational-economics]]): on managed agent runtimes, "no CPU billing while waiting" masks a real scarcity — pinned environments. The client-side close fix is free; platform-level sharing is a vendor-selection criterion.

## References
- Paper: https://arxiv.org/abs/2611.26480
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26480
