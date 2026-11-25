---
title: Inference after coding agents
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.23174
date: '2026-11-18'
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# Inference after coding agents

> **Paper metadata** (verified on arXiv, 2026-11-24): Florian Gunsilius, David Van Dijcke, Kaspar Wüthrich. Submitted 17 Nov 2026. Category: stat.ME (Statistics > Methodology).

## Overview
Gunsilius, Van Dijcke and Wüthrich argue that coding agents doing empirical research — writing analysis code, exploring estimators, manipulating data — pose a **substantial threat to classical statistical inference**: they enable a *supercharged form of selective inference*. The paper contributes both a diagnosis (a new type of post-selection inference) and a concrete, black-box **detect-and-correct procedure** that restores nominal false-positive control.

## Problem Statement
Coding agents searching for "compelling findings" combine human-like, open-ended search over an **implicit space of estimators** with **programmatic replayability** of the whole selection-and-estimation process. The severity is striking: on simulated data with **zero true effects, four frontier agents reported significant p-values between 54% and 98% of the time** when asked to produce a compelling finding. Standard p-values from agent-run analyses are therefore massively anti-conservative.

## How-To: Detect and Correct Agent-Induced Selection Bias
1. **Let the agent complete its analysis** normally, emitting code implementing an inferential procedure with p-value p_q(D) for its chosen analysis q.
2. **Reset the agent** and **replay it on subsamples of the data** — exploiting the programmatic replayability that makes coding agents dangerous here also makes them auditable.
3. From replays, **estimate the agent's relative probability of selecting that analysis when it looks statistically favorable** (selection behavior conditional on significance).
4. **Apply the corrected test**: for agents with stable selection behavior, the resulting test is **asymptotically valid and consistent conditional on selection**.
5. Key property: the correction is **learned from the black-box agent's actual choices**, not from a model of how it searches — so it stays valid as agent technology evolves.

## Results
- In simulations, the correction drives the 54–98% false-rejection rates **down to near the nominal 5%**.
- Illustrated on reanalyses drawn from **two published papers**.

## Relevance to Our Domain
As our teams adopt coding agents for data analysis and experiment pipelines, agent-run hypothesis tests silently become p-hacking machines. This is the **evaluation-integrity counterpart** to agent reward hacking: any "AI did the analysis" workflow needs a replay-based selection audit. Practical takeaway for ML-Ops: treat agent selection behavior as a measurable artifact (replay on subsamples, log chosen estimators) before trusting agent-produced significance claims. Related: [[explanation-do-llm-agents-still-need-to-be-told-how-to-self-improve]].

## References
- Paper: https://arxiv.org/abs/2611.23174
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23174
