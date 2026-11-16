---
title: 'VelServe: Taming Decode Jitters in LLM Inference with Tail-Calibrated Scheduling'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.18392
date: '2026-11-16'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# VelServe: Taming Decode Jitters in LLM Inference with Tail-Calibrated Scheduling

## Overview
Interactive LLM services must meet latency SLOs on two axes: time-to-first-token (TTFT) and time-between-tokens (TBT), since streaming and soft-real-time applications need predictable token delivery. The paper identifies **decode jitters** — occasional overruns of a decode step's iteration latency — in both aggregated and disaggregated serving. A jitter delays every request in the batch, and long responses span hundreds of steps, so even rare overruns multiply into many SLO violations. VelServe is a scheduler that calibrates how much prefill work each decode step carries using the **measured tail of that instance's own iteration latency**.

## Problem Statement
SLO-aware schedulers in aggregated serving set each step's prefill budget until predicted latency just meets the TBT target — leaving zero headroom for mispredictions or host stalls. Disaggregation meets average TBT targets at a capacity cost, yet steps that admit new requests still run late. Optimizing the mean, not the tail, is what leaks SLO violations.

## Key Contribution
- **Tail-calibrated prefill budgeting**: the SLO determines how rare a late step must be; VelServe leaves per-iteration headroom sized from the measured iteration-latency tail so overruns don't breach the target decode latency.
- **Shortest-waiting-prompt-first ordering** to offset the prefill slowdown the headroom causes — sound because TTFT deadlines grow with prompt length, so the long prompts it delays have the most slack.
- **Admission spacing under disaggregation** so no request waits behind a burst of admissions.
- **Disaggregated deployment** of the same calibration.

## Results
Measured against the strongest baseline under P99 TBT SLOs, across three attention families and varying workloads:
- VelServe sustains **2.4–2.9× the SLO goodput** of the strongest baseline on Qwen3-8B and DeepSeek-V4-Flash, and **at least 4.4×** on DeepSeek-V2-Lite.
- With prefill and decode disaggregated on eight GPUs, the calibrated admission spacing preserves the goodput advantage.

## Relevance to Our Domain
Interactive agent and chat workloads on shared GPU serving platforms are judged on perceived smoothness, not averages — TBT tail control is the difference between "fast model" and "glitchy model". Sizing deployments by SLO goodput (the highest request rate where most requests still meet their SLO) rather than mean latency is directly applicable to serving dashboards and admission control in our GPU fleet. Related: [[explanation-prefill-fairness-decode-interference-agentic-serving]].

## References
- Paper: https://arxiv.org/abs/2611.18392
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18392
