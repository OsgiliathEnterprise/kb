---
title: 'From Bytes to Behavior: Request-Level Attribution from Live GPU Hidden States'
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
Existing memory forensics for ML systems targets static artifacts — model weights, prompt logs — not the transient computational states of a live inference process. That gap blocks examiners from analyzing the specific behavior of a running LLM service that cannot be restarted or modified. This work attaches a **non-modifying debugger** (cuda-gdb) to a live vLLM/SGLang process and acquires **per-layer residual-stream activations**, without prior knowledge of the model's architecture parameters or weights — a general six-stage process with platform-specific adapters, using either a PyTorch allocator clock or a kernel-launch clock to identify and read tensor allocations from video memory.

## Problem Statement
For incident response on a running LLM service, there is no equivalent of a process memory dump that yields per-request behavior: hidden states vanish between steps, restarts destroy evidence, and instrumentation modifies the very system under examination. Attribution — which request produced which behavior — has no forensic evidence source.

## Key Contribution
- Live, read-only acquisition of per-layer residual-stream activations from an unmodified inference process via a debugger, no architecture/weight knowledge required.
- Tensor-discovery via allocation clocks (PyTorch allocator clock or kernel-launch clock) instead of symbols.
- Validation on **33 open-source decoder-only models across nine architecture classes**, recovered bytes byte-exact and usable downstream.
- Request-level attribution as a use case: linear probes trained on standard framework activations, applied to recovered states, distinguish refusal from compliance.

## Results
- Byte-exact layer recovery on the 33-model / 9-family suite (Qwen2.5, TinyLlama, Llama-3.2 and more), typically within four to six debugger passes.
- **Refusal vs compliance: AUROC 0.88** on held-out prompts; request-level refusal classification with **5–15% error rates** on held-out sources; on 142 untouched prompts a frozen probe reaches AUROC 0.88 with a 28% false-positive rate.
- Honest operational envelope: models up to **3.4B parameters** (plus one 7B model with 4-bit weights), batch size 1, single NVIDIA RTX 2080 Max-Q (8 GB), vLLM 0.32.0 / SGLang 0.5.23; TensorRT-LLM/TGI untested.

## Relevance to Our Domain
For GPU serving platforms, this opens a genuine incident-response capability: answer "what did this live deployment actually do for request X" from hidden-state evidence without modifying the service — complementary to application-layer audit logs. The stated boundaries (model size, batch 1, per-platform adapters, intrusive-enough-to-attach debugger) define where today's forensic readiness is actually achievable. Related: [[explanation-forget-the-lineage-cryptographic-erasure-agent-memory]] in this topic.

## References
- Paper: https://arxiv.org/abs/2611.18272
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18272
