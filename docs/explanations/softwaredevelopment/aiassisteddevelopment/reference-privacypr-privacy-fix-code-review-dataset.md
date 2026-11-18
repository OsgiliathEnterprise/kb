---
title: 'PrivacyPR: A Dataset of Real Privacy-Fix Pull Requests for Privacy-Aware Code
  Review with AI'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.18293
date: '2026-11-16'
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# PrivacyPR: A Dataset of Real Privacy-Fix Pull Requests for Privacy-Aware Code Review with AI

## Overview
General-purpose code review misses security defects, and privacy defects — violations of the obligations laws like GDPR impose (e.g. purpose limitation, data minimisation, storage limitation) — have received little attention. **PrivacyPR** is a dataset of real-world merged GitHub pull requests that fix privacy defects, curated to evaluate and improve the privacy awareness of AI code reviewers.

## Problem Statement
There was no large, curated corpus of real privacy fixes to (1) benchmark AI reviewers on detecting privacy defects, (2) study which GDPR principles occur in practice, or (3) train/steer review agents toward privacy concerns.

## Dataset Facts
| Attribute | Value |
|---|---|
| Merged PRs | **4,131** across **1,469** GitHub repositories |
| Collection window | June 2018 – January 2024 |
| Curation | **1,169** high-confidence privacy fixes + **1,643** non-fixes |
| Verified split | **250** fixes + **250** non-fixes (manually verified) |
| Small split | **100** fixes + **100** non-fixes (disjoint from Verified) |
| Per-PR artifacts | Commits, code diffs, review discussions, LLM-generated labels |
| Labels | Privacy relevance, fix type, associated GDPR principle |
| Label quality | Annotators agree with the LLM's GDPR-principle assignment in **72%** of cases |
| Benchmark harness | Reverts each fix to re-introduce the defect, then asks a reviewer to find it |

## Benchmark Baselines
Two coding agents (Gemini CLI and SWE-agent, with Gemini model variants) on the Small split:
- Generic review prompt: detects **42–51%** of the re-introduced privacy defects.
- Explicitly privacy-aware prompt: detection rises to **88–91%**, at the cost of flagging **11–15%** of non-fix PRs.
This shows current agents are capable privacy reviewers **only when explicitly directed** — prompting for privacy, not raw model capability, is the lever.

## Relevance to Our Domain
Directly usable to build and evaluate a privacy-aware review gate in AI-assisted development pipelines: replay PRs with the revert harness as a regression suite, and calibrate a GDPR taxonomy for review prompts against the 72%-validated LLM labels. Related: [[howto-ai-code-review-pipeline]] in this topic.

## References
- Paper: https://arxiv.org/abs/2611.18293
- Data + eval harness (Zenodo): https://doi.org/10.5281/zenodo.23744765
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18293
