---
title: 'One Prior, Two Dynamics: Repurposing Video Diffusion Transformers for Self-Supervised
  Latent Action Learning'
diataxis: Explanation
domain: ai-machine-learning
topic: multimodal
source: arXiv
source_url: https://arxiv.org/abs/2611.26617
date: 2026-11-20
keywords:
- knowledge-base
- multimodal
- ai-machine-learning
- explanations
---
# One Prior, Two Dynamics: Repurposing Video Diffusion Transformers for Self-Supervised Latent Action Learning

## Overview
O²LaF (One prior, Two dynamics, Latent Action from video) asks whether a pretrained video generator can serve as the shared prior for *both* inverse and forward dynamics, instead of learning dynamics from scratch on unlabeled video. Both a transition encoder (inverse dynamics) and an action-conditioned video generator (forward dynamics) are initialized from the same pretrained video diffusion transformer and specialized for their roles.

## Problem Statement
Videos show how the world changes but rarely which actions caused those changes. Latent action learning recovers action supervision from visual transitions, but prior methods learn the underlying dynamics largely from scratch, wasting the world knowledge already encoded in large video generators.

## Key Contribution
- The "one prior, two dynamics" principle: a single pretrained video DiT seeds both dynamics models.
- Inverse-dynamics branch: a feed-forward transition encoder with learnable action queries.
- Forward-dynamics branch: a causal, action-conditioned video generator.
- Information-access control plus end-to-end optimization of both dynamics through a compact bottleneck forces actions to be the transferable carrier of change information.
- Extension beyond generative priors to predictive representation priors (V-JEPA2), which also achieves competitive results — indicating the principle is about the prior, not specifically diffusion.

## Technical Approach
From unlabeled videos, the transition encoder infers latent actions between frames through learned query tokens; the forward model must then reconstruct future frames conditioned on those actions. Constraining information flow through the low-capacity action bottleneck prevents shortcut solutions, so the discovered latent actions capture causally relevant, transferable structure. Both branches are fine-tuned end-to-end from the shared DiT initialization.

## Results
- New state of the art in few-shot action probing across navigation and robotic manipulation benchmarks.
- Stronger zero-shot action transfer across visual contexts and across embodiments.
- Competitive performance when swapping the generative video prior for a predictive prior (V-JEPA2).

## Relevance to Our Domain
Action discovery from unlabeled observation streams is the self-supervised counterpart to how we bootstrap agent training data from logs: extract the latent "what changed and why" signal without action labels. The shared-prior pattern (one pretrained backbone adapted to complementary predictive/inverse tasks with a bottleneck between them) is a reusable architecture recipe for multimodal agent infrastructure, and open code (github.com/showlab/O2LaF) makes it testable.

## References
- Paper: https://arxiv.org/abs/2611.26617
- Code: https://github.com/showlab/O2LaF
- Project page: https://showlab.github.io/o2laf
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26617
