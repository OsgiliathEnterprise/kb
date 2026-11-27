---
title: '$μ$-Bench: Benchmarking Multi-User Task Completion in Shared Interaction Voice
  Agents'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.34920
date: '2026-11-27'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Reference: μ-Bench — Multi-User Shared-Channel Voice Agent Benchmark

## Overview
Lin, Chen, Zheng et al. (arXiv:2611.34920, submitted 2026-11-25) introduce **μ-Bench**, a benchmark for **joint task completion in closed-loop, full-duplex multi-user voice interaction**. Voice agents in shared spaces (rooms, cars) must satisfy interdependent multi-user requests while upholding per-user authority, privacy, and task constraints — and real participants *react throughout the session*, something prior evaluations barely cover. Simulated participants act from isolated profiles of goals, knowledge, and permissions, and adapt to the agent's speech and tool outcomes.

## Benchmark Specification

| Parameter | Value |
|---|---|
| Domains | 20 |
| Scenarios | 100 |
| Evaluation cases | 800 total — **408 tool-augmented, 392 tool-free** |
| Session model | Closed-loop, full-duplex; reactive simulated participants |
| Scenario variation | group size, acoustics, follow-up demands |
| Systems evaluated | 13 voice agents (proprietary + open-weight) |

## Metrics

| Metric | Definition |
|---|---|
| **JTS** (Joint Task Success) | All user goals, privacy boundaries, and terminal states hold *jointly* |
| **Pure JTS** | JTS **plus** no unauthorized tool calls |
| **ATC diagnostics** | **Attribution, Threading, Coordination** — failure-localisation axes |

## Key Results
- **Proprietary systems peak at 62.24% tool-free / 65.44% tool-augmented** joint success.
- **Open-weight models remain below 20%**; ATC diagnostics show they lag primarily in **multi-turn attribution and threading**.
- Controlled contrasts: **larger groups consistently degrade joint task success**, even for the capable systems.

## How to Use
- Report **Pure JTS** (not JTS) when tool access is in play — unauthorized tool calls are the security-relevant failure it isolates.
- Use the Attribution/Threading/Coordination diagnostic split to localise regressions in multi-user agent builds.

## Relevance to Our Domain
Extends this topic's agent evaluation stack ([[reference-tau-bench-agent-evaluation]]) to the voice modality with per-user authority/privacy as first-class assertions — directly applicable to shared-assistant product testing.

## References
- Paper: https://arxiv.org/abs/2611.34920
