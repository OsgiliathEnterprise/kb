---
title: CoReMem — Cost-Internalizing Repository Memory for Successive Coding Tasks
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.17316
date: 2026-11-13
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# CoReMem: Cost-Internalizing Memory for Successive Coding Tasks with Prospective Valuation

## Overview

Coding agents don't solve one task — they tackle a stream of tasks on an *evolving repository*, carrying edits forward and writing memory before the next task is even known. The hard part is choosing what to remember when you can't see the future task, and knowing when acting on stored memory actually saves effort. Li et al. (2026) introduce **Coding-Repository Memory (CoReMem)**, a framework that makes the agent *internalize the cost* of writing and reading memory, guided by a measured value of each memory item on the next task. On ChainSWE it lifts a 27B actor's resolve rate from 21.0% to 25.7% using 17% fewer steps and 11% fewer cache-aware tokens than the untrained, memory-free baseline.

## Problem Statement

Agent memory for coding suffers from a chicken-and-egg problem: memory must be selected *now* for tasks that are *unknown*, while reading and writing memory carries token and latency cost. Naive memory either bloats context (cost without benefit) or under-informs the agent. There was no principled way to price memory against its downstream usefulness on an unseen next task.

## Key Contribution

- **Prospective segment valuation**: run the next task *with and without* individual trajectory segments from the same inherited repository state, and use the measured difference to decide what enters memory. Value is empirical, not heuristic.
- **Anchor-centric compact memory**: memory is organized around *anchors* — concrete repository locations and executable checks — rather than free-form summaries.
- **Actor adaptation via on-policy value estimation**: within rollout groups with vs. without memory, a reward prioritizes task resolution and penalizes step count on successful runs, teaching the actor *when* to consult memory.
- **Provenance-gated value credit**: the extra memory-value term is credited only to steps that actually used a memory-supplied anchor, while every step still keeps its outcome credit — avoiding credit-assignment bleed.

## Technical Approach

CoReMem couples two loops. A *memory-design* loop scores candidate trajectory segments by counterfactual next-task runs, distilling high-value segments into anchor-anchored memory. An *actor-adaptation* loop estimates the on-policy marginal value of memory inside rollout groups and folds that signal into the training reward. The provenance gate ensures the memory module gets credit only where its anchors were genuinely consumed, keeping the learning signal clean.

## Results

| Metric (ChainSWE, 27B actor) | Baseline | CoReMem |
|---|---|---|
| Resolve rate | 21.0% | 25.7% |
| Steps | — | −17% |
| Cache-aware tokens (incl. memory-module calls) | — | −11% |

Gains come with *both* higher success and lower cost — the rare case where memory helps without inflating the token bill.

## Relevance to Our Domain

Our agent-infrastructure stack needs memory subsystems for long-horizon coding agents operating on persistent repos. CoReMem's core insight — *price memory by counterfactual downstream value and anchor it to verifiable repo artifacts (locations + executable checks)* — is directly reusable in any agent memory layer and dovetails with the KB's existing notes on anti-persistence agent memory and agent-substrate runtimes. It also gives AI coding agents a template for self-curating memory that coding-agent frameworks can adopt.

## References

- Paper: https://arxiv.org/abs/2611.17316
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17316
- Industry context — git-based/structured memory for coding agents (Letta Context Repositories): https://www.letta.com/blog/context-repositories/
- Related notes: `explanations/aimachinelearning/agentarchitecture/` (anti-persistence agent memory, agent-substrate runtime)
