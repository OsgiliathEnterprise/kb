---
title: 'PIAtlas: A SoK Taxonomy of Prompt Injection Attacks and the PICorpus Benchmark
  Collection'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: 'arXiv: SoK: PIAtlas: Decomposing the Unbounded Prompt Injection Attack Space
  (arXiv:2610.24999)'
source_url: https://arxiv.org/abs/2610.24999
date: 2026-10-25
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# SoK: PIAtlas — Decomposing the Prompt Injection Attack Space

## Overview

Prompt injection is the dominant security risk for LLM applications and agents, but the field has accumulated **more than twenty public datasets that describe attacks using incompatible vocabularies** — most organized around delivery vector, attacker goal, or generation method. This Systematization of Knowledge (SoK, cs.CR, Oct 2026; 61 pages, 23 tables) inverts that: **PIAtlas** organizes attacks around *how the injected instruction is constructed to subvert the underlying model*. The result is a six-class taxonomy, one class per subversion mechanism, forming the roots of a hierarchy of techniques and sub-techniques that researchers can use to describe attacks consistently and to design systematic evaluations.

## Problem Statement

Existing prompt-injection datasets don't share a common coordinate system, so coverage claims ("we tested prompt injection") are incomparable across papers. Without a mechanism-level map, it is impossible to tell whether a benchmark covers the attack space or only a convenient slice of it.

## Key Contribution

- **A mechanism-based taxonomy**: six classes, one per subversion mechanism by which an injected instruction can override or redirect the model. The taxonomy is derived from how LLMs are trained, prompted, and influenced by human-like framing — not from how attacks are delivered or what the attacker wants.
- **PICorpus**: to the authors' knowledge, the largest **license-clean** collection of public prompt-injection datasets, with thousands of records mapped to PIAtlas under a human-verified protocol.
- **Coverage findings from the mapping**:
  - Attacks usually **combine several techniques drawn from only a few mechanisms** — a small set of mechanisms carries most of the attack surface.
  - Widely used agent benchmarks (InjecAgent-style and AgentDojo-style suites) **test only part of the attack space**.
  - **Adaptive attackers favor mechanisms that curated benchmarks underrepresent** — benchmark scores systematically overestimate defense robustness against adaptive threats.
- **Released resources**: interactive taxonomy and code at `github.com/stevendamianakis/piatlas`, with an interactive taxonomy site.

## How to Use It

1. Describe each attack in your test corpus using PIAtlas mechanisms (not delivery vectors) to make coverage measurable.
2. Cross-check your evaluation suite against the six-class hierarchy to find uncovered mechanisms.
3. When comparing papers on prompt-injection defenses, require the mechanism breakdown — raw ASR numbers across incompatible datasets are not comparable.

## Relevance to Our Domain

This is the missing coordinate system for the prompt-injection notes in this topic: the INFUSE indirect-injection benchmark and OWASP LLM Top 10 mapping both predate a mechanism-level view. The finding that adaptive attackers exploit underrepresented mechanisms is the strongest argument yet for mechanism-stratified red-teaming rather than dataset-level ASR. Complements the OWASP LLM01 mapping note and the INFUSE benchmark note in this topic.

## References

- Paper: https://arxiv.org/abs/2610.24999
- Code + interactive taxonomy: https://github.com/stevendamianakis/piatlas · https://stevendamianakis.github.io/piatlas-site/
- Context: InjecAgent (ACL Findings 2024, aclanthology.org/2024.findings-acl.624/), AgentDojo (ethz-spylab/agentdojo)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.24999

## Further Reading (added 2026-10-25 by KB Zookeeper audit)

- [OWASP Top 10 for Large Language Model Applications (project page)](https://owasp.org/projects/top-10-for-large-language-model-applications) — the risk-list framing PIAtlas complements (LLM01: Prompt Injection); the project has grown into the OWASP GenAI Security Project
- [AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents (ETH Zurich)](https://github.com/ethz-spylab/agentdojo) — the agent benchmark suite PIAtlas shows covers only part of the mechanism space (paper: arXiv:2406.13352, NeurIPS 2024 D&B)
- [prompt-injection-defenses (tldrsec)](https://github.com/tldrsec/prompt-injection-defenses) — catalog of practical and proposed defenses, cross-reference against PIAtlas mechanisms
