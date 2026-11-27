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
BridgeHammer has an **offline phase** and an **online phase** with two breakpoints (Northeastern University; threat model = co-located unprivileged user-space attacker with micro-architectural side-channel visibility of victim progress, no iGPU-interface access):

**Offline — DRAM profiling + hardware-tailored backdoor.** The **Blacksmith** tool (frequency-domain Rowhammer patterns) discovers reproducible bit-flips on commodity DDR4, bypassing TRR; each flip is recorded as (PFN, bit offset in 4-KiB frame, flip direction, aggressor pattern) into a PFN-indexed **fault map**. Following ROBBIN, the backdoor is then *co-designed with the hardware*: all bit-flips on chosen vulnerable frames constitute the backdoor (rather than picking ideal bit-flips and hunting for locations), yielding a better ASR/CA balance. Output: DNN-pages → vulnerable-DRAM-frames mapping + fault patterns.

**Online — two coordinated breakpoints** (instruction monitoring + signal-based synchronization, victim paused with SIGCONT at each):
1. **T1, targeted memory massaging** — *after* model compilation, *before* zero-copy weight anchoring. The attacker evicts target DNN pages via page-cache pressure (large dummy buffer claiming frames), then curates the Linux **PCP (per-CPU pageset) LIFO** so the kernel re-allocates target pages onto the designated vulnerable frames when the file-backed offsets are touched.
2. **T2, Rowhammer fault injection** — *after* zero-copy weight anchoring, *before* inference dispatch. Hammering those frames implants the backdoor bit-flips.
3. The **iGPU then performs all subsequent inference on the corrupted model** — via zero-copy binding, no further involvement of the attacker is needed.

Why CPU-side hammering: prior GPU-side Rowhammer (Grand Pwning Unit) runs through opaque graphics interfaces that do not expose physical-address mappings, making targeted weight placement nearly impossible.

## Evaluation
- Platform: heterogeneous **Intel Core i7-8700 CPU–iGPU** with commodity DDR4, inference via **OpenVINO**.
- Models: **ResNet-20, VGG-16, ResNet-50**, each at **INT8 and FP32** (6 configurations).
- Across all six: **88.9% average attack success rate** with **86.3% clean accuracy**, with **100% accurate target-page placement** and bit-flip reproduction.
- Prior-art lineage: DeepHammer, OneFlip (single FP32 flip suffices), Don't Knock, ROBBIN — all CPU-only threat models; BridgeHammer is the first to cross the CPU→iGPU deployment lifecycle.

## Relevance to Our Domain
Demonstrates a **new integrity vulnerability class on heterogeneous CPU-iGPU SoCs** — edge devices and client SoCs running local inference are in scope (the paper discusses NVIDIA Jetson and AMD XDNA-class parts). Argues for *cross-domain memory integrity protections*: per-domain memory isolation assumptions are insufficient when one domain can hammer the other's model weights. Zero-copy convenience is precisely what removes the discrete-GPU VRAM copy that previously protected model integrity.

## References
- Paper: https://arxiv.org/abs/2611.34684 (7 pages, 3 figures; DATE 2027)
- Builds on: ROBBIN (arXiv:2608.23774), Blacksmith (IEEE S&P 2022), OneFlip (USENIX Security 2025)
