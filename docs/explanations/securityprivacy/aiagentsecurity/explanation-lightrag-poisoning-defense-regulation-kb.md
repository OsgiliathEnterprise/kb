---
title: Poisoning Attacks and Collaborative Defense Framework for LightRAG-Based Construction
  Regulation Knowledge
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27460
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Poisoning Attacks and Collaborative Defense Framework for LightRAG-Based Construction Regulation Knowledge

**Authors:** Yingyan He


## Overview
A systematic study of knowledge-poisoning attacks against **LightRAG** — a graph-enhanced RAG system that grounds LLM answers in explicit, multi-hop relational structures — deployed for safety-critical construction regulation knowledge bases. The paper formalizes four poisoning strategies spanning both the document layer and the graph layer, and proposes a collaborative (federated, privacy-preserving) defense framework.

## Problem Statement
Prior RAG-poisoning research targets dense vector retrieval. Graph-enhanced RAG changes the attack surface fundamentally: it manages multi-hop relations through an explicit, persistent knowledge graph, so adversaries can corrupt *structure*, not just content — yet this surface was unstudied.

## Key Contribution
- Four poisoning strategies defined over the **document layer** (corrupting extracted entities/relations) and the **graph layer** (injecting fabricated entities and relation triples):
  1. **Structural** — fabricated graph topology.
  2. **Instruction-following** — malicious instructions embedded in knowledge entries.
  3. **Multi-hop** — poisoned paths exploited during relational retrieval.
  4. **Subtle** — low-salience edits designed to evade detection.
- Empirical demonstration that these attacks meaningfully degrade answer accuracy and trustworthiness in a regulatory Q&A setting.
- A **collaborative defense framework**: detection models trained across organizations via federated learning, with **differential privacy** to protect participating data sources — important because regulation knowledge bases are distributed and partly confidential.

## Technical Approach
The threat model assumes adversary write access to the knowledge-acquisition pipeline (documents or the extraction output). Defense shifts from per-deployment ad hoc filtering to shared, privacy-preserving detection: multiple organizations contribute gradients, not data, to poison classifiers.

## Results
All four strategies measurably degrade LightRAG answer quality; the federated+DP defense restores trustworthiness without centralizing member data. The authors highlight a critical gap: **regulatory compliance is absent from current RAG security research** — safety-critical domains need compliance-aware defenses.

## Relevance to Our Domain
Direct blueprint for hardening our own KB ingestion: our pipeline (feeds → notes → sync) is exactly the kind of multi-source, graph-structured knowledge system this attack class targets. The layer split (content vs. structure integrity) is a useful mental model for our ingestion validators; federated detection is the long-term pattern for multi-tenant KBs.

## References
- Paper: https://arxiv.org/abs/2611.27460 (cs.CR, cs.AI, 2026-11-26)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27460
- Related: explanation-rag-knowledge-substrate-staleness-detection.md, explanation-knowledge-hypergraph-entailment-guard.md
