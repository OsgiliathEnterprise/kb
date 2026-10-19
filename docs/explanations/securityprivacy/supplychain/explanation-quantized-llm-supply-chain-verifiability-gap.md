---
title: 'What You Sign Is Not What You Run: The Verifiability Gap in Quantized LLM
  Supply Chains'
diataxis: Explanation
domain: security-privacy
topic: supply-chain
source: 'arXiv: What You Sign Is Not What You Run: The Verifiability Gap in Quantized
  LLM Supply Chains (arXiv:2610.19498)'
source_url: https://arxiv.org/abs/2610.19498
date: 2026-10-18
keywords:
- knowledge-base
- supply-chain
- security-privacy
- explanations
---
# The Verifiability Gap in Quantized LLM Supply Chains

## Overview

Model signing (à la Sigstore/SLSA for weights) authenticates the **full-precision** weights `W` a model release ships with. But what most users actually run is a **quantized artifact** `Q` — and this paper (cs.CR, 2026) shows the transformation `W → Q` is *not uniquely determined* by anything a release currently discloses. The result is a **verifiability gap**: the signed input you can verify and the artifact you run are different objects, and there is no way to check that the one you run is the one the signature implies. The authors measure this gap with a new metric, the **Independent Verifiability Rate (IVR)** — the fraction of the ecosystem a third party can re-derive bit-for-bit from disclosed inputs alone.

## Problem Statement

Two gaps compound into the core problem:

1. **Disclosure gap**: none of the 200 most-downloaded Hugging Face GGUF repositories (198 in scope) records the build environment. Under a recorded-inputs protocol, **IVR = 0/198** — no artifact or model card gives a third party enough to re-derive the quantized file.
2. **Reproducibility gap**: even with inputs disclosed, quantization is sensitive to coordinates the card omits — the build's floating-point-contraction setting, and for hybrid models the per-tensor quantization recipe.

The security consequence: a malicious quantizer can ship a `Q` that is indistinguishable from a benign one under current verification, because *no one can independently re-derive either*.

## Key Contribution

- **The IVR metric**: first measurement of how much of a quantized-model ecosystem is independently re-derivable; 0/198 for the top-HF GGUF population.
- **Minimal sufficient coordinates**: on four in-sample repositories that *do* disclose inputs, the model card alone reproduces **no** Q4_K_M file; adding just two omitted coordinates — the fp-contraction setting and (for hybrid models) the per-tensor recipe — re-derives **7/8** target-quant files bit-for-bit on x86 (5/8 on arm64).
- **Environment as a coordinate**: reproducing the divergence reported in llama.cpp PR #25353, the paper shows the build environment `E` is a *necessary* coordinate, and identifies one compiler setting that yields a unique output across tested platforms at negligible quality cost (**+0.06% perplexity**).
- **Tamper-detection limits**: benign floating-point non-determinism separates from uniformly placed nibble-flip tampering above a detection floor that grows with the number of environments a verifier must allow — but a *targeted embedding edit* evades the statistic, so the protocol must rest on exact re-derivation. Adversarial-fp16 attacks are outside the protocol's scope.

## Technical Approach

The authors separate each quantization pipeline's inputs into (a) non-environment inputs (weights, calibration data, recipe parameters) and (b) the execution environment `E` (toolchain versions, instruction set, compiler/fp settings). The IVR protocol then asks: given only the recorded inputs, can an independent actor re-derive the shipped artifact bit-for-bit? The empirical program covers the top-200 HF GGUF repos (disclosure audit), four in-scope repos (minimal-coordinate re-derivation), and a targeted reproduction of the llama.cpp PR #25353 divergence. The security characterization compares the distribution of benign cross-environment variation against nibble-flip tampering to establish where statistical detection is possible. The audit data and a re-runnable harness are released (github.com/Rlonglong/gguf-verifiability-artifact).

## Results

| Finding | Value |
|---------|-------|
| Top-200 HF GGUF repos recording build environment | 0 of 198 (IVR = 0) |
| Q4_K_M files reproducible from model card alone | 0 |
| Re-derived with +2 omitted coordinates (x86 / arm64) | 7/8 / 5/8 |
| Calibration imatrix | must be shipped and hash-bound (recomputation did not match) |
| Quality cost of the unique-output compiler setting | +0.06% perplexity |
| Older release pinning the instruction set | did not re-derive |
| Semantic Scholar citation count | unverified (API anti-bot at query time) |

## Relevance to Our Domain

This is the supply-chain note for the [quantized-model distribution](../../../how-to/developertoolspractices/releasereproducibility) pipeline. If your organization runs GGUF-quantized models from Hugging Face, the paper's conclusion is direct: **signature on the full-precision weights ≠ assurance about the file you run.** The actionable protocol the paper points to: (1) require model cards to publish the two missing coordinates (fp-contraction setting, per-tensor recipe) plus the environment `E`; (2) ship and hash-bind the calibration imatrix rather than recomputing it; (3) treat bit-exact re-derivation, not statistical tamper-detection, as the verification primitive — targeted embedding edits defeat the statistical test. The +0.06% perplexity result is also the practical answer to "can we standardize the compiler setting?" — yes, at negligible cost.

## References

- Paper: https://arxiv.org/abs/2610.19498
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.19498
- Artifact: https://github.com/Rlonglong/gguf-verifiability-artifact
- Context: llama.cpp PR #25353 (cross-platform divergence)
