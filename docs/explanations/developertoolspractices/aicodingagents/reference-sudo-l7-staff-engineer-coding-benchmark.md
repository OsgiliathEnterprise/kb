---
title: 'sudo L7: Can Coding Agents Act Like Staff Engineers?'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.30517
date: '2026-11-24'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# sudo L7: Can Coding Agents Act Like Staff Engineers?

**Authors:** Nick Heiner, Ian Niebres, Suhaas Garre, Sushant Mehta, Edwin Chen. (arXiv:2611.30517)


## Overview
sudo L7 (arXiv:2611.30517, cs.SE/cs.AI) is a benchmark of **60 software-engineering tasks authored by staff-level engineers**, mostly drawn from **private production codebases**, each built around a place where a frontier model previously failed. It targets the gap between "turn a well-specified ticket into a passing patch" and the judgment experienced engineers apply: noticing unmentioned risks, questioning flawed premises, reusing what exists, and reporting truthfully what was and wasn't checked.

## Benchmark Design
| Element | Specification |
|---|---|
| Tasks | 60, written by staff engineers, mostly private production codebases |
| Task shape | realistic **underspecified** request + hidden expert-authored rubric |
| Rubric | **1,287 atomic criteria**, tagged with **8 behavioral dimensions** (from functional correctness to truthful reporting) |
| Grading | agentic grader reads the transcript, inspects **and runs** the code; treats test output as evidence |
| Pass rule | meet **every** criterion at the two highest severities; **>50% of gating criteria test something other than functional correctness** |

## Leaderboard (public, as of November 2026; 19 models, developer harness or OpenCode, 3 attempts/task)
| Model | Pass rate |
|---|---|
| Claude Fable 5.2 | 52.2% |
| Claude Sonnet 5.5 | 50.6% |
| Claude Opus 5.5 | 46.1% |
| GPT-6.1 Sol / Claude Fable 5.1 / GPT-6 Astra | 31–34% |
| Remaining 13 models | ≤ 18.9% |

## Grader Reliability
In a human-label study, each of three candidate model graders agreed with a software engineer on **85–86% of criterion verdicts** — roughly the same rate as **two engineers agreeing with each other**.

## What the Results Say
- Even the best model passes barely half of attempts: no-functional-correctness gating (hidden hazards, unnecessary-work avoidance, truthful reporting) is where strong attempts still fail.
- Case studies show **one unsupported claim can sink an otherwise strong attempt** — the benchmark operationalizes engineering judgment as two symmetric skills: flagging hidden hazards and avoiding needless work.
- Underspecification is the core difficulty: agents that don't question premises or surface unstated risks fail criteria that SWE-bench-style suites never test.

## How to Use This Reference
- As an evaluation yardstick when selecting coding-agent models for production work on real, messy codebases.
- As a **task-authoring template**: pair underspecified requests with atomic, severity-tagged rubrics where half the gating criteria sit outside functional correctness.
- Caveat: tasks come from private codebases, so reproduction outside the leaderboard requires the authors' harness.

## Relevance to Our Domain
Extends the KB's coding-agent benchmark line (SWE-Bench Pro V2, SWE-Gym audit): shifts the bar from passing tests to staff-engineer judgment, directly informing how we set acceptance criteria for AI-assisted development workflows.

## References
- Paper: https://arxiv.org/abs/2611.30517 (cs.SE, cs.AI, submitted 2026-11-23)
- PDF: https://arxiv.org/pdf/2611.30517
