---
title: 'Git History is Not the Code Pangenome: Deduplicating 2.4 Million Repositories'
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
# Git History is Not the Code Pangenome: Deduplicating 2.4 Million Repositories

## Overview
An empirical data-engineering study of the largest public code corpus assembled to date: **2.4 million repositories** reconstructed at **153 million snapshots** from the **3.9 billion blobs and 323 million trees** of the full Git object store. Its central finding: most snapshot "diversity" in git history is manufactured by editing — one-line changes across CI sweeps, dependency bumps, and formatting churn produce near-identical snapshots that inflate corpus size without adding training signal.

## Problem Statement
Git history looks like the natural source of code-diversity signal for pretraining, data-selection, and model-provenance pipelines. But no one had measured whether its apparent diversity is *semantic* (genuinely different code) or *temporal* (the same code at different times). If the latter dominates, every pipeline that treats history as diversity is systematically overweighting churn.

## Key Contribution
- First large-scale measurement of semantic vs. temporal diversity in git-history code corpora.
- Evidence that **temporal near-duplication dominates** across CI/dependency/formatting churn.
- A deduplication methodology: reconstruct snapshots from the Git object store (blobs + trees), then apply semantic near-duplicate detection to build a genuine "code pangenome" — the set of distinct code content, independent of when it appeared.

## Technical Approach
Full-object-store reconstruction (not just checked-out HEADs) enables counting true content variants. Semantic deduplication then separates edits that change meaning from mechanical sweeps. The framing — history ≠ pangenome — parallels genomic pangenome thinking: keep one representative per equivalence class of content, not one per timestamp.

## Results
Across 2.4M repos / 153M snapshots, the vast majority of snapshot growth is edit-manufactured near-duplication, implying that history-derived corpora can be compressed to a small semantic core without losing coverage.

## Relevance to Our Domain
Directly relevant to any code-model fine-tuning or retrieval corpus we build: dedupe by content, not by commit; weight snapshots by semantic novelty. Also a caution for provenance/attribution tools that count history volume as evidence of independent authorship.

## References
- Paper: https://arxiv.org/abs/2611.27154 (cs.SE, cs.DL, cs.IR, 2026-11-26)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27154
- Related: explanation-training-data-contamination-detection.md, explanation-deduplication-training-corpora.md
