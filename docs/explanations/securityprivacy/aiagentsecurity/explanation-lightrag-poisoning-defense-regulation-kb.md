---
title: Poisoning Attacks and Collaborative Defense Framework for LightRAG-Based Construction
  Regulation Knowledge
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27460
date: 2026-11-23
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Poisoning Attacks and Collaborative Defense Framework for LightRAG-Based Construction Regulation Knowledge

**Authors:** Yingyan He

*Master's thesis, SWISS UMEF, November 2026. 60 pages, 35 tables, 10 figures.*

## Overview
A pre-registered experimental study of knowledge-poisoning attacks against **LightRAG** — a graph-enhanced RAG system that grounds LLM answers in explicit relational structures — deployed for safety-critical construction regulation knowledge (built on the **UK Approved Documents**). It evaluates four attacks together with a three-layer retrieval-graph-generation defense in a full factorial design.

## Problem Statement
RAG is widely used in construction, yet the security of building-regulation knowledge bases has received little study. Graph-enhanced RAG manages relations through an explicit knowledge graph, so adversaries can corrupt *structure*, not just content — and no layer of the pipeline inspects the route (graph entity/relationship descriptions) that poison actually takes to reach the generator.

## Key Contribution
- A fully instrumented LightRAG system on UK Approved Documents with a **150-item benchmark labeled with safety consequences and tampering directions**, evaluated in a **pre-registered, full factorial design**.
- **Four attacks** evaluated: (1) text-layer poisoning, (2) graph-layer poisoning, (3) fabricated amendment narrative, (4) a defense-aware adaptive attacker.
- A **three-layer retrieval–graph–generation defense**, evaluated factorially so layer interactions are measured rather than assumed.

## Technical Approach
The full factorial design is the methodological core: layer interactions are strong, so **no layer's contribution can be isolated** by ablation-free evaluation. A central measurement warning: **a reported zero attack success rate is not evidence of detection unless the refusal rate is reported with it** — zero arises either because provenance filtering removes every document outside the manifest without judging content, or because the system simply refuses.

## Results
- **Text-level poisoning succeeded**, with success rising with the poisoning budget.
- **Graph-level poisoning was less effective than the registered hypothesis predicted.**
- The full defense met the registered criterion; six of seven configurations met their threshold — but configurations containing the **generation layer** did so by **refusing 69–80% of poisoned queries, costing up to 74 points of clean accuracy**, whereas **provenance-based retrieval filtering cost no measurable clean accuracy** in the configuration used.
- Excluding a legitimate unregistered amendment caused no measurable accuracy loss: its wording still reached the generator through the graph's entity and relationship descriptions — the route the poison took, which no layer inspects.
- Conclusion: layered defenses must be evaluated factorially, and regulatory RAG assistants require **corpus admission control and version-aware verification** before they can support safety-critical decisions.

## Relevance to Our Domain
Direct blueprint for hardening our own KB ingestion: our pipeline (feeds → notes → sync) is exactly the kind of multi-source, graph-structured knowledge system this attack class targets. Two transferable lessons: (1) measure attacks with paired **refusal rates**, never attack-success-rate-zero claims alone; (2) provenance/admission control at retrieval is cheap where content-blind generation-layer guards buy safety only by destroying clean accuracy.

## References
- Paper: https://arxiv.org/abs/2611.27460 (cs.CR; submitted 2026-11-20)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27460
- Related: explanation-rag-knowledge-substrate-staleness-detection.md, explanation-knowledge-hypergraph-entailment-guard.md

> Zookeeper correction (2026-11-23): earlier version described federated+DP defense and a "structural/instruction-following/multi-hop/subtle" taxonomy absent from the paper; the paper is a pre-registered Master's thesis with a factorial attack/defense evaluation — content rewritten against the verified abstract.
