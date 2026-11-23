---
title: A Statistical Framework for Training Data Auditing of Large Language Models
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.26264
date: 2026-11-23
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# A Statistical Framework for Training Data Auditing of Large Language Models

## Overview
This paper turns "was my data used to train this LLM?" from an ad hoc membership-inference probe into a calibrated statistical test. It unifies three questions — is a *document* in the training set, was a *collection* used at all, and *which documents* in a suspicious set were used — under one framework with finite-sample error guarantees.

## Problem Statement
Training-data auditing underpins privacy audits, copyright claims, and benchmark-contamination detection (e.g. copyrighted books and scientific papers in pre-training; synthetic text and medical Q&A records in fine-tuning). Two statistical difficulties are handled head-on: membership signals are often concentrated in only a few passages of a long document, so naive whole-document scoring dilutes the evidence; and auditing a whole collection requires aggregating per-document evidence without inflating false positives.

## Key Contribution
- **Document-level membership inference**: chunk-level (passage-level) membership evidence from complementary detectors is fused with the **Cauchy combination** to produce document scores — a heavy-tailed fusion that preserves a strong localized signal instead of averaging it away.
- **Calibrated p-values** per document, with proven finite-sample validity under stated exchangeability conditions.
- **Target-collection global auditing**: an overall assessment of whether a collection was used, with guaranteed type-I error control.
- **Suspicious-subset identification**: multiple-testing machinery over document p-values pinpoints which documents were used, with false discovery rate control.

## Technical Approach
The pipeline is: extract chunk-level membership evidence → combine per document via Cauchy combination → convert to calibrated p-values under exchangeability → apply global testing for the collection-level question and FDR-controlling selection for the subset-identification question. The three auditing tasks are thus different statistical views of the same evidence base.

## Results
Case studies on **BookTection, Pile-arXiv, Cosmopedia, and HealthCareMagic** demonstrate effectiveness and reliability on both pre-training and fine-tuning auditing scenarios — spanning copyrighted books, arXiv papers, synthetic educational text, and medical question-answer records.

## Relevance to Our Domain
For the KB's LLM privacy and governance coverage, this is the rigorous upgrade to the usual membership-inference heuristics: the guarantees (valid p-values, type-I control, FDR control) are what make auditing evidence usable in policy, compliance, and copyright contexts. The "Cauchy combination preserves localized signals" idea is broadly reusable wherever rare strong evidence gets diluted by aggregation.

## References
- Paper: https://arxiv.org/abs/2611.26264
- Related: llm-privacy notes on membership inference and data provenance; model-provenance topic
