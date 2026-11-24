---
title: 'SecretAgent: A Multi-Agent Framework for Privacy Protection against Vision
  Language Models'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.26936
date: 2026-11-24
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# SecretAgent: A Multi-Agent Framework for Privacy Protection against Vision Language Models

**Authors:** Minda Zhao, Yue Zhang, Mengyu Wang


## Overview

Vision-language models can infer private information from shared images — locations, PII, personal attributes like age and sex, even from medical images. Adversarial perturbations can block black-box VLM inference, but existing methods ignore image quality and leave **visible artifacts** in the protected image. **SecretAgent** is presented as the first general **multi-agent framework** that protects image privacy against VLMs **while preserving visual fidelity**.

## Problem Statement

Privacy-preserving perturbations face a three-way tension: they must defeat the target VLM's inference, remain invisible to humans, and generalize across models. Single-optimizer perturbation methods hit two of the three at best, typically sacrificing fidelity.

## Key Contribution
- **Agentic perturbation loop**: LLM agents iteratively locate the visual evidence that reveals private information and adapt an invisible perturbation to (a) the target VLM's answers and (b) an **appearance reviewer agent** that rejects any candidate showing visible artifacts.
- Two complementary instantiations:
  - **SecretAgent-Gradient** — optimizes the perturbation through **six surrogate encoders** for cross-model transferability;
  - **SecretAgent-Tool** — **gradient-free**, composing procedural noise; achieves the best perceptual fidelity on three of five datasets.
- Broad evaluation: **four privacy applications** (geolocation, PII, facial, medical) across **five datasets and six VLMs**.

## Technical Approach

The loop is a generate–critique adversarial design: one agent role finds where private information is visually encoded and steers the perturbation accordingly; the VLM under attack provides the privacy signal (does it still infer the secret?); the reviewer agent provides the fidelity signal (is any artifact visible?). Candidates failing the reviewer are rejected, forcing perturbations that stay below the perceptual threshold — a role split that single-objective optimizers lack.

## Results

- **State-of-the-art privacy protection in every one of the four applications**, while preserving image quality substantially better than existing methods.
- Protection **transfers to other VLMs** (surrogate-encoder design in the Gradient variant; robust even in the gradient-free variant).

## Relevance to Our Domain

Image-sharing pipelines and multimodal assistants need pre-upload privacy filters that humans won't reject; the artifact-reviewer-agent pattern (a second model policing perceptual quality inside an adversarial loop) generalizes to any "invisible transformation" problem, including document redaction for LLM processing.

## References
- Paper: https://arxiv.org/abs/2611.26936 (cs.CV, cs.AI, cs.CR, cs.LG, cs.MA)
- Related note: `security-privacy/llm-privacy/explanation-kv-cache-shuffling-token-recovery.md`
