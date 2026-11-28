---
title: Cross-Layer Characterization and AI-Assisted Diagnosis of C-to-Rust Performance
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.33490
date: 2026-11-28
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# Cross-Layer Characterization and AI-Assisted Diagnosis of C-to-Rust Performance

**Authors:** Dalton Davis, Kunal Pai, Tapti Palit

> **Audit note (2026-11-28):** rewritten the same day it was created — the first draft attributed claims to the paper ("0.5–3500% regressions across five LLM translators", "19 functions / 140 implementations", "FerroScope-Pass with MIR/event-stream correspondence maps") that do not exist in it. Everything below is grounded in the arXiv abstract and full text of 2611.33490.

## Overview
FerroScope (arXiv:2611.33490) tackles a deceptively hard question: when you migrate C to Rust, why is the Rust version sometimes slower, and what exactly causes it? Rust is often *claimed* to match C's performance, but runtime safety checks, compiler optimizations, and hardware microarchitecture interact in ways that make performance diagnosis difficult. The paper pairs a systematic cross-layer characterization study with an AI-assisted performance debugger, then turns the diagnoses into a concrete compiler fix.

## Study: 12 Cross-Layer Benchmarks
The authors characterize **12 benchmarks** comprising C implementations and their Rust counterparts across layers. Two findings stand out:
- **Runtime safety checks do not necessarily dominate performance overhead** — compiler and microarchitectural optimizations often mitigate their cost.
- **In 8 of the 12 benchmarks, at least one Rust implementation performs within 10% of its C counterpart or outperforms it** — so blanket "Rust is slower" or "Rust is free" claims both fail; it is workload- and optimization-dependent.

## The FerroScope Tool
FerroScope is an AI-assisted performance debugger that integrates four evidence sources:
1. **source-level analysis**,
2. **compiler optimization remarks** (which optimizations fired or were blocked, and why),
3. **dynamic instruction traces**, and
4. **hardware performance counters**.

The LLM diagnoses performance differences from this structured multi-layer evidence. It reproduces the authors' manual findings and sometimes provides more precise explanations — for example, identifying specific compiler optimizations that were inhibited by redundant bounds checks.

## From Diagnosis to a Compiler Pass
Guided by FerroScope's diagnoses, the authors built an **LLVM compiler pass that hoists redundant bounds checks through guarded loop versioning while preserving Rust's panic behaviour**. Removing the blocked-check obstruction enables downstream optimizations (loop unrolling, conditional-move conversion), with measured results relative to C:
- **Selection Sort overhead: 2.95× → 1.00×**
- **Merge Sort: 1.43× → 0.91×** (i.e. faster than C)

## Relevance to Our Domain
Memory-safety migration is a flagship use case for coding agents, and this paper is a caution: performance regressions in migrated Rust are not explained by any single layer, and "safety checks are the cost" is a myth the data refutes. For AI-assisted pipelines, the recipe that worked is **instrumented observability (optimization remarks + instruction traces + perf counters) feeding an LLM diagnosis loop, which then guides a targeted compiler-level fix** — far more credible than agent-guessing at patch sites from timings alone. See the companion notes in this topic: `explanation-llm-c-to-rust-translation-retesting.md` and `how-to-c-to-rust-llm-spec-translation.md`.

## References
- Paper: https://arxiv.org/abs/2611.33490
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33490
