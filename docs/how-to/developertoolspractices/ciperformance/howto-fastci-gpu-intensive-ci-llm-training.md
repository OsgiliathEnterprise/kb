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

## Results

Evaluated on the CI workload of the authors' LLM training framework:
- **CI latency reduced 77.5%** and **GPU resource usage reduced 63.9%** versus the currently deployed pipeline.
- **Modified-code coverage retention improved by 3.2%** — i.e., it runs fewer tests but covers *more* of the changed code, not less.
- FastCI is now integrated into the CI pipelines of the authors' LLM training framework at ByteDance (production deployment).

## Relevance to Our Domain

A directly applicable pattern for any team whose CI involves expensive GPU workloads: instrument tests with runtime evidence, select by diff overlap, prune context-equivalent duplicates, prioritize by risk, and shrink non-essential workload dimensions. The "coverage retention up while latency down" result is the key selling point — it shows you can cut cost *and* improve effective coverage simultaneously rather than trading one for the other.

## References

- Paper: https://arxiv.org/abs/2610.01967
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.01967
