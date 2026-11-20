---
title: Distortion-Free Semantic Watermarks for Black-Box Generative Models
diataxis: Explanation
domain: security-privacy
topic: model-provenance
source: arXiv
source_url: https://arxiv.org/abs/2611.23208
date: '2026-11-18'
keywords:
- knowledge-base
- model-provenance
- security-privacy
- explanations
---
# Distortion-Free Semantic Watermarks for Black-Box Generative Models

## Overview
Yossef, Patashnik and Zamir (Aviv Yossef, Or Patashnik, Or Zamir — Tel Aviv University; arXiv:2611.23208, cs.LG/cs.CR/cs.CV, submitted 2026-11-17, DOI 10.48550/arXiv.2611.23208) present a **provably distortion-free semantic watermarking algorithm** that needs only **black-box sampling access** to a generative model and black-box access to a semantic embedding. It targets the two properties watermarking practitioners most often have to trade off: **no quality loss** (distortion-freeness) and **robustness to benign content-preserving edits** — without any white-box hooks into the generator.

## Problem Statement
- *Distortion-free* means: averaged over the secret detection key, the watermark leaves the generator's **output distribution unchanged** — a formal guarantee that watermarking doesn't degrade output quality.
- Conventional distortion-free watermarks are **brittle to transformations**. For images this is fatal: compression, cropping or resizing change the entire pixel representation, so detection must be **semantic**, robust under content-preserving transformations.
- Prior schemes with both properties lean on **model-specific white-box assumptions** — autoregressive text generation, or diffusion-specific access such as control of the initial noise or diffusion inversion. That excludes closed-source APIs.

## Key Contribution
- A **fully generic construction** interacting with the generator and the semantic embedding only via sample-and-query access; the embedding defines the notion of "content-preserving" under which detection must be robust.
- **Instantiation for image generation**, including a characterization of the two competing properties a semantic embedding must satisfy: (1) stable under content-preserving transformations, (2) able to **distinguish independent generations from the same prompt**.
- A purpose-trained image encoder optimizing this stability-vs-separation tradeoff, improving separation over off-the-shelf encoders while retaining stability.

## Results
Strong aggregate detection while remaining robust to various transformations, demonstrated on **both open-source and closed (API) models** — possible precisely because the scheme is restricted to black-box access. Code and project page are public (see paper comment field).

## Security Caveat (enriched 2026-11-20)
Distortion-freeness and transformation robustness are not the same as **unforgeability**. Independent work on diffusion-model semantic watermarks shows they remain **vulnerable to black-box forgery attacks** — an adversary with only sampling access can craft inputs that produce images carrying a target watermark signature ("On Forging Semantic Watermarks in Diffusion Models", OpenReview, 2025). Any deployment of this scheme for provenance/attribution should therefore treat detection as **evidence, not proof**, and combine it with cryptographic content credentials (e.g., C2PA manifests) where the publisher cooperates.

## Relevance to Our Domain
AI provenance and content-attribution pipelines increasingly must watermark models they don't control (commercial image APIs). A black-box, distortion-free semantic watermark is deployable **without vendor cooperation**, which changes the economics of content-authenticity infrastructure. Complements token-level watermark references with a **semantic-space** detection design. Related: [[reference-codebook-multibit-llm-watermarking]].

## References
- Paper: https://arxiv.org/abs/2611.23208
- Project: https://avivyossef.github.io/distortion-free-semantic-watermark/
- Code: https://github.com/avivyossef/distortion-free-semantic-watermark
