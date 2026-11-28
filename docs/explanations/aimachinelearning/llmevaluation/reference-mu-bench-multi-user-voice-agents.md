---
title: '$μ$-Bench: Benchmarking Multi-User Task Completion in Shared Interaction Voice
  Agents'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.34920
date: '2026-11-28'
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
Extends this topic's agent evaluation stack (text-tool-use benchmarks such as τ-bench) to the voice modality with per-user authority/privacy as first-class assertions — directly applicable to shared-assistant product testing.

## Positioning Against Sibling Voice-Agent Benchmarks (added 2026-11-28)
The voice-agent evaluation landscape splits along three axes — grounded task completion, realistic audio, and conversational dynamics. Most prior work covers two of the three; μ-Bench is the first to make *multi-user* authority/privacy the third.

| Benchmark | Origin | Scale | What it actually stresses | Known weakness it exposes |
|---|---|---|---|---|
| **μ-Bench** (this note) | — | 20 domains / 100 scenarios / 800 cases / 13 agents | Joint multi-user goals, per-user authority, reactive simulated participants | Multi-turn **attribution & threading** (open-weight &lt;20%) |
| **Full-Duplex-Bench-v3 (FDB-v3)** | DanielLin94144/Full-Duplex-Bench | multi-step tool calling | Multi-step tool use under real human **disfluency** | Synthetic tasks, no real tool side effects |
| **MultiVox** | arXiv:2507.10859 | omni voice-assistant suite | Assistant ability across modalities | Single-user framing |
| **τ-Voice** | Sierra + Princeton | **278 tasks** (retail 114 / airline 50 / telecom 114) | Grounded DB-state task completion under noise (~15 dB SNR, ~2% frame drops via Gilbert-Elliott, 20% muffling, 8 kHz G.711, 5 accent personas) | Best voice agent **38%** realistic vs **85%** for GPT-5 in text, **54%** for GPT-4.1 |

Two transferable lessons from τ-Voice apply directly to μ-Bench builds: (1) run a **clean vs. realistic audio two-pass** so the gap separates capability from robustness — μ-Bench's acoustics variation serves the same role; (2) score only **verifiable terminal state** (μ-Bench's JTS/Pure JTS) rather than confidence proxies. Where τ-Voice ends at one user plus one agent, μ-Bench's JTS assertion set — all goals, privacy boundaries, and terminal states holding *jointly* — is the extension that catches the failure modes shared assistants actually ship with.

## References
- Paper: https://arxiv.org/abs/2611.34920
- Full-Duplex-Bench (incl. FDB-v3 tool-use track): https://github.com/DanielLin94144/Full-Duplex-Bench
- MultiVox: https://arxiv.org/html/2507.10859v2
- τ-Voice benchmark walkthrough (Sierra/Princeton, 278 tasks): https://www.arunbaby.com/speech-tech/0066-tau-voice-benchmark-full-duplex-voice-agents/
