---
title: 'Route to Remember: Adaptive Memory Selection for LLM Agents'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.05636
date: '2026-11-17'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Route to Remember: Adaptive Memory Selection for LLM Agents

## Overview
How to give an LLM agent **lifelong skill memory without catastrophic forgetting**: maintain a pool of fine-tuned LoRA experts built from past experience, and train a learned router that adaptively selects and composes them per task — while consolidating knowledge back into the base via On-Policy Self-Distillation (OPSD). "Route to Remember" frames memory management as a **conditional-computation problem over expert modules** instead of monolithic continual fine-tuning.

## Problem Statement
Adapting an agent to new tasks by fine-tuning degrades its prior abilities; prompting alone can't inject procedural skills; and fixed routing over expert modules can't handle diverse or ambiguous task demands. The tension: per-task specialization vs a single coherent agent.

## Procedure (the Route-to-Remember recipe)
1. **Build the memory pool**: for each task the agent masters, distill that experience into a **LoRA expert** — the skill library is the collection of these adapters.
2. **Train a learned router** with RL, whose action is to **select and compose** a subset of LoRA experts for the current task; RL optimizes routing **end-to-end for task success** rather than a proxy classification loss.
3. **Exploit composability**: for complex queries, the router **merges knowledge from several experts** (conditional computation) instead of picking one.
4. **Consolidate**: apply **OPSD** — on-policy self-distillation from the routed/adapted behavior back toward the base model — to make route-specific capabilities persist and reduce the specialist-fragmentation cost.

## Results
- Across **14 task families**: **64.7% average success rate**, beating fixed routing, retrieval-augmented baselines, and single LoRA baselines.
- On lifelong **14-task sequential learning**: **65.8%**, **73.6%** and **68.7%** success rates under the three evaluated protocols — sustaining competence across the sequence rather than only on recent tasks.

## Gotchas
- Pool quality gates everything: weak LoRA experts cap the router no matter how good the routing policy is.
- RL-trained routing needs reliable task-success signals; ambiguous reward definitions will train a router toward spurious specializations.
- "Forgetting reduction" comes from OPSD consolidation — dropping that step reverts toward specialist fragmentation.

## References
- Paper: https://arxiv.org/abs/2611.05636
- Related: memory-selection literature in this topic
