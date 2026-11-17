---
title: 'Agent-Native by Design: A Programming Language for Agentic Applications'
diataxis: Explanation
domain: AI-LLM
topic: GenAI-App-Frameworks
source: arXiv
source_url: https://arxiv.org/abs/2611.21298
date: 2026-11-17
keywords:
- knowledge-base
- GenAI-App-Frameworks
- AI-LLM
- explanations
---
# Agent-Native by Design: A Programming Language for Agentic Applications

## Overview

Today's agentic applications glue three things together through scaffolding code: LLM operations, workflow structure with application state, and model-guided routing. SDKs and agent frameworks hide execution logic in framework internals, so workflow changes ripple through supporting code and compilers can't see control or state dependencies. This paper proposes **Agent-Native Programming** — unifying all three components under shared execution semantics — realized in **Jac**, a Python-superset language.

## Problem Statement

With SDK-based agent development, developers write supporting code that prepares model inputs, propagates state, and dispatches model-selected steps. Consequences:

- Workflow changes require coordinated edits across that supporting code, inflating development and testing effort.
- Execution logic is split between application code and framework internals, removing compiler visibility into control flow and state dependencies — and with it, any hope of automatic optimization.

## The Jac Approach

Three constructs give the language its agent-native semantics:

| Construct | Role |
|-----------|------|
| `by llm()` | Typed model operations and tool use |
| Object-Spatial Programming | Workflow structure and application state |
| `visit ... by llm()` | Model-guided routing: the model's choices are derived from *executable workflow steps*, and the runtime schedules the selected steps |

Because model decisions are explicitly connected to program execution, the compiler and runtime share a basis for dependency analysis and automatic optimization.

## Results

- Across five benchmarks and five baselines: **1.8–8.7× less AI-integration code** than the OpenAI SDK, with competitive observed task quality and lower coding-agent development effort.
- Two case studies — **speculative execution** and **service partitioning** — are enabled through *configuration alone*, with program analysis and runtime checks preserving workflow behavior under stated conditions.

## Relevance to Our Domain

A concrete data point in the "frameworks vs languages" debate for agentic systems: treating routing as a language construct rather than framework plumbing unlocks compiler-level optimizations (speculation, partitioning) that SDK architectures structurally cannot do. Worth tracking for our agent-infrastructure and GenAI app-framework coverage.

## References

- Paper: https://arxiv.org/abs/2611.21298
- Related KB notes: GenAI-App-Frameworks LangChain series, [[explanation-anatomy-of-an-agent-harness]]
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21298
