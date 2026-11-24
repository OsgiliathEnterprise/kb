---
title: What Makes Good Data for Training Coding Agents? A Systematic Study on SWE-Gym
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.30207
date: '2026-11-24'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# What Makes Good Data for Training Coding Agents? A Systematic Study on SWE-Gym

## Overview
RL for coding agents uses hidden tests as the reward — but task collections typically validate those tests only against the *reference* fix. This paper audits **SWE-Gym** with two LLM families (a suspected label error counts only if **execution reproduces it**) and finds the reward labels themselves are badly broken: a task's pass rate tells you it *yields* reward, not that the reward is *right*. Released artifact: **SWE-Gym-Verified, 1,087 audited tasks**, every verdict with its executed evidence, plus training sets and the full audit pipeline.

## Audit Findings (lookup numbers)
| Finding | Value |
|---|---|
| Tasks a 9B base model **never solves** whose tests reject correct fixes (false negatives) | **74 %** |
| False-negative rate among tasks the model *sometimes* solves | **20 %** |
| Held-out gain from training on repaired/audited tasks (equal size, matched difficulty) | **+2.4 pts (SWE-bench Verified), +2.7 pts (SWE-bench Pro)** |
| Gain from merely dropping never-solved tasks | **none** — audit ≠ difficulty filtering |
| False positives among all passing patches (wrong patches that pass) | **~25 %** |
| Effect on held-out scores of new tests catching a quarter of those false positives | **not detectable** |

## Key Interpretations
- **"Unsolved" often means "mislabelled."** A task the model can never solve is more likely a broken test than an impossible task — so difficulty-based curriculum filters built on pass rates filter on label noise.
- **Reward-label correctness is the first-class data-quality axis** for coding-agent RL, upstream of dedup, difficulty, or format curation.
- **False negatives matter more than false positives**: fixing them moved held-out scores; adding stricter tests to catch false positives did not (within detectability).

## Practical Protocol (reusable)
1. Re-run each task's tests against multiple independent candidate fixes (here, two LLM families) — not just the reference patch.
2. Require execution-reproduced evidence before accepting a label-error verdict.
3. Repair-or-remove audited bad tasks; do not substitute "drop the hard ones".
4. Re-measure training value at matched size/difficulty to attribute gains to label quality.

## References
- Paper: https://arxiv.org/abs/2611.30207
- Related in KB: coding-agent training/data notes under developer-tools-practices/ai-coding-agents
