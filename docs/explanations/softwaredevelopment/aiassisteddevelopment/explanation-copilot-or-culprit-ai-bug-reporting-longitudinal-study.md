---
title: Copilot or Culprit? How AI Is Changing Open-Source Bug Reporting and Maintenance
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.25605
date: 2026-11-21
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# Copilot or Culprit? How AI Is Changing Open-Source Bug Reporting and Maintenance

## Overview
The first large-scale longitudinal study of AI involvement across the full bug lifecycle — discovery, reporting, validation, resolution — covering 120,918 bug reports from 101 open-source projects between January 2024 and September 2026. It tracks how AI-involved reports changed as LLM capability improved, and how maintainers actually respond to them.

## Problem Statement
AI-generated bug reports earned a bad reputation for unreliable claims and broken reproducers that dump triage work onto maintainers. Meanwhile some maintainers began reporting the opposite experience. Resolving that contradiction requires evidence about whether AI-involved reports are becoming valid, *which* uses of AI correlate with real findings, and how maintainers investigate and act on them.

## Key Contribution
- Empirical baseline for AI-involved reports: they grow more complete over time and a rising share are confirmed valid.
- A sharp use-case split: using AI for **reproduction and diagnosis** correlates with higher validity; using AI for **report writing** does not.
- Maintenance-side finding: maintainers increasingly use AI to investigate code and recommend fixes, but they invest *more* effort in AI-assisted reports of human-discovered bugs than in reports of AI-discovered bugs — AI-discovered bugs still earn less trust.
- Actionable guidance for converting AI findings into verifiable reports: reproducibility, verification, accountability.
- Field validation of that guidance: the authors submitted 53 reports of AI-discovered bugs following it; 69.81% were accepted by maintainers at time of writing.

## Technical Approach
Longitudinal trace analysis over 2.5 years of issue-tracker history in 101 projects, classifying each report along the pipeline (who/what discovered it, who/what wrote it, who/what validated it, how it was resolved) and correlating AI usage modes with validity outcomes.

## Results
Rising completeness and validity of AI-involved reports over time; reproduction/diagnosis-oriented AI use is the reliable signal; ~70% acceptance rate for carefully prepared AI-discovered bug reports.

## Methodology detail (from the paper)

- **Completeness** is scored over **seven report elements** — summary, affected component, triggering conditions, reproduction steps, observed behavior, expected behavior, environment — grading each report as high/medium/low completeness (following prior bug-report-quality studies).
- **Validity is assessed separately** from completeness, using *maintainer responses* as the signal — a complete report can still describe an invalid bug.
- **Maintainer replies** are classified into **six actions across three stages**: *Triage* (Information Request, Duplicate Checking), *Validation* (Reproduction and Testing, Code and API Investigation), *Resolution* (Fix Recommendation, Patch Review and Testing). The effort-asymmetry finding lives in the Validation stage: maintainers spend more AI-assisted investigation effort on human-discovered bugs than on AI-discovered ones.

## Relevance to Our Domain
Directly operational for AI-assisted development practice: when our coding agents find bugs, the report must ship with a runnable reproducer and an independent verification step, not just a fluent description. The "effort asymmetry" finding is a calibration warning — AI-discovered findings need extra credibility scaffolding to get maintainer attention.

## References
- Paper: https://arxiv.org/abs/2611.25605
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25605
