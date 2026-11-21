---
title: 'Measuring Hallucination in Large Language Models for Cyber Threat Intelligence:
  An Exploratory Study'
diataxis: Explanation
domain: security-privacy
topic: detection
source: arXiv
source_url: https://arxiv.org/abs/2611.25590
date: '2026-11-21'
keywords:
- knowledge-base
- detection
- security-privacy
- explanations
---
# Measuring Hallucination in LLMs for Cyber Threat Intelligence (HalluVision)

## Overview
Song, Lee, Kim, Choi and colleagues (arXiv:2611.25590, submitted 2026-11-19) present the first systematic hallucination-measurement study for **LLM-generated cyber threat intelligence (CTI)**. Their framework, **HalluVision**, grounds hallucination measurement in the CTI workflow itself — where a single fabricated indicator (IP, hash, CVE, threat-actor name) can propagate into detection rules and response decisions — rather than borrowing generic faithfulness scores.

## Problem Statement
CTI is attractive for LLMs because it demands integrating large volumes of heterogeneous sources, but hallucination risk in that domain is operationally consequential. Prior work had not systematically characterized *how* LLM outputs drift from source articles in CTI, nor which measurement lenses actually track human judgment there.

## The HalluVision Pipeline
1. **Output generation** — the LLM produces CTI content from input cyber-security articles.
2. **Domain-specific entity extraction** — a fine-tuned NER model extracts entities (the CTI-specific step; generic detectors lack this).
3. **Factual-consistency scoring** — multiple similarity metrics compare output against the source article, including semantic similarity and entity-level overlap.

## Experimental Setup
- **Corpus**: 4,940 real-world cyber-security articles.
- **Models**: two commercial LLMs and one open-weight LLM.
- **Validation**: 100 human-annotated LLM outputs, plus two established external faithfulness evaluation methods as a cross-check.

## Findings
- **Semantic-similarity metrics align with human judgments** of factual consistency.
- **Entity-based metrics show limited agreement with human judgment** — counter-intuitively, the CTI-native lens is currently the least reliable.
- The main bottleneck is **NER itself**: entity-level measurements are constrained by the quality of the entity extractor, not just by the LLM.
- Model differences concentrate in the **question-answering** setting.

## Practical Implications
- For CTI pipelines today: trust embedding/semantic consistency scores as first-line hallucination gates; **do not auto-trust entity-overlap scores** without first validating (or human-auditing) the underlying NER component.
- Investing in a better domain NER model raises measurement fidelity more than swapping faithfulness metrics.

## Relevance to Our Domain
Directly informs our threat-intelligence and detection notes: any KB or SOC pipeline that summarizes CTI with LLMs needs a hallucination gate, and this paper tells us *which gates are calibrated against humans* and which are not. It also connects to our broader hallucination-detection notes (HHEM-family) by showing domain fine-tuning of the measurement stack matters.

## References
- Paper: https://arxiv.org/abs/2611.25590
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25590
- Related: [[reference-hhem-semantic-entropy-hallucination-detection]], [[explanation-contextual-fidelity-hallucination-mitigation]]
