---
title: 'BridgeHammer: DNN Backdoor Attack via CPU-iGPU Shared-memory Rowhammer'
diataxis: Explanation
domain: security-privacy
topic: hardware-security
source: arXiv
source_url: https://arxiv.org/abs/2611.34684
date: '2026-11-27'
keywords:
- knowledge-base
- hardware-security
- security-privacy
- explanations
---
# BridgeHammer: Rowhammer DNN Backdoors across the CPU–iGPU Shared Memory

## Overview
Wang, Roy & Fei (arXiv:2611.34684, submitted 2026-11-25, accepted at DATE 2027) show that heterogeneous SoCs — CPUs and integrated GPUs sharing **physical memory** — admit a new integrity attack: a **CPU-side Rowhammer fault-injection can implant a backdoor into a DNN that the iGPU will later execute**. This turns memory corruption on one compute domain into targeted misclassification on the other.

## Problem Statement
A usable DNN backdoor must flip *specific weights* so the model misclassifies trigger-bearing inputs while keeping normal accuracy. Two obstacles on shared-memory SoCs:
- **Where**: vulnerable DRAM row locations may not contain the targeted weights.
- **When**: memory placement and fault injection must align with the model-deployment lifecycle, which spans **two distinct computation domains** (CPU prepares, iGPU executes).

## Attack Design
BridgeHammer coordinates the lifecycle across both domains:
1. **Targeted weight placement *before* zero-copy binding** — the attacker arranges for the model weights destined for the iGPU to land at hammerable DRAM locations.
2. **Fault injection *before* inference** — Rowhammer bit flips corrupt those weights while the model is still in shared memory.
3. The **iGPU then performs all subsequent inference on the corrupted model** — via zero-copy binding, no further involvement of the attacker is needed.

## Evaluation
- Platform: heterogeneous **Intel CPU–iGPU**, inference via **OpenVINO**.
- Models: **ResNet-20, VGG-16, ResNet-50**, each at **INT8 and FP32** (6 configurations).
- Across all six: **88.9% average attack success rate** with **86.3% clean accuracy**, with reliable target-page placement and bit-flip reproduction.

## Relevance to Our Domain
Demonstrates a **new integrity vulnerability class on heterogeneous CPU-iGPU SoCs** — edge devices and client SoCs running local inference are in scope. Argues for *cross-domain memory integrity protections*: per-domain memory isolation assumptions are insufficient when one domain can hammer the other's model weights.

## References
- Paper: https://arxiv.org/abs/2611.34684 (7 pages, 3 figures; DATE 2027)
