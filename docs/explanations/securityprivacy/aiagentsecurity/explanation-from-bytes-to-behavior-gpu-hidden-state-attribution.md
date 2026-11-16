---
title: From Bytes to Behavior — Request-Level Attribution from Live GPU Hidden States
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.18272
date: '2026-11-16'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# From Bytes to Behavior: Request-Level Attribution from Live GPU Hidden States

## Overview
Memory forensics can extract *artefacts* from a compromised LLM serving host — KV blocks, prompt fragments, activation tensors — but artefacts alone do not answer the operational question: which request or session produced this behaviour? The paper presents the first end-to-end framework that turns raw GPU state into **request- and session-level attribution** during live inference. The core device, **TensorPrint**, attributes a recovered KV block to its originating prompt and classifies model behaviour directly from recovered activation tensors.

## Problem Statement
Incident response for LLM serving infrastructure has no method to bind recovered GPU artefacts to specific requests: KV blocks and activations are anonymous tensors. Without that binding, forensic evidence cannot support access decisions, abuse triage, or audit.

## Key Contribution
- **First request-level attribution framework from live GPU state** (KV blocks + activation tensors), evaluated on real deployments: Llama-3.1-8B and Qwen-2.5-14B on NVIDIA L4, RTX 6000 Ada, H100, under batch, continuous batching and p/d disaggregation.
- **TensorPrint**: prompt-level attribution of a KV block via **Gumbel-Softmax search over token-level cosine similarity**; behaviour classification from activation tensors.
- **Behavioural taxonomy** with four operational categories: refusal, anomalous (statistical outlier), high-risk, benign.
- **Operational metrics**: false-positive rate, evidence quality, and a proposed **GPU Evidence Preservation Score** for incident-response readiness.

## Technical Approach
The framework reconstructs prompt-to-KV bindings by searching token embeddings (Gumbel-Softmax relaxed optimization) against candidate prompts, scoring cosine similarity; a parallel classifier reads recovered activation tensors to label behaviour. Experiments include **grounded** conditions (known request set) and **open-world** conditions where the ground-truth prompt may be absent — the latter measures how often the system wrongly attributes unknown prompts to known candidates, the key FP risk for real IR.

## Results
Strong attribution on known request sets in grounded settings; in open-world conditions the system exhibits a measurable tendency to attribute unseen prompts to known ones — quantified rather than hidden, giving defenders a calibrated confidence model.

## Relevance to Our Domain
As we operate GPU serving platforms for agents, GPU-state forensics becomes part of the security playbook: this paper supplies the first attribution methodology plus metrics (GPU Evidence Preservation Score) to assess whether our serving hosts preserve usable evidence after compromise. Related: [[explanation-forget-the-lineage-cryptographic-erasure-agent-memory]].

## References
- Paper: https://arxiv.org/abs/2611.18272
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18272
