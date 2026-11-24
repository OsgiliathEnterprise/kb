---
title: 'Reasoning in Fewer Tokens: Concept-Normalized Multilingual Scratchpads and
  Reversible Model-Adaptive Reasoning Codes'
diataxis: Explanation
domain: ai-machine-learning
topic: resource-optimization
source: arXiv
source_url: https://arxiv.org/abs/2611.27326
date: 2026-11-24
keywords:
- knowledge-base
- resource-optimization
- ai-machine-learning
- explanations
---
# Reasoning in Fewer Tokens: Concept-Normalized Multilingual Scratchpads and Reversible Model-Adaptive Reasoning Codes

## Overview

Chain-of-thought prompting improves LLM reasoning but is expensive because the scratchpad is decoded autoregressively at full length. Existing efficiency tricks either **discard tokens or move reasoning into continuous latents — lossy methods that sacrifice interpretability and auditability**. This paper introduces a **lossless compression framework for intermediate reasoning**: a Byte-Pair Encoding vocabulary learned on reasoning corpora maps frequent semantic spans to **Private Use Area (PUA) tokens**, and the model is fine-tuned to reason in this compressed language and decode it back 1:1.

## Problem Statement

Reasoning cost scales with scratchpad length, but any compression that hides or discards reasoning steps breaks the auditability that makes chain-of-thought useful in the first place. The goal is fewer generated tokens with a **strictly reversible** trace.

## Key Contribution
- **Compressed reasoning vocabulary**: apply BPE to reasoning corpora to learn PUA tokens, each representing a frequent semantic span; **expand the LLM's vocabulary** with them.
- **Strictly 1:1 fine-tuning** between natural-language reasoning and the compressed scratchpad — the method is **lossless**, so traces remain decodable, transparent, and auditable.
- **Orthogonality**: the lossless layer stacks with existing lossy/irreversible compression techniques, letting practitioners combine both.
- Evaluation on **Llama-3.1-8B, Qwen2.5-14B, and Qwen2.5-32B** across **four diverse benchmarks**.

## Technical Approach

The compressed "reasoning code" is a model-adaptive language: PUA tokens are ordinary vocabulary entries that happen to encode multilingual semantic chunks of reasoning, so autoregressive decoding produces them at normal token cost. Because the mapping learned via BPE is bijective under the 1:1 fine-tuning constraint, a downstream decoder reconstructs the full natural-language trace — inference accelerates while the transparency of the reasoning is fully preserved.

## Results

- **−14.7 % total generated tokens on average**, with reasoning-trace length reductions **up to 27.1 %**.
- Negligible accuracy cost: **−1.6 percentage points** on average.
- Gains hold across three model families/sizes and four benchmarks; compression stacks with lossy methods.

## Relevance to Our Domain

Inference cost control for reasoning-heavy agents: token-billing and latency in agentic pipelines are dominated by scratchpad decoding, and a reversible code preserves the audit trail compliance/eval workflows need — unlike latent-thought approaches. A cheap lever for LLM serving fleets (see KV-cache and cost-optimization notes in this topic).

## References
- Paper: https://arxiv.org/abs/2611.27326 (cs.CL, cs.AI)
- Related note: `ai-machine-learning/resource-optimization/explanation-llm-cost-optimization-agent-fleets.md`
