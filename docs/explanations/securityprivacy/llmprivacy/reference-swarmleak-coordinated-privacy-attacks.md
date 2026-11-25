---
title: 'SwarmLeak: Does Coordination Improve Privacy Attacks on LLM Agents?'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.31791
date: 2026-11-25
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# SwarmLeak: Does Coordination Improve Privacy Attacks on LLM Agents?

## Overview
SwarmLeak is the first red-teaming *dataset* for coordinated privacy attacks against agentic retrieval systems, built from the GAIA benchmark. It provides 125 multi-hop questions whose gold answers combine a publicly verifiable anchor entity with a private PII attribute drawn from synthetic dossiers — so no real personal data is needed, yet extraction requires chaining multiple retrieval, tool, or browsing steps. Against this harness, 111 frontier models and 6 agent frameworks were evaluated: unassisted direct extraction sits at ~2% success, but a single attacker-selected private context raises success to 75–81%. The headline finding: coordination does *not* improve PII extraction over single-agent attacks.

## Problem Statement
Agentic RAG systems combine an LLM with external tools, web browsing, and access to private organizational data. Prior work shows single-agent attacks can extract sensitive information from the retrieval corpus, but it was unknown whether *multi-agent* attack frameworks gain an advantage from adversarial coordination when the goal is PII extraction.

## Reference: Dataset & Benchmark Specifications
| Property | Value |
|---|---|
| Source benchmark | GAIA (multi-hop QA) |
| Questions | **125** multi-hop |
| Answer structure | public verifiable anchor entity + private PII attribute |
| Private data | synthetic PII dossiers (no real PII) |
| Attack surface | multiple retrieval / tool / browsing steps required |
| Evaluated systems | **111 frontier models**, **6 agent frameworks** |
| Unassisted direct extraction | ~**2%** success |
| Single private context injected | **75–81%** success |
| Multi-agent vs single-agent | **no improvement** from coordination |

## Technical Approach
The authors adapt GAIA questions so each gold answer fuses public information (checkable, anchorable) with a synthetic private attribute, then run both single-agent and multi-agent attack harnesses over the agentic pipeline (retriever, tools, browser). The comparison isolates whether adversarial coordination — division of labor, shared exploration — buys extraction capability beyond what one agent achieves.

## Results
- Direct, unassisted extraction from the corpus: ~2% — the corpus alone is hard to mine.
- One attacker-selected private context: 75–81% — context injection is the dominant lever.
- Multi-agent coordination: **no measurable gain** over single-agent baselines.

## Relevance to Our Domain
This gives our LLM-privacy and agent-security programs a concrete red-team asset (125 coordinated-attack scenarios with synthetic dossiers) and, more importantly, a triage insight: defenses should prioritize **context-injection controls** (where the 2%→75% cliff lives) rather than fearing hypothetical attack swarms. Use SwarmLeak scenarios in our agentic-RAG threat models and in pre-deployment eval gates.

## References
- Paper: https://arxiv.org/abs/2611.31791
- Related: security-privacy/ai-agent-security/explanation-defeating-indirect-prompt-injection-tool-hierarchy.md
- Related: security-privacy/llm-privacy/explanation-protecting-llm-privacy-multitask-learning.md
