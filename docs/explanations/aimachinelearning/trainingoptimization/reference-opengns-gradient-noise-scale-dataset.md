---
title: 'OpenGNS: An Open Dataset of the Gradient Noise Scale across Vision, Language,
  and Diffusion Models'
diataxis: Explanation
domain: ai-machine-learning
topic: training-optimization
source: arXiv
source_url: https://arxiv.org/abs/2611.24331
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- explanations
---
# OpenGNS: An Open Dataset of the Gradient Noise Scale across Vision, Language, and Diffusion Models

## Overview
OpenGNS is the first open dataset of Gradient Noise Scale (GNS) measurements across modern architectures: 400+ GNS trajectories spanning ResNet image classification, GPT autoregressive language modeling, and Diffusion Transformer image synthesis. GNS measures the signal-to-noise ratio of SGD gradients and approximates the Critical Batch Size (CBS), but until now had only appeared in closed frontier-model technical reports.

## Problem Statement
The GNS→CBS relationship (McCandlish et al., 2018) is central to batch-size and learning-rate selection, yet no public corpus of GNS trajectories existed, blocking systematic study of how GNS depends on hyperparameters, model scale, and training progress.

## Dataset Specification
| Dimension | Coverage |
|---|---|
| Size | >400 GNS measurement trajectories |
| Domains | ResNets (classification), GPTs (language modeling), DiTs (image synthesis) |
| Model scale | 11M – 1B parameters |
| Parameterization | Maximal Update Parameterization (muP) |
| Sweeps | Dense batch-size × learning-rate grids |
| Access | https://huggingface.co/datasets/olympique-marcel/OpenGNS |

## Key Findings
- **GNS behaves like a "temperature of training"**: stable across model sizes under muP at equivalent loss — a transferable quantity for hyperparameter planning.
- **Task-dependent bias in the GNS→CBS relation**: CBS tends to be **overestimated for classification** and **underestimated for generative tasks**, consistently in direction across common CBS definitions.

## How to Use (lookup guidance)
1. Before a large training run, look up GNS trajectories for your architecture family and scale band to sanity-check your batch size against the implied CBS.
2. Under muP, reuse the GNS value observed at a small proxy model's equivalent loss rather than re-measuring at full scale.
3. For generative workloads (LM, diffusion), treat GNS-derived CBS as a lower bound — verify upward; for classification, verify downward.

## Relevance to Our Domain
Practical MLOps reference for training-optimization: GNS/CBS measurement is the standard way to set critical batch size and learning-rate scaling. An open corpus lets us validate batch-size automation and budget planning against real trajectories instead of folklore.

## References
- Paper: https://arxiv.org/abs/2611.24331
- Dataset: https://huggingface.co/datasets/olympique-marcel/OpenGNS
- Foundational: McCandlish et al. 2018, "An Empirical Model of Large-Batch Training"
