---
title: 'Tritify: Deterministic Integer Inference and Verifiable Distributed Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.13730
date: 2026-11-14
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Tritify: Bit-Exact Inference in Integer Arithmetic, and Verifiable Distributed Serving as Its Consequence

## Overview

Floating-point inference is not reproducible: the same model on different hardware, compilers, or thread counts can produce different output bits. This paper presents **tritify**, an open-source runtime that runs the forward pass of real models entirely in **exact integer arithmetic** at inference time, confining floating point to offline quantization and an offline reference path. Bit-exactness then has a strong second-order payoff: if every machine produces identical bytes for the same input, a model's computation can be split across CPUs, GPUs, instruction-set architectures, and even networked machines with **zero effect on output** — enabling distributed inference that an untrusted server fleet cannot silently tamper with.

## Problem Statement

Optimized float inference trades reproducibility for speed. Consequences:

- Results differ run-to-run and host-to-host, breaking audits and regression testing.
- You cannot verify what an untrusted provider computed, because there is no canonical expected output.
- Distributed execution of one model across heterogeneous machines is impossible without changing results.

## Key Contribution

The paper makes and verifies three separable claims:

1. **Cross-hardware reproducibility** — the integer path produces bit-identical outputs run-to-run, across CPU ISAs, and across CPU/GPU, carried by a reproducing SHA-256 digest of the output.
2. **Decision fidelity** — the integer path reproduces the float reference's decisions on the models tested, with numeric exceptions measured explicitly. Per-layer fidelity analysis through 16 layers of OLMoE-1B-7B and a 106B-parameter MoE shows *no fidelity cliff* (no layer where integer error suddenly diverges).
3. **Location independence** — computation split across ISAs, CPU/GPU, and networked machines has zero effect on output bits. Headline demo: **GLM-4.5-Air (106,852,251,264 parameters, 427 GB of integer codes)** generated its answer across **three machines, none able to hold the integer codes in RAM**, bit-identically to a single-host reference.

Model coverage includes decoder-only LLMs, Mixture-of-Experts decoders, and the Segment Anything 2.1 image/video stack.

## Technical Approach

Floating point is pushed entirely offline: quantization converts the model to integer codes once, and the runtime path executes only exact integer operations. A separate float reference path exists purely for verification. Determinism makes outputs canonical, which yields **verifiable distributed inference**: an untrusted server or device fleet can run the model while an open scalar oracle re-derives the exact expected bytes — turning "trust the provider" into "check the digest."

## Results

- Bit-identical outputs across CPUs, GPUs, and ISAs; SHA-256 output digest reproduces.
- No decision-fidelity cliff through 16 layers on OLMoE-1B-7B and the 106B MoE.
- 106B-parameter MoE served across 3 RAM-constrained machines with output bit-identical to single-host.

## Relevance to Our Domain

For anyone operating LLM serving infrastructure, this reframes reproducibility as a *security property*: verifiable inference against untrusted GPU fleets, provable A/B regressions, and heterogeneous scheduling of giant MoE models across machines that individually lack memory. Integer-only runtimes also sidestep an entire class of "works on my GPU" incidents.

## References

- Paper: https://arxiv.org/abs/2611.13730 (cs.LG, cs.DC, cs.SE, submitted 2026-11-10)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.13730
