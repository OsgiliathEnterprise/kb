---
title: 'MLIR-MRacle: Memory-Model-Aware Metamorphic Fuzzing of Concurrent MLIR'
diataxis: Explanation
domain: security-privacy
topic: fuzzing
source: arXiv
source_url: https://arxiv.org/abs/2611.24804
keywords:
- knowledge-base
- fuzzing
- security-privacy
- explanations
---
# MLIR-MRacle: Memory-Model-Aware Metamorphic Fuzzing of Concurrent MLIR

## Overview
MLIR-MRacle is the first fuzzing framework for **concurrent MLIR** programs that is aware of hardware memory models (x86-TSO and other mainstream relaxed models). It finds real MLIR miscompilation bugs by combining a memory-model-guided IR generator with memory-model-aware metamorphic testing — avoiding the false positives and missed bugs of prior approaches.

## Problem Statement
Compiler bugs are security bugs (speculative execution, transient execution side channels). Fuzzers like Csmith found many C/C++ compiler bugs, but the MLIR compiler infrastructure — the de facto substrate for AI and heterogeneous compilers — remained relatively unexplored. The gap: no existing fuzzer systematically targets concurrency bugs in MLIR. Prior attempts (Sisyphus) fuzz only sequentially consistent programs and ignore relaxed memory models; MLIRFuzz produces only syntactically valid IR, ignoring semantic correctness.

## Key Contribution
- **Memory-model-aware IR generation**: a declarative, extensible memory-model specification language; the generator derives concurrent IR from a user-declared memory model (supports x86-TSO and other mainstream models).
- **Memory-model-aware metamorphic testing**: a new equivalence criterion for judging concurrency bugs, based on **allowed reorderings** (transformations the memory model permits) rather than generic heuristics — this is what filters false positives without missing real bugs.
- **Extensibility**: memory-model definitions, metamorphic transformation rules, and input operators for generation are all extensible — the framework is designed as an open testing platform (open source: github.com/Soft-X-Lab/MLIR-MRacle).

## Technical Approach
The fuzzer generates concurrent MLIR programs whose permitted behaviors follow the declared memory model, applies metamorphic transformations that the memory model certifies as equivalence-preserving, and flags divergences between the original and transformed program's executions as candidate miscompilation bugs. Because the equivalence relation is memory-model-derived, relaxed-model programs can be tested — the class of bugs Sisyphus cannot reach.

## Results
- Found **41 unique miscompilation bugs** across three production-grade MLIR-based compilers.
- **31 fixed** at the time of publication.
- All confirmed by the corresponding developers; no false positives reported.

## Relevance to Our Domain
Expands the KB's fuzzing coverage into compiler-infrastructure security: MLIR underpins AI accelerators and heterogeneous compilation, so its miscompilations silently undermine every program built on it — and they are the same class of bug that enabled transient-execution side channels. The extensible memory-model spec + allowed-reordering metamorphic criterion is a reusable pattern for testing any concurrent lowering pipeline.

## References
- Paper: https://arxiv.org/abs/2611.24804
- Code: https://github.com/Soft-X-Lab/MLIR-MRacle
- Related: [[howto-build-asan-fuzz-harness-for-your-parser]], [[explanation-strcat-vs-strncat-buffer-overflow]]
