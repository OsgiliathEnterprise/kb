---
title: 'Readie: Low-Latency Code Sandboxes for AI Agents'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.22171
date: 2026-11-18
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Readie: Low-Latency Code Sandboxes for AI Agents

## Overview

Agents from quantitative research to personal assistance act by iteratively generating and executing code, and many decouple the harness from execution by offloading it to **code sandboxes** — which suffer from slow startup. Readie's insight: it is hard for a *single* snapshot to be both compact and to cover the artifacts (packages, datasets) that diverse agent-generated code needs, but **a set of small snapshots can achieve both**. Readie *learns* that set by formulating snapshot construction as an optimization problem, cutting startup latency by **3–22×** and end-to-end runtime by **1.3–3.3×** versus existing approaches at the same storage budget.

## Problem Statement

Existing sandboxes pre-warm either a custom snapshot or a single fat image. Either way the root cause of slow startup is the same: **no compact, pre-warmed snapshot exists that covers nearly all the artifacts diverse agent-generated code requires** — so most executions fall back to slow cold paths.

## Key Contribution

- **Learned startup snapshots**: instead of one all-covering snapshot, a *portfolio* of small snapshots, each initializing quickly and covering a fraction of agent-generated code, jointly covering most of it.
- Formulation of snapshot-portfolio construction as an **optimization problem**, solved with an **approximation algorithm**, and learned from a large training workload.
- Evaluation planned on **15K public and LLM-synthesized scripts**: **3–22× lower startup latency**, **1.3–3.3× lower end-to-end runtime** at equal storage budget.

## Technical Approach

Readie treats the storage budget as fixed and asks which snapshot set maximizes coverage per byte. Each snapshot is small — fast to initialize — and targets a cluster of related workloads (shared packages/datasets); the approximation algorithm selects the portfolio that maximizes expected coverage of the observed agent-code workload. At execution time, an incoming agent script is matched to whichever snapshot covers it, spawning from a pre-warmed state rather than a fat image or cold boot; scripts outside portfolio coverage take the existing slow path.

## Results

- Startup latency: **3–22×** reduction vs existing approaches at the same storage budget.
- End-to-end runtime of agent workloads: **1.3–3.3×** reduction.
- Training workload for portfolio learning: 15K public + LLM-synthesized scripts.

## Relevance to Our Domain

Sandbox startup is the latency floor of code-executing agent pipelines (Hermes-style tool loops, code-interpreter tools, evaluation harnesses). The portfolio-snapshot pattern — learn a small set of warm images from the *observed* workload distribution rather than engineering one golden image — applies directly to any CI/agent fleet that pays container cold-start taxes, and generalizes beyond sandboxes to warm-pool design.

## References

- Paper: https://arxiv.org/abs/2611.22171 (submitted 2026-11-17, cs.DB)
- Related: [[how-to-fast-serverless-llm-cold-starts-cairn]] — cold-start collapse on the serving side
