---
title: Semantic Context Handoff with On-Demand Evidence for Long-Horizon Agents
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.24357
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Semantic Context Handoff with On-Demand Evidence for Long-Horizon Agents

## Overview
Semantic Context Handoff (SCH) is a context-management pattern for long-horizon LLM agents. Instead of carrying the full action–observation history or discarding old observations during summarization, SCH separates the agent's *semantic state* (its current interpretation) from *evidence* (the raw interactions), keeping evidence separately addressable so it can re-enter context later when it becomes relevant.

## Problem Statement
Full-history prompting grows context without bound, raising inference cost and degrading accuracy. Compaction methods keep conclusions but drop early observations — destroying evidence that later steps may need. The result is a lose-lose between cost and recoverability.

## How to Implement State–Evidence Separation
1. **Maintain a compact semantic state.** After each step, update a small representation of the agent's current interpretation of the task — this is what always rides in the prompt.
2. **Index evidence instead of summarizing it away.** Store each action–observation pair as an addressable unit; do not delete or fold it into prose summaries.
3. **Rehydrate on demand.** When later execution makes old evidence relevant, pull the addressed unit back into context directly — no separate summarizer pass and no external retrieval-model call.
4. **Avoid shadow systems.** The paper's key property: re-entry happens without additional summarization or retrieval-model infrastructure, keeping the loop simple.

## Results
- Controlled 150-task SWE-bench study: evidence recovery lifts **Pass@1 from 80.0% to 86.9%** at essentially unchanged token use and execution time.
- Full-system comparison: **86.9% Pass@1 with 43% fewer tokens and 41% less wall-clock time** than the strongest-performing baseline.
- Consistent token reductions vs. full-history prompting across models and benchmarks.
- Trajectory analysis shows recovered evidence comes from *substantially earlier* in the history, not just a sliding recent window.

## Relevance to Our Domain
A concrete, deployable recipe for agent context engineering — relevant to coding-agent harnesses and any long-running agent where token cost and evidence retention trade off. Complements compaction-based approaches (e.g., ACE-style semantic compression) by making discarded evidence recoverable rather than lost.

## References
- Paper: https://arxiv.org/abs/2611.24357
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24357
