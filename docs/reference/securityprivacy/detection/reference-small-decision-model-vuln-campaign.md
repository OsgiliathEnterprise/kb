---
title: "Small Open-Weight Decision Models for Vulnerability Discovery at Scale — 187 Confirmed Findings Campaign"
diataxis: Reference
domain: Security & Privacy
topic: Detection
source: "arXiv"
source_url: "https://arxiv.org/abs/2611.16565"
arxiv_id: "2611.16565"
date: 2026-11-13
keywords:
- knowledge-base
- Detection
- Security & Privacy
- reference
- vulnerability discovery
- small language models
- fuzzing
visibility: public
---
# Small Decision Models for Vulnerability Discovery at Scale

## Overview
This paper reports a large-scale, end-to-end vulnerability-discovery campaign over open-source C/C++ driven by a **4B-parameter open-weight decision model** — a model that answers a typed question in one forward pass, returning scores for permitted answers rather than text — with **no frontier model anywhere in the loop**. The finding is nuanced: the small model is weak as a binary classifier but genuinely useful as a *ranker*, and the surrounding deterministic harness (incomplete-fix miners, shape localizers) does most of the work of deciding where to look.

## Problem Statement
Vulnerability discovery pipelines increasingly bolt LLMs onto mining harnesses, but it is unclear (a) whether small open-weight models can substitute for expensive frontier models, and (b) which component — model or harness — actually produces findings. Answering both requires measuring model quality in isolation *and* running a real campaign with disclosure-grade verification.

## Key Contribution
- An architecture for model-assisted discovery at scale: deterministic incomplete-fix miners + shape localizers propose candidates; Intern-Decision-4B scores every candidate function; scores rank queues (plus a low reach-score floor), never accept/reject.
- A real campaign: **>4,000 projects searched on three GB10 systems at 900–1,100 repositories/hour**, yielding **187 confirmed memory-safety findings** (worst-case CVSS v3.1: 12 critical, 148 high, 23 medium, 4 low), all under coordinated disclosure.
- Honest capability decomposition of where the small model helps and where it doesn't.

## Benchmark Numbers (Lookup)
| Metric | Value |
|---|---|
| AUC: vulnerable vs benign function | 0.73 |
| AUC: vulnerable function vs its own patch | 0.56 |
| CVE localization: fixed function in repo top-25 | 21% (1.4× random) on 75 public CVEs |
| Confirmed findings in top-10 vs random order (campaign queues, selection-biased) | 7.5× |
| Search throughput (3× GB10) | 900–1,100 repos/hour |
| Decision rate | 4.4 decisions/s (1 GB10), 9.8/s (RTX 4090), matching scores |
| Confirmed findings | 187 (12 critical / 148 high / 23 medium / 4 low, CVSS v3.1 worst case) |

## Relevance to Our Domain
This is a template for cost-controlled, self-hosted security research infrastructure: small typed-output models are affordable enough for continuous fleet-wide scanning (thousands of repos/hour on a handful of machines), provided the team treats them as prioritization signals inside a deterministic verification pipeline — never as verdicts. Directly relevant to our DevSecOps vulnerability-management and detection coverage; complements the self-evolving static analysis and PatchBench notes.

## References
- Paper: https://arxiv.org/abs/2611.16565
- Related model: Intern-Decision-4B (open-weight)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16565
