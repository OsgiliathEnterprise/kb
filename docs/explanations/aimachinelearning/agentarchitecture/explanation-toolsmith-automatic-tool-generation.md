---
title: 'ToolSmith: An Automatic Tool-Generation Framework for Multimodal Search Agents'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: 'arXiv: ToolSmith: An Automatic Tool-Generation Framework for Multimodal Search
  Agents (arXiv:2611.31198)'
source_url: https://arxiv.org/abs/2611.31198
date: 2026-11-24
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# ToolSmith: An Automatic Tool-Generation Framework for Multimodal Search Agents

## Overview

ToolSmith (cs.CL/cs.AI/cs.CV, November 2026) attacks one of the quiet bottlenecks of multimodal search agents: the **hand-crafted tool library**. State-of-the-art agents answer questions beyond their parametric knowledge by reasoning, looking, and searching the live web over many turns, orchestrating a small set of manually written search and visual tools. ToolSmith replaces curation with **self-extension**: the agent grows and reuses modules on top of a lean base tool library, the way a human practitioner fashions a new tool from familiar parts when the toolbox falls short.

## Problem Statement

Hand-built tool libraries are (1) laborious to create and maintain and (2) **frozen** — when deployed agents encounter new query types, evidence formats, or failure modes in the wild, nobody is there to write the missing tool. Every gap becomes either a failure or new engineering debt.

## Key Contribution

- **Automatic tool generation for multimodal search agents**: rather than prompting an agent to use only pre-approved tools, ToolSmith synthesizes new tool modules from combinations of primitives in a minimal base library, and **reuses** the generated modules across tasks.
- **Growth model over a lean base**: the architecture keeps the curated surface small (easy to secure and maintain) while allowing the library to expand organically at deployment time.
- **Broad evaluation protocol**: three in-domain multimodal search benchmarks plus **ten out-of-domain benchmarks**, judged under a VLM-as-a-Judge protocol — a deliberate stress test of whether generated tools generalize instead of overfitting the training queries.

## Technical Approach

The design principle is human-inspired bricolage: humans cope with missing tools by composing new ones from parts they already know and keeping what works. ToolSmith operationalizes this as module generation and reuse on top of the base library — new query types or evidence formats trigger the fabrication of a module, which then becomes part of the agent's callable surface for subsequent tasks. Evaluation spans agents of varying backbone scales, testing whether tool self-extension compounds with model capability.

## Results

- ToolSmith **consistently improves over the fixed base library** across deployed agents of varying scales.
- **Larger backbones reap greater gains** — the authors read this as evidence the approach scales: stronger models are better at deciding *when* to fabricate and *how* to compose modules.

## Relevance to Our Domain

Our agent-architecture notes cover skill libraries, progressive disclosure, and skill staleness (e.g., agent-skills-go-stale, coverage-guided self-evolution of skills). ToolSmith is the tool-library counterpart to those self-evolving-skill lines: it shows frozen curated toolsets are the limiting factor for search agents and that automatic generation + reuse is viable under judge-based evaluation. For production, the security dimension is the open question this paper does not address — generated tools expand the callable surface and would need the governance treatment our agent-security topic covers.

## References

- Paper: https://arxiv.org/abs/2611.31198
- Code/data: https://threesr.github.io/toolsmith/
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.31198 (not yet indexed at time of writing)
- Related in vault: [[explanation-coverage-guided-self-evolution-agent-skills]], [[explanation-progressive-disclosure-on-demand-skills]]
