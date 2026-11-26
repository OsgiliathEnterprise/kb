---
title: 'Sightline: Calibrated Data-Flow Summaries for LLM-Integrated Applications'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.26221
date: 2026-11-22
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Sightline: Calibrated Data-Flow Summaries for LLM-Integrated Applications

## Overview

When a program calls an LLM, filling prompt placeholders with program values and consuming the output, the call crosses the **NL/PL boundary** between natural language and programming language. Static analyses that want to follow data across that boundary need a *data-flow summary* — which placeholders actually reach the output — but no code describes what the model does. Sightline computes those summaries by probing attention, with a mechanized theory and statistical calibration that bound how many true flows may be missed.

## Problem Statement

Existing analyses of LLM-integrated applications face a bad dichotomy: **taint every output with every input** (sound but useless — spurious flows flood the analysis) or **ask a second model to label each call** (accurate but costly at scale). Prior signal-based approaches have concrete failure modes: log-probability-gradient and Fisher signals of existing methods vanish on confident outputs, and single-span removal fails on duplicated content.

## Key Contribution

- **Mechanized theory (Lean 4)**: proved that, to first order, a placeholder flows to a transformer's output *only through the attention that reads it* — "no reading, no flow" — and, dually, that a faint reading or sensitivity **cannot certify non-flow**. This rules out both naive over-approximation and unreliable negative evidence.
- **Sightline tool**: reads a recorded call in a single forward pass, learns from labels which attention reads count as genuine *uses*, and **calibrates pruning to miss at most a chosen fraction α of true flows**, on average over call sites, when deployment is exchangeable with calibration.
- Unlike removal/gradient signals, attention-based reading survives confident outputs and duplicated content.

## Results

- Evaluated on **2,103 unseen repository families** across **four models**; most accurate summary versus the seven closest methods and a hidden-state probe.
- Calibrated at **α = 1%**: misses ~1% of true flows, prunes **43.9–65.6% of spurious flows** — 1.6–2.6× as many as the best baseline — and still 43.8–60.1% when calibrated on a different collection.
- Through an open surrogate model, it reads models treated as closed API models about as accurately as they read themselves, without their labels.
- Applied to information-flow control of an LLM agent: removes about **half of the labels** from inputs that do not flow.

## Relevance to Our Domain

Production agent stacks mix untrusted content with tool execution; graded, calibrated provenance like this makes prompt-injection exfiltration analysis enforceable without taint-everything paralysis — the static-analysis complement to runtime guards (Llama Guard, AEGIS-style proxies) already in the vault.

## References
- Paper: https://arxiv.org/abs/2611.26221 (cs.PL, cs.AI — Zihao Xu, Yuekang Li, Ruitao Feng, Haifeng Shen, 2026-11-19)
- Related in vault: [[explanation-aegis-multilayer-llm-security-proxy]], [[explanation-verification-transport-llm-agent-evaluation]]
