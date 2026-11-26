---
title: 'SkillBridge: Cost-Aware Diagnosis and Repair of Cross-OS Compatibility Defects
  in Agent Skills'
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.26256
date: 2026-11-19
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# SkillBridge: Cost-Aware Diagnosis and Repair of Cross-OS Compatibility Defects in Agent Skills

## Overview
SkillBridge is a contract-based workflow for finding and fixing the failures that occur when an LLM-agent **skill** built on one operating system is run on another. OS assumptions leak across five places in a skill package — guide text, scripts, metadata, install contracts, and local entrypoints — so portability testing by brute-force execution is expensive (model tokens, runner time, review effort). SkillBridge screens cheaply first, executes selectively, and repairs the specific contract field responsible.

## Problem
A skill that works on Linux may fail on macOS or Windows for reasons buried anywhere in the package. Running every skill on every OS to find out is wasteful: most executions cost tokens and time before revealing whether a failure is truly OS-related. The task is to triage *which* skill–OS pairs are worth dynamic validation, then fix the root cause rather than symptoms.

## Procedure
1. **Static analysis (screen):** inspect the skill's contract fields — guide text, package scripts, dependencies/metadata, install contracts, platform declarations — for OS-sensitive evidence. In the paper's dataset this screened **3,270 skill-target-OS cases (1,090 skills × Linux/macOS/Windows)** down to promising candidates.
2. **Dynamic validation (confirm):** run the selected skill–OS cases as dynamic tasks and perform root-cause review to confirm the failure is actually caused by an OS assumption (not an unrelated defect).
3. **Repair (fix the contract field):** edit the specific field responsible for the failure — e.g., adjust guide text, fix package scripts, pin/correct dependencies, or add platform declarations — rather than rewriting the skill.
4. **Budget the validation:** prioritize which cases to validate dynamically; the selection policy is the efficiency lever.

## Results
- Repair raises the reviewer-judged target-task pass rate from **30.6% to 38.4%** (+7.8 percentage points).
- Budget efficiency: **38 confirmed OS issues found with 185 dynamic validations**, where uniform random selection would need ~865 validations in expectation (~4.7× fewer).

## Verification / Success Criteria
- Failure traced to a named contract field (guide text, script, dependency, or platform declaration).
- Post-repair pass rate improvement judged by a reviewer on the target OS.
- Validation budget consistent with static-screening yield.

## Relevance to Our Domain
We maintain a shared skills repository (`~/code/skills/`) consumed by agents on heterogeneous hosts. SkillBridge's five-field contract model gives a concrete checklist for authoring OS-portable skills, and its screen→validate→repair pipeline is directly adoptable as a CI gate: static OS-assumption screening first, paid dynamic runs only on flagged cases.

## References
- Paper: https://arxiv.org/abs/2611.26256
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26256
- Related in KB: `software-development/ai-assisted-development/explanation-unfaithful-work-reports-coding-agents.md`
