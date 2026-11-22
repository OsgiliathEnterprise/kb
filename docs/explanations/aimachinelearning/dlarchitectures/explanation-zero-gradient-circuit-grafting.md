---
title: 'Zero-Gradient Circuit Grafting: Compiling Exact Arithmetic into Pretrained
  LM Weights'
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.26450
date: 2026-11-21
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# Zero-Gradient Circuit Grafting into Pretrained LMs

## Overview
Pretrained LMs stay unreliable at exact multi-digit arithmetic without fine-tuning or tool interpreters. Circuit grafting (arXiv:2611.26450, Sah) introduces **closed-form, zero-gradient primitives that compile deterministic computation directly into pretrained LM weights** — zero training examples, zero runtime hooks — while bounding per-layer normalization drift and preserving natural-language competence.

## How the Construction Works
Three analytical mechanisms:
1. **Two-layer Mellin-GLU quadrature** over bias-free SwiGLU/GeGLU layers: converts unknown per-token RMSNorm scaling into a **translation along a log-spaced gate grid** (>250× dynamic range) with IEEE 754 error bounds.
2. **Cross-token scale cancellation**: signed Chebyshev Indefinite-RoPE self-sink attention plus memoryless SiLU-antisymmetric GatedDeltaNet shifts.
3. **Axis-aligned width extension** (d → d+K) with √(d/(d+K)) norm compensation, Base-1000 canonical BPE emission, and differential (+254, −256) tied unembeddings.

An **automated 5-stage compiler** synthesizes the circuits; the injected computation raises circuit logit boosts **+66 to +10,293 nats** while the measured per-vocabulary normalization drift drops to **bit-exact 0**.

## Empirical Results (Reference Data)
- **Boolean/logic**: 3-literal Boolean circuits 100% (N = 1,728; audited also on a 42-layer Gemma 4 E4B); 5-bit Majority/Parity voting 100% (N = 64).
- **6-digit signed `{+,−,×}` arithmetic** (N = 1,200, BF16, constant TC⁰ depth): **IBM Granite 4.2 3B** → 99.17% ALU-prefix accuracy (1.07M–1.33M active non-zeros, ≤0.036% weight change); **Alibaba Qwen 3.5 4B** → 100.00% (2.25M–2.39M non-zeros, ≤0.057%); both 100% with an FP32 sidecar; 98–100% mid-sentence resumption.
- Baselines: 12.8K-sample LoRA reaches only 42.2% / 61.7% with 0% inline continuation.
- **Deployment**: factorized block-sparse sidecar holds A100 memory at 7.89 / 10.65 GiB (4.60 / 8.14 GiB under INT8/INT4 + FP32 sidecar); passes all 14/14 pre-registered >2K-token Tango continuity splits (N = 4,392; 0/11,134 OOD triggers).

## Why It Matters (Explanation)
Shows that arithmetic failure in LMs is not an architectural dead end: deterministic computation can be **compiled** into frozen weights with formal error bounds, no gradient steps, and negligible weight churn. Positions the LM forward pass as a substrate for constant-depth circuits (TC⁰), bridging circuit-complexity theory and practical weight editing — and giving interpretability a ground-truth knob (a known circuit whose drift is provably zero).

## Limitations & Considerations
- Demonstrated on `{+,−,×}` up to 6–8 digits plus small Boolean/parity tasks — not general computation.
- Requires bias-free SwiGLU/GeGLU-compatible layers and a per-architecture compiler; sidecar memory still non-trivial.

## Relevance to Our Domain
Alternative to external calculators/tool calls when inline exactness matters (numeric formatting, deterministic agents); the normalization-drift bound (Δz = 0) is the property that makes grafting safe in production NL pipelines.

## Provenance & verification
Rewritten 2026-11-21 after audit: the earlier note's model (Llama-3.2-1B), MoE-expert/register-file framing, gate names Q_exact/Q_rel, 256-entry program memory, barrel-shift/16-bit/17-opcode specs and "+10,293 nats" attached to the wrong framing were not supported by the paper and were replaced with claims verified verbatim from the arXiv abstract and v1 PDF.

## References
- Paper: https://arxiv.org/abs/2611.26450
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26450
- Related: RMSNorm scale sensitivity, GatedDeltaNet (Yang et al. 2024), circuit complexity of transformers (TC⁰/Merrill), closed-form weight editing
