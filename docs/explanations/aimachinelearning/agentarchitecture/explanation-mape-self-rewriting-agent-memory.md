---
title: 'MAPE: LLM Agent Memory with Semantic Evolution — Self-Rewriting Agent Memory'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.17068
date: 2026-11-14
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# MAPE: Agent Memory That Rewrites Itself (Experience-Driven Self-Rewriting via a MAPE Loop)

## Overview

Long-horizon agents accumulate experience, but most memory systems store that experience as static records: retrieved, quoted, and never acted upon. **MAPE** proposes treating memory as a **maintainable software artifact** — one that can be *compiled, executed, tested, and rewritten* — organized around a self-editing **MAPE-K loop** (Monitor–Analyze–Plan–Execute over Knowledge, borrowed from autonomic computing). The agent distills raw trajectories into symbolic **crystallization** rules, runs them as **procedural memory** during action selection, and *revises those rules online from the behavior they cause*.

## Problem Statement

Existing agent memory systems store experience as static records that are consumed by retrieval but do not change agent behavior in a controlled, auditable way. There is no principled lifecycle: no way to test a remembered strategy before trusting it, no mechanism to retire rules that stop working, no separation between "what happened" and "what we learned."

## Key Contribution

- **Concept**: memory as an engineering artifact with a compiler/runtime/test lifecycle — learned strategies become executable, testable program-like rules rather than prose snippets.
- **MAPE-K self-editing loop** over four components: **Monitor** (track rule usefulness and outcomes), **Analyze** (diagnose failures), **Plan** (propose rule edits), **Execute** (apply edits), all over a shared **Knowledge** base.
- **Crystallization**: distills raw trajectories into compact symbolic rules; **procedural execution** of rules during action selection; **online revision** — rules that misfire get repaired or retired.
- **MAPE-Bench**: a new benchmark for *experience reuse* — measuring whether an agent actually gets better at tasks it has seen experience from, with a **strict unseen-split protocol** (no leakage between experience and evaluation tasks) to prevent memorization from masquerading as learning.

## Technical Approach

The pipeline is a closed loop: trajectories → crystallizer (symbolic rule induction) → procedural memory consulted at action-selection time → Monitor collects per-rule outcome statistics → Analyze/Plan propose edits (generalize, specialize, merge, retire) → Execute applies them. Because rules are symbolic and program-like, they can be validated before promotion, giving a testing discipline that retrieval-augmented "text memory" lacks. Evaluation on MAPE-Bench emphasizes generalization to unseen tasks under the strict split protocol.

## Relevance to Our Domain

Directly relevant to how we manage agent knowledge and skills: this is the research version of what a good Hermes workflow does manually (skills, memory files, cron lessons). Concrete ideas worth stealing: (1) treat agent-authored rules as code — version, test, and retire them; (2) instrument per-rule usefulness (Monitor) so bad guidance gets evicted instead of accumulating; (3) the unseen-split protocol is a good standard for evaluating any "memory" claim — experience reuse must be demonstrated on held-out tasks.

## References

- Paper: https://arxiv.org/abs/2611.17068 (cs.AI, submitted 2026-11-12)
- Related: autonomic computing MAPE-K loop (IBM, 2003); procedural-memory agent work in this KB (explanations/aimachinelearning/agentarchitecture/)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17068
