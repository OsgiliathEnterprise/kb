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

## Overview
FerroScope (arXiv:2611.33490) is a tool for measuring and diagnosing why translated Rust runs faster or slower than the C it replaced. Rather than trusting benchmark timing deltas, it attributes them across the whole compilation stack — source, MIR, LLVM IR, and machine code — through cross-layer correspondence maps and a unified event stream, then uses LLMs to diagnose the root causes from that structured evidence.

## Problem Statement
C-to-Rust translation tools produce code that is functionally correct *and* measurably slower, with regressions ranging from 0.5 % to 3500 % across five state-of-the-art LLM-based translators on the same inputs. Existing analysis stacks can't explain why: the same logical operation gets retyped, renamed, split, merged, and restructured as it flows through compiler passes, so timing changes can't be traced to responsible code transformations.

## Key Contribution
- **FerroScope-Pass**, an LLVM pass that emits typed, versioned observations across the compilation pipeline, maintaining explicit correspondences between Rust/C source, MIR, LLVM IR, and machine code.
- **Unified event model**: timing, pass, IR, and hardware events are tagged with program-site identifiers and joined on them, so performance effects can be attributed to specific transformations at specific sites.
- **LLM-assisted diagnosis** on top of the structured evidence — LLMs perform the semantic attribution that manual inspection of cross-layer traces can't scale to.
- **Empirical findings**: regressions trace to identifiable mechanisms — runtime bounds checking, iterator desugaring, ABI and type-system conversions, generic instantiations, allocation handling, and library-semantic changes. Validated on 19 functions across 5 C projects, with 140 translated implementations.

## Technical Approach
Translation is run under a fixed toolchain and compilation flags, instrumented from LLVM onward; cross-layer maps keep every observation anchored to a source location despite retyping and restructuring. The event stream makes a regression a queryable object ("which pass at which site introduced this slowdown?") instead of a black-box timing gap — a precondition for any credible agent-based repair loop.

## Relevance to Our Domain
Memory-safety migration is a flagship use case for coding agents, and this paper is a caution: LLM translators ship silent performance bugs that only cross-layer observability can localize. For AI-assisted development pipelines it argues for instrumented translation flows (typed observations + site-keyed events) as the substrate on which agentic optimization — profile, diagnose, patch, re-profile — can actually work. Compare the companion note `explanation-automated-memory-safety-migration-systematic-review.md` in this topic.

## References
- Paper: https://arxiv.org/abs/2611.33490
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33490
