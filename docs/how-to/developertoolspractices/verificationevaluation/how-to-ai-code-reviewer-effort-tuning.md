---
title: How Much Effort Does an AI Code Reviewer Need? Evidence from Claude 5.5 Models
  on Plausible-but-Wrong Patches
diataxis: How-to Guide
domain: developer-tools-practices
topic: verification-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.33639
date: 2026-11-25
keywords:
- knowledge-base
- verification-evaluation
- developer-tools-practices
- how-to
---
# How Much Effort Does an AI Code Reviewer Need? Evidence from Claude 5.5 Models on Plausible-but-Wrong Patches

## Overview
A preregistered study of the *effort setting* as the cost/diligence knob for AI code reviewers. The question: how much reasoning effort does a reviewer need to catch **plausible-but-wrong patches** — agent-written patches that pass a benchmark's own tests but fail stronger hidden tests? Reviewing 90 SWE-bench Verified Django patches with Claude Opus/Sonnet/Haiku 5.5 at low/medium/high effort, the study finds effort consistently buys diligence (fewer wrong patches accepted), medium effort is non-inferior to high for Opus at 20% lower cost — but **no effort setting is a strong gate**: every setting still accepted at least 45% of wrong patches.

## Problem Statement
AI coding agents now write code faster than humans can review it, so teams deploy AI reviewers. Reasoning models expose an effort dial, but nobody had measured what it actually buys against the failure mode that matters: patches that look right and pass the visible tests.

## How-to: choose an AI-reviewer effort setting from evidence
1. **Build the right test set**: plausible-but-wrong patches (pass the benchmark's tests, fail strengthened tests). Here: 90 agent-written Django patches from SWE-bench Verified; strengthened SWE-ABS tests labeled 55 wrong / 35 correct.
2. **Sweep effort per model tier**: run the same patch set at low/medium/high effort for each model you operate (Opus 5.5 preregistered; Sonnet/Haiku 5.5 exploratory).
3. **Measure false-acceptance rate, not just cost**: high effort accepted fewer wrong patches than low in *every* model — Opus .45 vs .67, Sonnet .49 vs .65, Haiku .51 vs .78 (supported for Opus and Haiku).
4. **Run a non-inferiority test before downgrading**: for Opus, medium was non-inferior to high within 15 points (diff .018, 95% CI [-.065, .108]) at **20% lower cost** (below the preregistered 30% bar); for Sonnet/Haiku, medium saved 39%/51% but non-inferiority was *not* shown.
5. **Consider tiering by budget**: Haiku at high cost ~8% as much per review as Opus at medium, but its accuracy gap remains unresolved; Opus at medium/high agreed best with labels.

## Key Results
- Effort monotonically reduces false acceptance in all three models; most rejections named the actual tested defect, and added effort added such rejections.
- **Hard limit**: every model×effort setting accepted ≥45% of wrong patches — AI reviewers are not a gate.
- Caveat with teeth: for 32 of 55 "wrong" patches the real issue may not be what the failing test checks; removing them, neither accuracy hypothesis holds for any model.

## When to Use
Teams operationalizing AI review of agent-generated patches who need an evidence-based default effort setting (start: Opus-class at medium with periodic high-effort audit; never treat any setting as a merge gate) — and a template for preregistered evaluation of reviewer knobs.

## References
- Paper: https://arxiv.org/abs/2611.33639 (preregistered: https://osf.io/r8q2m)
- Data/code: https://github.com/trustmybot/research-artifacts
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33639
- Related in KB: `how-to-below-kernel-performance-claims.md` (same topic), `explanation-code-review-comments-to-reusable-rules.md`
