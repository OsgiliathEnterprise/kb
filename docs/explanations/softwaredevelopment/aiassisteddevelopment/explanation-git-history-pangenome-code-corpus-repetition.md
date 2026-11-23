---
title: 'Git History Is a Pangenome: Repetition in Code Training Corpora and What Deduplication
  Removes, Keeps and Misses'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.27154
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# Git History Is a Pangenome: Repetition in Code Training Corpora and What Deduplication Removes, Keeps and Misses

## Overview
Code models are increasingly trained on **full repository histories** — every version of every file — rather than single snapshots. This study measures, for the first time, what snapshot-era deduplication tooling actually does to such histories. Finding: a git history is mostly repetition — in text-indexing terms a *pangenome*, one text in many near-identical variants — and standard deduplication both keeps the wrong versions and misses benchmark answers.

## Problem Statement
Deduplication pipelines were designed for snapshot corpora. Whether history-based training multiplies effective data or just re-trains on the same code dozens of times had never been measured, nor had deduplication's behavior when applied across versions.

## Key Findings
Measured on a pre-registered random sample of 306 public repositories, 25 mature projects, and the 12 repositories behind SWE-bench:
- **Repetition magnitude**: a typical repository's history holds the equivalent of **19 copies** of its current code; a mature repository, **89 copies**. Cause: each edit changes a few lines and leaves the rest — nine of ten tokens of a changed file already existed pre-change.
- **Exact-match dedup removes nothing** — no two versions are byte-identical.
- **Near-duplicate grouping works across versions too**: the standard snapshot step (group near-identical files, keep one) applied across versions brings repetition down to ~2 copies.
- **But the kept version is often the old one**: widely used implementations (including the one measured) pick the survivor with a date-ignoring rule, so **half of all files train on a stale version**. Sorting versions newest-first before deduplicating fixes it at almost no cost.
- **Benchmark leakage survives dedup**: a merged SWE-bench bug fix persists in a median of **18 later versions** of the files it changed; removing benchmark fixes requires a **separate pass over every version**.

## Practical Rules (as delivered by the paper)
1. Deduplicate history corpora by near-duplicate grouping **across versions**, not per snapshot.
2. Sort versions **newest-first** before grouping so the retained file is current.
3. Run a dedicated **benchmark-fix scrubber over all versions** for history-trained models evaluated on SWE-bench-style tasks.
The author releases the measurement instruments and frozen outputs (replication package on OSF).

## Relevance to Our Domain
Directly actionable for any code-model fine-tuning or retrieval corpus we build from repo histories: three concrete pipeline rules, one of them (newest-first sorting) a near-free correctness fix, and a reminder that history-based training silently inflates benchmark contamination.

## References
- Paper: https://arxiv.org/abs/2611.27154 (cs.SE, cs.LG; published 2026-11-20; S. Chopra)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27154
- Replication: https://osf.io/5nwgv/?view_only=34532f33e19149829435aa819d476191
