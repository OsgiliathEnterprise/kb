---
title: FastCI — Efficient GPU-Intensive CI for LLM Training Frameworks
diataxis: How-to Guide
domain: developer-tools-practices
topic: ci-performance
source: arXiv
source_url: https://arxiv.org/abs/2610.01967
date: 2026-10-04
keywords:
- knowledge-base
- ci-performance
- developer-tools-practices
- how-to
---
# FastCI — Efficient GPU-Intensive CI for LLM Training Frameworks

## Overview

FastCI is a framework that makes continuous integration practical for LLM *training* frameworks, where tests are GPU-intensive (often full model training or evaluation runs) and CI itself becomes the bottleneck for fast-paced development. It combines three levers: select only affected tests using runtime evidence, prune tests that execute changed code in equivalent contexts, prioritize high-risk tests to surface failures early, and optimize test workloads along dimensions outside each test's intended validation scope.

## Problem Statement

Unlike traditional software, CI for LLM training frameworks relies on GPU-intensive tests — frequently complete model training or evaluation runs. As models grow, running the full suite per change makes CI a new bottleneck that slows development. The challenge is to run *enough* of the expensive suite to catch regressions without paying for every test on every commit.

## Key Contribution

- **Runtime-evidence-based test selection**: choose affected tests from actual runtime evidence rather than static dependency analysis alone.
- **Context-equivalence pruning**: drop tests that execute changed code in contexts equivalent to ones already covered, avoiding redundant expensive runs.
- **Risk prioritization + workload optimization**: run high-risk tests first (fail fast) and optimize test workloads along dimensions outside each test's intended validation scope (e.g., smaller model sizes / shorter runs where the test's purpose allows).

## Technical Approach

FastCI builds a runtime-evidence graph of which code paths each GPU-intensive test actually exercises. On a change, it selects tests whose evidence overlaps the diff, then prunes those that would re-execute changed code in an already-covered context. Remaining tests are ordered by risk so likely failures surface first, and their workloads are shrunk along non-essential dimensions (model scale, sequence length, step count) without invalidating what each test is meant to validate.

Implementation details from the full paper:

- **Evidence collection**: lightweight sampling of runtime traces from GPU-intensive tests, organized into a graph recording functions and calls observed per test. The graph must be continuously updated as the codebase evolves; if a change lacks corresponding entities (incomplete evidence), selection is deliberately broadened to avoid omitting affected tests.
- **Two complementary risk indicators** for scheduling: (1) historical associations between code changes and test failures — specific to the current diff but weak for newly added modules; (2) recent instability/flakiness of each test — captures environment/dependency-caused failures but is less change-specific. Together they prioritize tests likely to fail *and* worth failing on.
- **Workload reduction as config overrides**: reductions are applied when submitting a test to the existing CI runner, without modifying test code. Dimensions unrelated to a test's intended validation scope (identified via test metadata + historical execution paths) are reduced automatically; unidentifiable dimensions stay unchanged. In practice, shrinking model size and disabling production options (logging, metrics collection) accelerated tests with identical outcomes in their comparisons.
- **Self-verifying reductions**: FastCI periodically runs the same test under both original and reduced workloads and compares pass/fail outcomes. A reduction is retained only while outcomes agree — otherwise the original workload is restored. This lets it withdraw an accepted reduction when code or test behavior changes, bounding the risk of missing failures that appear only at full scale.

## Results

Evaluated on the CI workload of the authors' LLM training framework:
- **CI latency reduced 77.5%** and **GPU resource usage reduced 63.9%** versus path-based test selection (the previously deployed pipeline).
- **Modified-code coverage retention improved by 3.2%** — i.e., it runs fewer tests but covers *more* of the changed code, not less; runtime evidence recovers affected tests that file-level mappings miss.
- **GPU resource usage before exposing the first failure cut by 89.2%** vs FIFO test scheduling (risk-aware ordering).
- In production at ByteDance with FastCI handling the CI workload: average CI latency reduced **58.4%**.

## Relevance to Our Domain

A directly applicable pattern for any team whose CI involves expensive GPU workloads: instrument tests with runtime evidence, select by diff overlap, prune context-equivalent duplicates, prioritize by risk, and shrink non-essential workload dimensions — with a verification loop that proves the shrunk runs still agree with full-scale outcomes. The "coverage retention up while latency down" result is the key selling point — it shows you can cut cost *and* improve effective coverage simultaneously rather than trading one for the other. Complementary patterns from GPU CI practice: cheap preflight smoke tests before expensive jobs, quota-aware scheduling of scarce accelerators, and ephemeral per-branch environments with guaranteed teardown (artifact capture + quota release).

## References

- Paper: https://arxiv.org/abs/2610.01967
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.01967
