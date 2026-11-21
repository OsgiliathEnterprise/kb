---
title: 'From Code Review Comments to Reuse in Production: An Industrial Study of Extracted
  Rules'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.25918
date: 2026-11-21
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# From Code Review Comments to Reuse in Production: An Industrial Study of Extracted Rules

## Overview
Code review comments are a large, under-used source of project-specific programming guidance. This study asks whether LLMs can turn them into structured, inspectable rule artifacts automatically — and whether those rules can be *evaluated* rather than just generated. The authors build and assess a pipeline that turns historical review comments into rule representations in an established semantic-verification language, tested on 107 projects across C and Python.

## Problem Statement
Automated extraction of guidance from review comments is not just generation + post-hoc validation. It requires **principled evaluation criteria** and an explicit connection between each rule and the code changes it is meant to justify. Without those, extracted "rules" are untrustworthy prose.

## Method: The Kleene Evaluation System
The authors develop **Kleene** — a systematic evaluation system for extracted rule artifacts, with explicit criteria linking rules to the code changes they encode, applied across **65 days of rule extraction and evaluation** on 107 projects.

## Key Findings
- **Rule extraction is feasible:** models produced coherent rule sets; the top performer generated **56 named clauses and 12 rules**.
- **Fidelity varies across models.** Compared against source comments: some rules matched exactly (**2 explicit**), others required additional conditions (**38**), and **16 could not be located** in the original comments at all — a hallucination/fabrication signal.
- **Review context matters most.** Of a further 79 comments evaluated: **45 required no modification**, **22 needed modification**, and **12 could not be verified**, showing that surrounding context is decisive for accurate extraction.
- **Generated rules measurably improve code.** Across **20 configurations**, source code with applied rules satisfied reviewer expectations in **8/10** cases, rising to **10/10** for top configurations — a causal check that rules encode real expectations.
- **Human curation still matters.** In the full deployment of **464 rules**, **259 (55.8%)** were nameable, only **195 (42.0%)** carried comments, and **94 (20.3%)** required code changes. Rule sets from the highest-rated models showed higher expected satisfaction (**53.8% vs 49.2%** for random selection).

## Why It Matters
The study reframes "LLM turns review comments into rules" from a generation problem into a **verification problem**: fidelity classification (explicit / modified / unlocatable) and code-change alignment are the metrics that decide whether extracted guidance is deployable. For AI-assisted development pipelines, it suggests a practical pattern: mine review history → extract rules in a formal DSL → gate deployment on Kleene-style evaluation instead of raw LLM output.

## References
- Paper: https://arxiv.org/abs/2611.25918
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25918
