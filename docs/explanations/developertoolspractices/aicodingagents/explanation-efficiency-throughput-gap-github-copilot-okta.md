---
title: 'The Efficiency-Throughput Gap: Why GitHub Copilot''s Individual Gains Didn''t
  Move Organizational Output (Okta Field Study)'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: HackerNews
source_url: https://cacm.acm.org/research/beyond-the-hype-the-efficiency-throughput-gap-with-github-copilot/
date: 2026-09-25
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# The Efficiency-Throughput Gap: Why GitHub Copilot's Individual Gains Didn't Move Organizational Output (Okta Field Study)

A Communications of the ACM field study (conducted inside Okta's engineering org during its real Copilot rollout) documents a phenomenon they name the **efficiency-throughput gap**: individual developer efficiency gains that fail to translate into measurable organizational throughput. It is one of the first non-anecdotal, enterprise-scale attempts to explain — not just observe — the disconnect between AI-tool marketing and measured output.

## Method: Organizational Ohm's Law + multi-method triangulation

The study is grounded in **Organizational Ohm's Law (OOL)**, an electrical-circuit analogy for organizations: outcome "current" (productivity) is proportional to efficiency × organizational potential, inversely proportional to organizational resistance — approximated through quantifiable time allocations. Data sources triangulated:

- Engineer **time allocation** surveys before/after adoption across coding, testing, communication, waiting on decisions/dependencies, documentation, engineering/company process, infrastructure inefficiency
- Relative motivation and skill ratings
- Objective GitHub Copilot usage metrics + engineering output metrics (monthly PR count, cycle time, comments, reviews)

Design choices worth copying: the study leaned on **historical metric data** rather than prospective monitoring to reduce reactive effects (measurement changes behavior — Goodhart-style gaming); a pre-existing policy against unsanctioned external LLMs gave a clean baseline; and transparency about data collection was prioritized.

## Findings

- **Time savings were real**: statistically significant reductions (p ≤ 0.05, rank-biserial r −0.51 to −0.90) in context shifting, coding (~1.06 h/week saved), documentation, testing (~1.56 h/week), and total working hours (44.77 → 40.83 h/week).
- **Motivation and perceived skill rose** with very large effect sizes (r = 0.95 motivation, r = 1.00 skills); overall productivity rated 3.95/5 by participants.
- **But output metrics did not move**: no statistically significant change in monthly PR count or lines of code; only monthly *PR review* count increased significantly. Human-centric activities (communication, waiting on dependencies, process) showed no significant time reduction — the hours saved didn't flow into more shipped work.
- Engineers found Copilot most useful for **test scripts, boilerplate, queries, and configuration**; least effective for intricate coding tasks and human-centric enterprise development work.

## Why it matters

1. **"Same work in less time" ≠ "more output."** The freed hours did not automatically convert into throughput — the OOL reading is that organizational resistance (communication, dependencies, process) stayed put while individual efficiency rose.
2. **Measurement design is part of the result.** Prospective monitoring and metric gaming distort what you learn; historical data + transparent methodology is a more defensible baseline for AI-tool evaluations.
3. **A reusable evaluation framework**: OOL + time-allocation survey + objective metrics + participant info gives organizations a repeatable way to continuously assess AI tooling impact instead of one-time snapshots.

## Practical takeaways

- When evaluating an AI coding tool, measure **throughput** (cycle time, shipped work), not just individual speed or sentiment — and expect the gap between them.
- Track where saved hours actually go; if they don't flow to output, the constraint is elsewhere in the system (review capacity, dependencies, process).
- Treat vendor benchmarks as claims; peer-reviewed field data with stated methodology is a different category of evidence.

## References

- [CACM — Beyond the Hype: The Efficiency-Throughput Gap with GitHub Copilot](https://cacm.acm.org/research/beyond-the-hype-the-efficiency-throughput-gap-with-github-copilot/)
- [ACM Digital Library (DOI 10.1145/3797488)](https://dl.acm.org/doi/10.1145/3797488)
