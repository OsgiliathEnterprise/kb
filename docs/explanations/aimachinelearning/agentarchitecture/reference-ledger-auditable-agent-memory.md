---
title: 'LEDGER: Auditable Agent Memory Under Change'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.20927
date: 2026-11-17
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# LEDGER: Auditable Agent Memory Under Change

## Overview

Agent memory systems are usually evaluated on **fixed histories**, scoring only final answers. Real deployments are messier: facts change, sources disagree on reliability, and users ask the agent to forget things. **LEDGER** is a memory layer where the LLM only *proposes* facts, and **explicit deterministic rules** decide which value is current, which source to trust, and what to delete — making the memory auditable and deletable by construction.

## Design Spec

| Element | Mechanism |
|---|---|
| Fact proposal | Language model proposes candidate facts |
| Currency / trust / deletion | Explicit rules (not the LLM) decide current value, trusted source, and deletions |
| Provenance | Each fact keeps its **source** and the **time interval** during which it held |
| LEDGER+EP fallback | Search over raw conversation turns for questions the ledger doesn't cover; those turns are **scrubbed on deletion** |
| Operating modes | *Fallback* (EP used only when ledger misses) and *augment* (EP always adds evidence) |

## Evaluation Setup & Results

Baselines: no memory, full-history replay, retrieval over raw transcripts, Mem0 — same answering model and prompt. Benchmarks: a synthetic multi-session coding-agent workload (author-built) + a 210-question LongMemEval subset. Both the **evidence** sent to the model and the answer are scored.

| Metric | LEDGER+EP | Best baseline |
|---|---|---|
| Coding workload accuracy (5 dev seeds, fallback) | **94.3%** | 82.1% (full replay) |
| Coding workload accuracy (5 held-out seeds) | **91.1%** | 83.3% (full replay) |
| LongMemEval accuracy (augment mode) | **74.8%** = full replay | 74.8%, but at **1% of its context cost** |
| Deletion compliance (fact-described deletion requests) | **No deleted value reached evidence in any evaluated probe** | — |

## Known Limitations

- The coding workload is synthetic and author-built.
- On LongMemEval, differences between the strongest systems fall within confidence intervals.

## Relevance to Our Domain

Long-running coding agents need memory that survives fact changes *and* honours forget requests (compliance, secrets). LEDGER's division of labour — LLM proposes, deterministic rules dispose — is a reusable architectural pattern for auditable memory, and its deletion-testing protocol (score the evidence, not just the answer) is a good evaluation practice to copy.

## References

- Paper: https://arxiv.org/abs/2611.20927 (cs.MA, cs.PF, cs.SE — Islam, Shuvo, Waseem, Abrahamsson)
- Related: `explanation-lemmalog-datalog-memory-for-llm-agents.md`, `explanation-anti-persistence-agent-memory.md`, `explanation-claude-unified-memory-architecture.md`
