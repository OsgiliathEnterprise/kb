---
title: 'DVBench: End-to-End Benchmark for Real-World UVM Design Verification Agents'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.25066
date: 2026-11-21
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# DVBench: End-to-End Benchmark for Real-World UVM Design Verification Agents

## Overview
DVBench (arXiv:2611.25066, Lin, Lu & Shon) is the first **end-to-end, environment-grounded benchmark** for LLM agents performing industrial hardware design verification. Verification of application-specific integrated circuits is a key testbed for software-engineering agents because a verification engineer's real workflow is a multi-stage loop: analyze specs → write SystemVerilog/UVM code → compile → debug. Existing benchmarks only cover isolated snippets (single-file, single-file generation), not this loop.

## Benchmark Specification (Reference)
| Property | Value |
|----------|-------|
| Design IP blocks | 151 (commercially realistic) |
| UVM files | 1,015 |
| Design specifications | 259 (architectural + register specs, 16,111 lines) |
| Compilation test cases | 445 |
| Coverage targets | 398 |
| Suggested verification scenarios | 264 |
| Interaction turns per task | up to 86 |
| Tool operations per task | up to 1,062 |
| Source | industry-partner projects + curated open-source IP |

## Evaluation Dimensions
The framework measures four complementary signals instead of a single pass/fail:
1. **Compilation success** — does generated UVM code compile?
2. **Functional coverage** — does it reach coverage targets?
3. **Scenario completion** — are suggested verification scenarios satisfied?
4. **Interaction efficiency** — how many turns/tool calls to get there?

## Key Findings
- Frontier coding agents (Claude Code, Codex) complete **48–63%** of end-to-end tasks.
- Dominant failure mode is **multi-file codebase navigation** — agents struggle to locate and consistently modify code spread across many UVM files.
- Agentic verification requires **long-horizon planning and precise tool use**, far beyond code generation alone.

## Relevance to Our Domain
The 48–63% completion rate on a genuinely multi-stage, multi-file engineering loop is a calibration point for coding-agent expectations generally: generation quality is not the bottleneck on real repos — navigation and long-horizon tool orchestration are. The four-dimension evaluation template (compile / coverage / scenario / efficiency) generalizes to any agentic software-engineering benchmark we build.

## References
- Paper: https://arxiv.org/abs/2611.25066
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25066
- Related: UVM (Universal Verification Methodology), SystemVerilog; prior snippet-level RTL/VVM generation benchmarks
