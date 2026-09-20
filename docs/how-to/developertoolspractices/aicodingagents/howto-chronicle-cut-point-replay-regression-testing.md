---
title: 'Chronicle: Cut-Point Replay for Regression Testing of LLM Agents'
diataxis: How-to
domain: developertoolspractices
topic: aicodingagents
source: arXiv
source_url: https://arxiv.org/abs/2609.20625
arxiv_id: "2609.20625"
date: 2026-09-20
keywords:
- knowledge-base
- aicodingagents
- developertoolspractices
- how-to
visibility: public
---

# Chronicle: Cut-Point Replay for Regression Testing of LLM Agents

## Overview

LLM agent failures are notoriously hard to reproduce: responses are non-deterministic, tools read changing state, and multi-step trajectories rarely repeat on a re-run. Existing record-and-replay tooling records runs only to *trace or score* them — not to test a code change against them. Chronicle closes that gap by recording an agent run at its non-deterministic boundaries as immutable envelopes and replaying from the record. Its central operation, **cut-point replay**, turns a recorded incident into a regression test you can run in continuous integration.

## Problem Statement

You want to fix a bug found in an LLM agent and then *prove* your fix works without re-running the whole non-deterministic trajectory (which won't reproduce). Record-and-replay makes a run reproducible, but current tooling stops at tracing/scoring — it doesn't let you replay a recorded failure against new code to confirm the change is safe. Chronicle's job: make a specific recorded incident into a fast, deterministic regression test.

## Key Contribution

- **Boundary recording**: an agent run is captured at its non-deterministic boundaries (model calls, tool reads of changing state) as immutable "envelopes," making the run replayable.
- **Cut-point replay** — the core operation: serve a *chosen subset* of boundaries from the record while executing the complementary subset live with new code. This lets you test exactly the change under scrutiny without re-running everything.
- A **public benchmark and implementation** (github.com/theagentplane/chronicle) so the approach is reproducible.

## Technical Approach

To use Chronicle: (1) instrument your agent to record each non-deterministic boundary as an immutable envelope; (2) when a failure occurs, save that run's envelopes; (3) for regression testing, pick the boundaries you want fixed from the record and let the rest execute live against your new code. The result is a test that fails on faulty code and passes on guarded/benign changes — runnable in CI with near-zero overhead.

## Results

- On a benchmark of **6 recorded failures** with simulated model boundaries: recording adds only **23 µs per crossing (0.008% of an assumed 300 ms model call)** — negligible overhead.
- **Full replay issues zero model calls** and is bit-stable across 20 repetitions.
- Cut-point tests **fail on faulty code and pass on guarded/benign changes for all 6 incidents**.
- In a mutation study of the guarded tools, cut-point tests catch **every mutant that lets the recorded unsafe action through**, while a baseline that stubs every boundary (same assertion) catches none — proving the value of selective replay over blanket stubbing.

## Relevance to Our Domain

This is a concrete technique for making LLM-agent development testable and CI-friendly. If you maintain agents, Chronicle gives you a way to convert real incidents into fast regression tests without re-running expensive non-deterministic trajectories — with recording overhead so low it's effectively free. The mutation-study result (cut-point catches what blanket stubbing misses) is the key argument for selective boundary replay as a first-class testing primitive.

## References
- Paper: https://arxiv.org/abs/2609.20625
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.20625
- Code & benchmark: https://github.com/theagentplane/chronicle
