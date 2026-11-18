---
title: 'When Passing Checks Do Not Establish Completion: Evidence Interpretation in
  Coding Agents'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.22835
date: '2026-11-18'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# When Passing Checks Do Not Establish Completion: Evidence Interpretation in Coding Agents

## Overview
Saiya & Eshete attack an assumption buried inside agentic coding benchmarks: that **passing executable checks = task completion**. In practice, agent trajectories produce many signals (tests, linters, build outputs, file reads, tool traces) and pass/fail requires interpreting them. The authors introduce **evidential validity** — whether the evidence the agent relied on actually supports its completion claim — and show it fails in a distinctive way.

## Problem Statement
Benchmark validity rests on executable checks, but pass/fail outcomes are *derived* from raw signals through an interpretation process. Two gaps hide there: (1) agents themselves interpret evidence and may **mistranslate** it, and (2) benchmarks themselves inherit **oracle defects** that mis-score otherwise-correct completions.

## Key Contribution
- Formalizes **evidential validity** and decomposes its two components: agent-side evidence interpretation and benchmark-side oracle interpretation.
- **Agent-side study**: on four coding benchmarks, ~**1,200 traces** across **five models** — agents mistranslate signals in systematic ways that pass/fail outcomes alone would not predict, and this interpretation failure persists across a **delayed-feedback condition**.
- **Benchmark-side study**: a curated **20-task adversarial suite** of oracle defects (hidden-test issues, fixture issues, build/test configuration issues) that expose scoring divergence on otherwise-correct completions.
- Practical implication: both sides need repair — agent interpretation auditing and **differential scoring** (scoring the same completion under alternative oracle interpretations) to separate real failures from scoring artifacts.

## Results (headline)
- Passing checks overstates completion in two orthogonal ways: agents *believe* they're done on misread signals, and correct agents get scored as failing by defective oracles.
- The failure modes are stable under delayed feedback, so they are not artifacts of the harness timing.

## Relevance to Our Domain
Critical for how we evaluate and trust our own coding agents (Claude Code / Codex relay setups, ServerBench-style serving evals): a green test suite is *evidence to be interpreted*, not completion. Adopt two habits from the paper — audit agent completion claims against raw tool traces, and when an agent disagrees with a benchmark verdict, differential-score before trusting the oracle. Reinforces the Resolution Hypothesis finding that eval noise dominates method gaps. Related: [[explanation-resolution-hypothesis-agent-evolution]], [[reference-serverbench-coding-agents-serving-systems]], [[reference-swe-bench-pro-v2-coding-benchmark]].

## References
- Paper: https://arxiv.org/abs/2611.22835
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22835
