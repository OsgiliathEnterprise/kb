---
title: 'DistDNA: Language Model Fingerprinting under Stochastic Decoding'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27831
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# DistDNA: Language Model Fingerprinting under Stochastic Decoding

## Overview
How to fingerprint a language model through API access when the provider decodes stochastically. DistDNA is a protocol that builds *distributional* fingerprints from many sampled generations per probe, replaces pairwise divergence metrics with multi-reference divergences, and averages distances over probe sets so that identity decisions rest on statistical separation rather than any single output.

## Problem Statement
LM fingerprinting underpins model provenance, distillation detection, and IP enforcement. Published methods assume deterministic, greedy-decoding checkpoints — an assumption real serving stacks break: temperature sampling, top-k/top-p filtering, batching nondeterminism, and concurrency all make outputs irreproducible. Under stochastic decoding the usual pipeline (greedy outputs → pairwise divergence → threshold) is ill-defined, and no protocol existed for measuring fingerprint quality in this regime.

## How-to: run a DistDNA fingerprinting audit
1. **Select probes** spanning lexical, syntactic, semantic, and safety content (diversity of probe *types* matters, not just count).
2. **Sample multiple completions per probe** from the target endpoint (this is the key departure from greedy-only protocols) to estimate the empirical conditional output distribution.
3. **Compute multi-reference divergences** from each sampled distribution to reference candidates, instead of comparing two individual outputs.
4. **Average distances across the probe set** to obtain the identity score; the reference-free quality metric the paper introduces scores probe sets by how well they maximize identity separability.
5. **Calibrate the operating regime empirically** — on the paper's model pool, 3–5 samples per probe and 100 probes are sufficient for reliable identification.

## Key Contribution
- First protocol treating stochastic serving conditions as the norm, not noise to be eliminated.
- Distribution-based fingerprints + multi-reference divergences replacing fragile pointwise comparisons.
- A reference-free metric for designing probe sets that maximize identity separability.

## Results
Experiments on **95 models from 10 families** show the protocol recovers family-level identity and discriminates base models from instruction-tuned variants; the probe-design metric predicts fingerprint quality well.

## Relevance to Our Domain
Practical for our model-supply-chain checks: verifying which open-weight model actually backs an API endpoint, or detecting distillation of our fine-tunes. The "sample many, compare distributions, average over probes" recipe is implementable against any OpenAI-compatible endpoint.

## References
- Paper: https://arxiv.org/abs/2611.27831 (cs.CL, 2026-11-26)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27831
- Related: explanation-model-lineage-graph-forensics.md
