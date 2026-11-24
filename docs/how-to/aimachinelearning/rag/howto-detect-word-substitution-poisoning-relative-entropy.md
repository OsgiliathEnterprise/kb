---
title: Detecting Word-Substitution Poisoning of a RAG Knowledge Base with Relative
  Entropy and Runtime Verification
diataxis: How-to Guide
domain: ai-machine-learning
topic: rag
source: arXiv
source_url: https://arxiv.org/abs/2611.27410
date: 2026-11-24
keywords:
- knowledge-base
- rag
- ai-machine-learning
- how-to
---
# Detecting Word-Substitution Poisoning of a RAG Knowledge Base with Relative Entropy and Runtime Verification

**Authors:** Ali Yousefi, Nikos Komninos, Hafizul Asad


## Overview

This paper studies a stealthy attacker who silently edits existing passages in a RAG knowledge base by swapping words for their synonyms (PWWS, TextFooler attacks), using a cybersecurity RAG system built from **MITRE ATT&CK and CAPEC** content. Whole-passage statistical tests are too weak to catch the edits, but a single term of the **relative entropy** — the log-ratio between a word and its most probable synonym, scored against a small reference language model — detects edited passages at AUROC 0.95, and a runtime monitor against trusted MITRE STIX data restores answer correctness.

## Problem Statement

RAG users must trust the knowledge base, but synonym-level edits are almost invisible: on a reviewed 44-question benchmark with repeated paired runs and a layout-only control corpus, poisoning dropped judged answer correctness from **0.714 to 0.555** — damage that comes mostly from **lost evidence and refusals, not false statements**. Detection must work at the word level, and filtering alone is not enough.

## Steps

1. **Build a detection score from relative entropy.** Do not compare a whole passage against normal-text statistics (weak signal). Instead isolate the term measuring the **log-ratio between each word and its most probable synonym** under a **small language model used as reference**.
2. **Validate against a control corpus.** Check that the score stays **near chance on a control corpus where only layout changes** — this rules out formatting artifacts as the trigger (AUROC 0.95 on real edits).
3. **Use it as a retrieval filter.** Screening retrieved passages with the score **halves how often edited text reaches the generator**. Note the constraint it imposes on attackers: an adversary forced to keep each passage probable under the LM **fails on all 57 sections attempted**.
4. **Add a runtime answer monitor — filtering alone will not restore correctness**, because the edited passage is usually the one that held the answer. Check each generated answer against **trusted MITRE STIX data** and remember which passages were rejected.
5. **Optionally inject the trusted source.** When the monitor may add the trusted MITRE entry as a source, judged correctness rises to **0.786** (above the 0.714 unpoisoned baseline).

## Verification (paper-reported)

- Poisoning impact: correctness 0.714 → 0.555 (44-question reviewed benchmark, paired runs).
- Detector: AUROC 0.95 with small-LM reference; near-chance on layout-only control.
- Retrieval filter: halves edited text reaching the generator; constrained-probability attacker fails 57/57 sections.
- Runtime monitor alone: exposure to edited text 0.41 → 0.26; with trusted-source injection: correctness 0.786.
- The paper reports **costs and failure cases of every defence** alongside its gains.

## Pitfalls

- Passage-level statistical tests miss synonym swaps — score at word/synonym granularity.
- Detecting and dropping the edited passage does **not** recover the answer (the poisoned passage held it): pair detection with a trusted-source runtime monitor.
- Domain must admit a machine-readable trusted corpus (here MITRE STIX) for the monitor to work.

## References
- Paper: https://arxiv.org/abs/2611.27410 (cs.CR, cs.AI)
- Related note: `ai-machine-learning/rag/explanation-cited-but-unused-attribution-gaps-rag.md`
