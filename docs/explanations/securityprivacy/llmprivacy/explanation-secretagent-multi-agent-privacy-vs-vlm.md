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

## Under the Hood (from the full paper, v1)

**Affiliation:** Harvard University (Harvard AI and Robotics Lab). Code: https://github.com/Harvard-AI-and-Robotics-Lab/SecretAgent

**Agent roles in the closed loop:**
- **A1 Privacy Assessor** — prompts the target VLM with the image and each private query, returning answers plus *evidence items* (visual clues localized by box/polygon: a street sign for geolocation, a region supporting a name).
- **A2 Planner** — reads the search history (leaked answers, cited clues, artifact reports, per-encoder similarities) and outputs a complete plan of *where and how* to perturb, drawing regions mainly from A1's cited clues.
- **A3 Configurator** — sets numerical parameters: region masks with feathered edges, encoder weights, noise strengths/RGB gains/seeds.
- **A4 Appearance Reviewer** — pass/fail on visible artifacts with location and severity; failing candidates are never assessed by A1 or eligible for output, but their reports still feed the next round.

**Formalization:** minimize the summed privacy score over queries subject to ‖δ‖∞ ≤ ε and V(x, x+δ) = 1 (no visible artifact) — the invisibility constraint is a *hard* constraint enforced by A4, since V is hard to express analytically.

**Variant mechanics:**
- *Gradient*: six frozen surrogate encoders combined with agent-chosen weights (image/text weight split 0.7/0.3 for CLIP-style encoders); each round one masked sign-gradient step maximizing weighted cosine distance from clean features on the full image (ω₀ = 0.6) and planned regions (ω_v = 0.4/nₜ), with small uniform noise on zero-gradient pixels.
- *Tool*: gradient-free — A2 assigns noise families from a **library of 23** procedural families as components per region; components are summed and clipped to ε.

## Experimental Setup (verified details)

- Budget **ε = 4/255** for all methods, **T = 10 rounds**, step α = 2/255.
- Target models: Claude Haiku 5.5 (geolocation/PII/facial); dataset-specific **MedGemma-27B LoRA** fine-tunes for medical. GPT-6 Luna serves as A2/A3; A1/A4 use Claude Haiku 5.5 (MedGemma as A1 in medical).
- Datasets: **Pri-Street-View** (1,816 street-view images, geolocation), **MultiTrust P5** (173 images / 195 PII questions), **FRLL** (100 frontal portraits, age/gender/race), **RHPE** (79-image hand-radiograph test split) and **PAPILA** (244 patients fundus; 73-patient test) for medical age/sex.
- Baselines AnyAttack, FOA-Attack, MPC-Attack reach ~97–100% attack success but with visible artifacts; SecretAgent-Gradient stays at 95–99% while preserving fidelity far better (PSNR, MS-SSIM, LPIPS, DISTS + LLM-judge appearance-pass rate).
- **Practical cost:** API usage ≈ **$0.031–$0.103 per image** (Gradient) vs **$0.086–$0.249** (Tool) — the gradient variant is cheaper because the Tool variant's plan search consumes far more input tokens.

## Relevance to Our Domain

Image-sharing pipelines and multimodal assistants need pre-upload privacy filters that humans won't reject; the artifact-reviewer-agent pattern (a second model policing perceptual quality inside an adversarial loop) generalizes to any "invisible transformation" problem, including document redaction for LLM processing.

## References
- Paper: https://arxiv.org/abs/2611.26936 (cs.CV, cs.AI, cs.CR, cs.LG, cs.MA; submitted 2026-11-20)
- Code: https://github.com/Harvard-AI-and-Robotics-Lab/SecretAgent
- Related note: `security-privacy/llm-privacy/explanation-kv-cache-shuffling-token-recovery.md`
