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
# DVBench — UVM Design Verification Agents

## Overview
Design verification (DV) with the Universal Verification Methodology (UVM) is highly labor-intensive and remains a major hardware-development bottleneck. Existing LLM benchmarks decompose DV into decoupled subtasks, which deviates from the real workflow. DVBench (arXiv:2611.25066, Qian et al.) is the **first end-to-end benchmark for real-world UVM DV agents**: each task requires an agent to independently complete the **full verification workflow**.

## Benchmark Design
- **95 tasks** across **9 functional domains** and **5 difficulty levels**, spanning diverse verification scenarios and design scales.
- **Final-testbench evaluation**: compilation, coverage, and bug detection.
- **Intermediate-artifact evaluation**: feature lists, test plans, reference models — catching agents that produce a compilable testbench via shortcuts while failing the underlying verification reasoning.

## Key Findings (Reference Data)
- Evaluated frontier LLMs (Claude Opus 5.5, GPT-6 Astra) crossed with agent frameworks (Claude Code, Codex, OpenCode).
- The **best agent combination (Codex + GPT-6 Astra) reaches only a 21.05% overall success rate** — substantial headroom remains for complex verification tasks.
- Framework/agent scaffolding materially changes outcomes on top of the base model, confirming that agent tooling is a first-class variable in DV automation, not just the LLM.

## Why It Matters (Explanation)
End-to-end evaluation prevents the "benchmark gaming" that decoupled-subtask suites allow: an agent that writes a feature list well and a testbench badly looks average on decomposed metrics, but fails outright here. The ~21% ceiling defines the real starting line for agentic DV automation — far from replacing verification engineers, but the task structure (workflow completion + artifact grading) is the right template for measuring progress.

## Limitations & Caveats
- Single-company-scale task set; difficulty levels are relative to UVM practice, not an absolute complexity metric.
- Coverage/bug-detection grading depends on the reference suites shipped with each task.

## Relevance to Our Domain
Template for evaluating any long-horizon coding agent: grade the **final artifact** (compiles, passes, finds bugs) **and** intermediate reasoning artifacts (plans, specs, models) separately. Applicable to test-generation agents and CI-integrated code agents generally.

## Provenance & verification
Corrected 2026-11-21 after audit: previous authors (Lin, Lu & Shon) and the figures "6 designs / 240 files / 3,728 lines / 48–63% success / 445 tool ops / 398 turns / 21.05-point framework contribution" were not found in the paper and were removed. All retained claims (95 tasks, 9 domains, 5 difficulty levels, evaluation dimensions, frontier models/frameworks evaluated, 21.05% best overall success rate) verified verbatim against the arXiv abstract (arxiv_meta.xml) and v1 PDF.

## References
- Paper: https://arxiv.org/abs/2611.25066
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25066
- Related: UVM (Accellera standard), prior decoupled DV benchmarks
