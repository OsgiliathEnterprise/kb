---
title: 'Contexture: Runtime Context Eviction for High-Throughput Agent Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.26980
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Contexture: Runtime Context Eviction for High-Throughput Agent Serving

## Overview
Coding-agent harnesses (the paper names Hermes, OpenClaw, Codex) resend a monotonically growing execution history with every request, inflating shared GPU KV-cache pressure in HBM. Contexture shows that at fleet scale, *shared KV capacity — not compute — is the agent-serving throughput bottleneck*, and proposes a harness- and model-agnostic runtime layer that decides what the model actually needs to see, using information neither the harness nor the KV manager has alone.

## Problem Statement
Two communities each miss half the picture: context-reduction methods (compaction, pruning) optimize locally without visibility into global cache state, while runtime KV managers optimize cache residency without knowing which turns correspond to superseded tool executions. Meanwhile agents keep paying prefill and decode costs for tokens that later tool operations have already overwritten.

## Key Contribution
- Empirical finding: tracing tokens back to their originating tool operations reveals that later operations supersede earlier outputs and turns — **64% of recorded final-history tokens are removal candidates**.
- An architecture that separates the harness's full conversation history (kept intact for auditability) from the model's execution context (trimmed per request), without touching harness logic or model code.
- Coordination of two signals: *supersession* (which tokens can go) plus runtime state (global shared-KV pressure and prefix residency, deciding when removal justifies sacrificing cached computation).
- No additional model calls, no training.

## Technical Approach
Contexture sits between harness and serving engine. A tool-operation trace marks superseded turns as eviction candidates; a global view of KV pressure and prefix residency gates when evicting is worth the re-prefill cost. This limits re-prefill interference with concurrent decoding while cutting memory demand and decode KV traffic.

## Results
- Across two models, two harnesses, two benchmarks: **20–73% higher throughput under SLO** than the best of no eviction, harness compaction, AgentDiet and Continuum; 7–63% over observation masking in 5 of 8 configurations.
- +23% throughput under SLO over LMCache alone on H100; up to **11% lower GPU energy per completed session**.
- Live-agent accuracy: mean +1.4 points over unloaded no-eviction (worst case −3.7), whereas observation masking loses 3–28 points.

## Relevance to Our Domain
This is the serving-side counterpart to the KB's agent-context notes (AutoCompact, MemFolder, batch makespan coordination). For our own agent infrastructure — where multiple agents share GPU fleets — it reframes context management from a quality problem into a *fleet throughput and energy* problem, and quantifies how much history is dead weight (≈64% supersession candidates).

## References
- Paper: https://arxiv.org/abs/2611.26980
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26980
- Related KB notes: `developer-tools-practices/ai-coding-agents/howto-autocompact-context-compaction-coding-agents.md`, `ai-machine-learning/agent-architecture/how-to-memfolder-structure-guided-memory-folding.md`
