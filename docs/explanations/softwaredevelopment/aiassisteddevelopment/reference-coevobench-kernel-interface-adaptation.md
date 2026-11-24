---
title: 'Keeping Up with the Kernel: Can LLMs Adapt Linux Drivers to Interface Changes?'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.24269
date: 2026-11-19
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# Keeping Up with the Kernel: Can LLMs Adapt Linux Drivers to Interface Changes?

## Overview
This paper studies **collateral evolution** in Linux — the coordinated updates drivers need when the kernel interfaces they depend on change — 20 years after it was first studied, and introduces **CoEvoBench**, a benchmark asking LLMs to adapt an old driver module to a target kernel, evaluated against the developer's reference patch.

## Problem Statement
Kernel interface churn forces driver maintainers into mechanical-but-tricky adaptations at scale. Quantified for releases v3.0 → v7.2: since v2.6.13, driver files and support libraries grew ~8×, and a single change to the most widely used library can now reach ~5.3k driver files, arriving either in bursts or spread across many releases. Can LLMs absorb this maintenance burden?

## Benchmark Specification (CoEvoBench)
| Attribute | Value |
|-----------|-------|
| Tasks | 316 manually confirmed tasks |
| Source | 202 mainline commits, 268 modules |
| Kernel range | v6.19 → v7.2 target releases |
| Build-breaking tasks | 134 (old driver fails to compile on target) |
| Build-compatible tasks | 182 (old usage still builds — semantic change only) |
| Ground truth | Developer's reference patch per task |
| Agent harness | CoEvoAgent |
| Configurations | Direct generation, SmPL, mini-SWE-agent (DeepSeek Flash); Direct also with Claude Sonnet 5.5 and GPT-6.1 Sol |

## Key Findings
- With DeepSeek Flash, default Direct generation achieves strict reference agreement on **41.0%** of build-breaking tasks but only **3.3%** of build-compatible tasks — LLMs handle "won't compile" signals well, but the subtle case where old code still builds against changed semantics is nearly unsolved.
- The build-compatible category is the real benchmark differentiator; compile failure alone is a weak proxy for correctness.
- CoEvoBench is, to the authors' knowledge, the **first benchmark** evaluating LLM updates of Linux driver modules against real kernel-developer patches for collateral evolutions.
- Code is publicly released with the paper.

## Why It Matters Methodologically
Any agent-evaluation harness that gates on "does it compile" systematically overstates capability on migration/refactoring work: a patch can build cleanly and still silently miss the semantic change the kernel developer made (e.g. changed locking contract, renamed semantics, altered callback behaviour). Use build-compatible tasks as the hard tier when benchmarking agents on code migration.

## Relevance to Our Domain
A rigorous, ground-truthed benchmark for AI-assisted system software maintenance — useful both as a capability probe for coding agents on low-level code and as a caution: **build-compatible semantic drift is where agents silently fail**, a failure mode relevant to any large-scale automated refactoring we would delegate to agents (cf. [[explanation-llm-c-to-rust-translation-retesting]]).

## References
- Paper: https://arxiv.org/abs/2611.24269
- Related: original collateral-evolution studies in Linux (~20 years prior, v2.6.12 baseline)
