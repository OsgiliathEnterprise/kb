---
title: Higher-Scoring Coding Models Did Not Get More Work Done
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.23216
date: '2026-11-18'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Higher-Scoring Coding Models Did Not Get More Work Done

## Overview
A natural-experiment study asking a deceptively simple question: does a model that scores higher on coding benchmarks actually get more real work done? The June 12, 2026 U.S. export-control directive that suspended **Claude Fable 5** for 19 days created the rare setting where people and projects stayed constant and only the model changed — most former Fable 5 users moved to Opus 4.8, which scores 11 points lower on SWE-Bench Pro.

## Problem Statement
Vendors advertise coding models by benchmark-score improvements, but no study had tested whether higher benchmark scores translate into higher real-world developer output. Confounders (people, projects, task mix) normally make such a comparison impossible.

## Key Contribution
- A clean causal identification: the 19-day Fable 5 suspension as a natural experiment, with developer and date fixed effects in a difference-in-differences design.
- Evidence that benchmark-improving model upgrades produced **no statistically significant productivity gain**.

## Technical Approach
- Track GitHub pull requests of **297 Fable 5 users** before, during, and after the suspension.
- Control group: **8,908 developers** who stayed on Opus 4.8 throughout.
- Replication across **five model upgrades** before/after the suspension in 2026 (1,208 developers, 15,442 pull requests).
- Outcome: 7-day PR merge rate and weekly merged-PR counts.

## Results
- Having Fable 5 (the 11-point-higher model) increased 7-day merge rate by only **+1.4 pp [−1.4; +4.3]** — not significant.
- Across five upgrades: weighted mean **−0.9 pp [−1.9; +0.2]**; all five point estimates negative (95% intervals included 0, indistinguishable from each other).
- Merged PRs per week: **+2.4% [−4.9%; +10.2%]** — not significant.

## Relevance to Our Domain
Strong caution for our coding-agent model-selection practice: SWE-Bench-Pro-style score differences should not justify migration costs or be assumed to improve throughput. Decide on internal, measured merge/acceptance telemetry instead of leaderboards.

## References
- Paper: https://arxiv.org/abs/2611.23216 (published 2026-11-17)
- Author: Yining Hua
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23216
