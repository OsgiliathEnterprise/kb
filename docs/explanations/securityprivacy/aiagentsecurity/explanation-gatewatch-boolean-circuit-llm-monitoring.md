---
title: 'GateWatch: Low-Overhead LLM Monitoring with Boolean Circuits'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.24619
date: 2026-11-19
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# GateWatch: Low-Overhead LLM Monitoring with Boolean Circuits

## Overview
GateWatch is a compact, interpretable behavior-monitor for deployed LLMs and agents. It expresses its entire decision rule as an explicit Boolean logic circuit over a handful of binarized sparse-autoencoder (SAE) features, and its serving companion GateWatchServe computes only the selected features and evaluates probes with lookup tables — making always-on safety monitoring nearly free inside vLLM.

## Problem Statement
Monitoring LLM/agent behavior for unsafe or unintended actions needs efficient classifiers. Activation probes on raw activations are cheap but uninterpretable; SAE-based probes are interpretable but typically use additive classifiers over large SAE encoders — hurting interpretability and wasting memory and inference time.

## Key Contribution
- **Whole-rule transparency:** the decision is an explicit Boolean circuit over a small set of binarized SAE features — auditable logic, not a hidden-weight head.
- **Three construction approaches** for building circuits under a specified gate budget.
- **GateWatchServe deployment layer:** computes only the SAE features a circuit actually needs, streams their binary values across layers during inference, and evaluates many GateWatch classifiers in parallel via compact lookup tables.

## Technical Approach
Given a trained SAE, binarize feature activations, then search/construct a gate-budgeted Boolean circuit separating monitored behaviors. At serve time, only selected features are encoded; binary values flow layer-to-layer and LUT evaluation keeps per-token overhead negligible.

## Results
- 24 tasks on Gemma-2-9B: **80.49% mean test accuracy with ~3.8 SAE features and ~3.5 gates per probe** — just **1.17 points below full 16K-feature SAE probes**, matching or beating them on 10 tasks, with **99.98% less probe memory**.
- Inside vLLM: **1,000 concurrent multi-layer, multi-token classifiers retain 97–98% of baseline throughput and 99.8% of KV-cache capacity**.

## Relevance to Our Domain
Makes runtime guardrails on agent fleets economically viable: thousands of behavioral monitors per serving instance at ~2% throughput cost, with human-readable decision logic for incident review and compliance. Relevant to agent sandbox/gateway designs and our runtime-monitoring security stack.

## References
- Paper: https://arxiv.org/abs/2611.24619
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24619
