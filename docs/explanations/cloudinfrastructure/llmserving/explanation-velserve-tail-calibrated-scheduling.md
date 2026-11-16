---
title: VelServe — Taming Decode Jitters in LLM Inference with Tail-Calibrated Scheduling
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
LLM serving SLOs have two asymmetric halves: time-to-first-token (TTFT) is a *first* latency measured once, while time-per-output-token (TPOT) is a *repeated* per-token delay experienced continuously. Existing SLO-driven schedulers treat both as first-latency objectives, so they ignore per-token stability: a request can satisfy its average TPOT yet suffer a token "stall storm" late in decoding and deliver a terrible user experience. VelServe is a cross-instance scheduler that optimizes the **tail** of per-token delay instead of the mean, via a lightweight "tail predictor" calibrated by online probing.

## Problem Statement
Aggregation and piggybacking decisions made purely on first-latency grounds leave severe per-token jitter uncontrolled. Because the SLO is met on average, schedulers never see (or prevent) bursts of token stalls concentrated at the end of requests — exactly where users notice them.

## Key Contribution
- **Asymmetry analysis of TTFT vs TPOT**: first-latency vs repeated-latency framing of the serving SLO problem.
- **Tail predictor**: estimates per-token jitter *without any extra measurement*, using historical system states.
- **Online probing calibration**: corrects prediction errors as the system drifts, keeping the tail estimate trustworthy.
- **Jitter-aware cross-instance scheduling**: aggregation and piggybacking decisions driven by predicted token-delay tails.

## Technical Approach
The scheduler observes historical system state to predict per-token delay distributions; periodic online probes recalibrate the predictor. Requests predicted to stall are re-placed (aggregation/piggybacking choices) so their late-decoding tokens avoid contended batches.

## Results
Across workloads and model scales:
- TPOT tail latency reduced by **53.6%** on average, up to **69.8%**
- **2.4×** more requests admitted under a 100 ms TPOT SLO

## Relevance to Our Domain
Interactive agent and chat workloads on shared GPU serving platforms are judged on perceived smoothness, not averages — TPOT tail control is the difference between "fast model" and "glitchy model". VelServe's no-extra-instrumentation tail predictor is directly applicable to serving SLO dashboards and admission control in our GPU fleet. Related: [[explanation-prefill-fairness-decode-interference-agentic-serving]].

## References
- Paper: https://arxiv.org/abs/2611.18392
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18392
