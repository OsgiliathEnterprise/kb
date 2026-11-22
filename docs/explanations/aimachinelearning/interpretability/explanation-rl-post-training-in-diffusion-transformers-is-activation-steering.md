---
title: RL Post-Training in Diffusion Transformers Is Activation Steering
diataxis: Explanation
domain: ai-machine-learning
topic: interpretability
source: arXiv
source_url: https://arxiv.org/abs/2611.26627
keywords:
- knowledge-base
- interpretability
- ai-machine-learning
- explanations
---
# RL Post-Training in Diffusion Transformers Is Activation Steering

## Overview
Meral, Zhang, Vanschoren and Fierimonte (TU Eindhoven / Eindhoven RF & AI Institute, Nov 2026) give a mechanistic account of what RL post-training actually *does* to diffusion transformers. Studying text-guided image editing in edit-reward optimisation (ERO) frameworks, they show the RL-trained update behaves like an activation-space shift — essentially the same operation as activation steering.

## Problem Statement
RL has become a common recipe for aligning generative models, but we lack understanding of what this post-training phase changes *inside* the model. The natural question: does an RL-trained model develop genuinely new internal behaviour, or does it reweight/steer representations that already exist in the base model?

## Key Contribution
- A mechanistic-interpretability study of diffusion transformers under RL post-training for image editing.
- Identification of a specific component: a **skip connection around the 2D positional encoding (2DPE)** in Qwen-Image — this 2DPE-skip is the primary mechanism behind editing performance.
- Evidence that the RL update acts as a **global additive shift in activation space**: the RL delta aligns with the RL update direction and resembles the base model's editing mechanism.
- An **orthogonalisation experiment**: removing the RL-specific activation component from the RL model abolishes its gains — the improvement lives in a low-dimensional, steerable direction.

## Technical Approach
The authors compare internal activations of base vs. RL-fine-tuned (LoRA) models, isolate the RL delta, and test whether it behaves like a steering vector: alignment analyses plus ablation by orthogonalising out the RL-specific component. The architectural focus is the Qwen-Image block structure, where the 2DPE skip connection emerges as the functional bottleneck for edits.

## Results
RL post-training improves editing capability, but its effect is (at least partly) re-expressing the base model's latent editing ability through an additive activation shift rather than creating new capabilities. Removing that shift collapses RL performance back toward base-model levels.

## Relevance to Our Domain
For ML-Ops and model-alignment practice, this reframes RL post-training as (partly) a cheap, steerable edit: if the gain is a directional shift, teams can analyse, transplant, or suppress it without full retraining — with implications for RLHF cost, model diffing, safety auditing of aligned checkpoints, and interpretability tooling.

## References
- Paper: https://arxiv.org/abs/2611.26627
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26627?fields=citationCount,year (rate-limited at check time; 2026)
- Code/data: https://huggingface.co/Densefloe/RL-VLM-Image-Editing-explainability

## Related
- [[explanation-skill-sdct-self-distilled-continual-lora]] — what parameter-level post-training changes
- [[explanation-what-if-chain-of-thought-is-not-enough]] — post-training as behaviour-shaping
