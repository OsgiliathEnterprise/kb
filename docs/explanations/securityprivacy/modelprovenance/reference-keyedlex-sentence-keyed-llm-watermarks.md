---
title: 'Know the Design, Pick the Attack: Sentence-Keyed Watermarks for LLMs'
diataxis: Explanation
domain: security-privacy
topic: model-provenance
source: arXiv
source_url: https://arxiv.org/abs/2611.34505
date: 2026-11-25
keywords:
- knowledge-base
- model-provenance
- security-privacy
- explanations
---
# Know the Design, Pick the Attack: Sentence-Keyed Watermarks for LLMs

## Overview
This paper studies a *design-aware* attacker against LLM text watermarks: one that reads the published watermark design and picks the optimal attack per scheme — paraphrasing to erase watermarks that are hard to imitate, or learning and forging the ones that survive rewording. Against this adaptive attacker, every existing watermark compared fails. The authors then propose **KeyedLex**, a sentence-keyed watermark whose secret key is derived from the grammar of the previous sentence, which resists both attack routes. (Reference-type note: serves as a threat-model and comparison table for LLM watermark design choices.)

## Problem Statement
Watermarking provider text underpins academic integrity, anti-misinformation efforts and incoming AI regulation. But publishing a watermark design — as providers increasingly do — is a double-edged sword: it tells an attacker how to break it. Two distinct attacks have each been studied in isolation: (1) **erasure** — reword the text until the mark disappears; (2) **forgery** — learn the mark and stamp it onto text the model never wrote. No prior work considered an attacker choosing between them per design.

## Key Contribution
- **Adaptive design-aware threat model**: an attacker that reads the published design and *routes* each target watermark to the attack it is weakest against — erasing hard-to-learn marks, forging rewording-robust ones.
- **Negative result**: under this attacker, every existing watermark in the comparison fails on at least one axis.
- **KeyedLex**: a watermark that reads its secret key from the *grammar of the previous sentence*. Rewording barely changes sentence grammar, so the key survives paraphrase; and the detector does not need to recover the key exactly, making forgery-by-learning much harder.
- **Measured robustness**: on both models tested, KeyedLex loses only ~half of its watermark signal where the best alternative loses two thirds — at no measurable text-quality cost versus the best-known watermarks.

## Technical Approach
Keying to the previous sentence's grammatical structure couples the mark to a property that paraphrase attacks preserve (grammar changes little under rewording) but that an attacker cannot cheaply enumerate or learn exactly. The relaxed detector tolerates approximate key recovery, decoupling detection strength from exact key secrecy. Evaluation compares signal retention under the routed attack across multiple watermark schemes and two model families, with text-quality controls.

## Results
- Baselines: all compared watermarks broken by the design-aware routed attacker.
- KeyedLex: best robustness/quality trade-off on both models; signal loss ~50% vs ~66% for the strongest alternative; no text-quality penalty.
- 10 pages, 1 figure, 8 tables.

## Relevance to Our Domain
Provenance and content authenticity are KB themes: as EU AI Act-style disclosure obligations make watermarking operational, teams choosing provider watermarks need to know which designs withstand a read-the-manual adversary. KeyedLex's sentence-grammar keying is a concrete design pattern to evaluate against.

## References
- Paper: https://arxiv.org/abs/2611.34505
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34505
- Related in KB: `explanation-tokenprov-verifiable-token-billing.md` (provenance), `explanation-autonomous-parameter-surgery-llm-backdoors.md` (same topic)
