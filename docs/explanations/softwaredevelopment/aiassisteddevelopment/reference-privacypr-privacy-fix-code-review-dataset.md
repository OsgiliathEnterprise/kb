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

## Curation Pipeline
1. **Search**: merged PRs matched on 17 privacy-related keywords — statutory identifiers ("GDPR", "CCPA"), technical procedures ("anonymization"), operational terms ("PII leak", "user consent").
2. **Filter**: only active projects with ≥100 GitHub stars.
3. **Harvest**: metadata, commit histories, file diffs, and review conversations via GitHub GraphQL + REST APIs.
4. **Annotate**: Gemini 2.5 Flash-Lite extracts structured metadata, classifying each change into **eight functional fix categories** and mapping them to **GDPR Art. 5(1)** data-protection principles.

## What Privacy Debt Looks Like (1,169 high-confidence fixes)
| Dimension | Category | PRs | Share | Median changed lines |
|---|---|---|---|---|
| Fix type | Data Exposure Restriction | 807 | 69.0% | 106 |
| Fix type | Consent / Policy Enforcement | 405 | 34.6% | 87 |
| Fix type | Access Control | 242 | 20.7% | 402 |
| Fix type | Data Removal & Masking | 141 | 12.0% | 221 |
| GDPR principle | Integrity & Confidentiality (Art. 5(1)(f)) | 945 | 80.8% | 115 |
| GDPR principle | Lawfulness, Fairness, Transparency (Art. 5(1)(a)) | 599 | 51.2% | 63 |
| GDPR principle | Data Minimisation (Art. 5(1)(c)) | 422 | 36.1% | 107 |

Typical Art. 5(1)(f) fixes: keeping sensitive personal data out of logs, analytics pipelines, error traces. Art. 5(1)(a): consent banners and opt-in mechanisms. Art. 5(1)(c): removing unneeded telemetry identifiers. Annotator agreement on the Verified split: **89%** on privacy relevance, **72%** joint endorsement of GDPR-principle labels.

## Benchmark Baselines
Two coding agents (Gemini CLI 0.64.0 and SWE-agent 1.1.0, both on Gemini 3.7 Flash, full repo access in Docker) on the Small split:
- Generic review prompt: detects **42–51%** of the re-introduced privacy defects.
- Explicitly privacy-aware prompt: detection rises to **88–91%** (~4/5 of detections rated high severity), at the cost of flagging **11–15%** of non-fix PRs.

Full baseline table (incl. single-turn reviewers judged by GPT-6.1 / Gemini 3.1 Pro):

| Reviewer | Generic prompt | Privacy prompt | High-severity | Non-fix false alarm |
|---|---|---|---|---|
| Gemini 3.5 Flash-Lite (single call) | 13% | 64% | 41% | 0% |
| Gemini 3.7 Flash (single call) | 11% | 59% | 29% | 0% |
| Gemini 3.8 Flash (single call) | 23% | 73% | 46% | 0% |
| Gemini CLI 0.64.0 (agent) | 42% | 91% | 82% | 15% |
| SWE-agent 1.1.0 (agent) | 51% | 88% | 77% | 11% |

This shows current agents are capable privacy reviewers **only when explicitly directed** — prompting for privacy, not raw model capability, is the lever.

## Known Failure Modes & Cost
- Agents asserted the defect was still present in **13–21%** of already-fixed commits — they react heuristically to the presence of personal data rather than reasoning about existing safeguards.
- Agentic review: **3.6–5.2 min and $0.14–0.18 per PR**, vs **~14 s and $0.013** for a single-turn call (~10× cost). Suggests hybrid triage: cheap single-pass model first, agentic review only for high-risk data paths.
- Positioning: unlike functional-bug benchmarks (SWR-Bench, c-CRAB arXiv:2603.23448) or vulnerability corpora (CVEfixes), PrivacyPR targets **non-functional statutory compliance** (GDPR Art. 25 data protection by design/default).
- Planned: coverage of US state privacy statutes, non-English repos, automated test synthesis for verifying proposed fixes.

## Relevance to Our Domain
Directly usable to build and evaluate a privacy-aware review gate in AI-assisted development pipelines: replay PRs with the revert harness as a regression suite, and calibrate a GDPR taxonomy for review prompts against the 72%-validated LLM labels. Related: [[howto-ai-code-review-pipeline]] in this topic.

## References
- Paper: https://arxiv.org/abs/2611.18293
- Data + eval harness (Zenodo): https://doi.org/10.5281/zenodo.23744765
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18293
- CASRAI editorial with full baseline/cost tables: https://casrai.org/news/privacypr-benchmark-privacy-aware-code-review-agents-2026
