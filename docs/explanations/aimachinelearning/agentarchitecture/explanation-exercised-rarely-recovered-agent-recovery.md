---
title: 'Exercised, Rarely Recovered: What Public Reports Say About Recovery in 50
  AI Agent Harnesses and Runtimes'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.27090
date: '2026-11-23'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Exercised, Rarely Recovered: What Public Reports Say About Recovery in 50 AI Agent Harnesses and Runtimes

## Overview
Every serious agent deployment eventually hits the same incidents: the agent deletes the wrong files, or a six-hour run dies near completion. The assumed safety net is recovery machinery — checkpoint/resume, undo, approvals, logs — and, in research runtimes, stronger promises like saga-style compensation and transactional rollback. This paper audits what public evidence actually shows about whether any of it works *in real use*, grading 50 systems under a pre-frozen protocol. The headline: recovery is exercised nearly everywhere but *succeeds fully less than a sixth of the time*.

## Problem Statement
Vendor claims and benchmark evaluations answer different questions from "has anyone recovered a real run with this mechanism?" Research runtimes publish benchmark evidence for guarantees; production harnesses ship mechanisms with no systematic evidence at all. Nobody had compared the two evidence classes on a common rubric.

## Key Contribution
- A grading protocol frozen before data collection, applied to **12 persistent agent runtimes, 26 coding-agent harnesses, and 12 research runtimes** across **8 recovery mechanisms**, scored from "not found" to "exercised in a real run" — with two blind coding passes, adjudication, and re-verification against archived sources.
- Field evidence: 11/12 runtimes and 25/26 harnesses have ≥1 real-use recovery report — adoption is universal.
- Success evidence: of **128 real-use reports, only 19 describe full recovery**; 54 partial, 45 outright failed. Checkpoint/resume fully recovered in **1 of 27** reports; rollback in **1 of 15**.
- The mirror-image finding on research runtimes: their guarantees are benchmarked but have **zero reported operational use**, and their flagship guarantee — compensation of external effects — is offered by **no production harness at all**.

## Technical Approach
The study's core methodological move is separating *exercise* (was the mechanism used in a real run?) from *outcome* (did the run actually recover?), then requiring archived, verifiable public reports. Blind double-coding with adjudication guards against grader drift. This exposes gaps invisible to both marketing pages (which stop at "we have undo") and benchmarks (which stop at "guarantee holds in simulation").

## Results
Adoption ≈ 100%, full-recovery rate ≈ 15% (19/128). The exercise/assurance mismatch — production mechanisms without guarantees, research guarantees without field use — defines an open engineering gap, most acutely for compensating external side effects (emails sent, tickets filed, purchases made).

## Relevance to Our Domain
Our agent infrastructure runs long-lived coding and operations agents; this note should temper default trust in harness checkpoint/undo features. Practical implications: treat in-run recovery as best-effort, externalize durability (git commits per step, idempotent tool design, out-of-band state snapshots), and recognize that no current harness can compensate external API side effects — design tools to be reversible *before* calling them.

## References
- Paper: https://arxiv.org/abs/2611.27090
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27090
- Related KB notes: `ai-machine-learning/agent-architecture/explanation-agents-that-die-well-failure-runs-agent-teams.md`, `ai-machine-learning/agent-architecture/reference-terminus-2-agent-runtime-spawnpool.md`
