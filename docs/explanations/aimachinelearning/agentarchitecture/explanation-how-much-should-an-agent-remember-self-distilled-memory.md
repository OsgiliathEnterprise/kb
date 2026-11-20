---
title: How Much Should an Agent Remember? Deployment Lessons from Self-Distilled Memory
  for LLM Agents
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.26361
date: 2026-11-20
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# How Much Should an Agent Remember? Deployment Lessons from Self-Distilled Memory for LLM Agents

## Overview
This production-experience paper describes a self-distilled memory pipeline for LLM agents — where the agent mines lessons from its own trajectories and consolidates them into reusable guidelines — and reports the surprising result that *how much* memory to inject depends on the strength of the underlying model, not on the memory itself. The pipeline ships in the open-source `altk-evolve` library and is deployed in IBM's CUGA agent and the watsonx Orchestrate platform.

## Problem Statement
LLM agents on long-horizon tasks fail in recurring, procedural ways: mis-paginating an API, resolving the wrong entity, or answering when no answer was requested. Generic few-shot guidance rarely fixes these agent-specific failure modes, and teams deploying agent memory have little empirical guidance on how large a memory prompt should be.

## Key Contribution
- A two-stage self-distillation pipeline: (1) mine short *lessons* (1–3 per episode) from the agent's own trajectories; (2) consolidate them into a smaller set of *guidelines*, each recording how many lessons it merged (a support counter).
- Deployment evidence on the AppWorld benchmark across models whose baseline task completion spans 40–92%.
- The central finding: **the right amount of memory is a property of the model, not the memory.** Strong models keep improving as guidelines accumulate; weak models do better with a small selected subset.
- A candid catalogue of failure modes encountered in productionizing the pipeline.

## Technical Approach
At inference, the agent receives either the full guideline set or a selected subset. The measured split is stark: DeepSeek-V3.2 gains +9.5 points of task completion and +16.1 points of scenario completion with its full 191-guideline set, while gpt-oss-120b (39.9% baseline) reaches 51.2% with all 199 of its guidelines but 55.4% (mean of two runs) with a selected subset of only ~29. Injecting too much memory into a weaker model apparently dilutes or distracts its limited instruction-following capacity.

The authors also document what went wrong along the way:
- A high-support guideline that actively backfired (support count ≠ correctness).
- Provenance silently dropped during consolidation.
- A swallowed API error that failed every task while still producing a plausible-looking log.
- A baseline confound that nearly produced a misleading comparison against a prior method.

## Results
- DeepSeek-V3.2: +9.5 task completion, +16.1 scenario completion (full 191-guideline set).
- gpt-oss-120b: 39.9% → 51.2% (all 199 guidelines) vs 55.4% (selected ~29).
- Recommendations distilled for teams deploying agent memory (memory budgeting should be tuned per model tier; audit consolidation for provenance loss; treat silent error-swallowing as a first-class bug class).

## Relevance to Our Domain
Directly informs our agent-infrastructure and memory-architecture coverage: it is one of the few published studies with productized agent memory (IBM watsonx Orchestrate) and gives an actionable rule — *tune memory size to model capability* — rather than the usual "more context is better" folklore. Cross-link with [[explanation-mnemosyne-agentic-transaction-processing]] and the durable-execution notes in this topic.

## References
- Paper: https://arxiv.org/abs/2611.26361
- Open-source implementation: `altk-evolve` (IBM)
- Related: [[Rate Limits Are Not Quality Gates: The Guardrail Stack Behind an AI Agent]]
