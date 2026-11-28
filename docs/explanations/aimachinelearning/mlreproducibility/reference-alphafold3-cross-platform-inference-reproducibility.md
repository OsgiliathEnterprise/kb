---
title: 'Same Seed, Different Top Prediction: Cross-Platform Reproducibility of AlphaFold
  3 Inference on TPUs, GPUs, and CPUs'
diataxis: Explanation
domain: ai-machine-learning
topic: ml-reproducibility
source: arXiv
source_url: https://arxiv.org/abs/2611.34462
date: 2026-11-28
keywords:
- knowledge-base
- ml-reproducibility
- ai-machine-learning
- explanations
---
# Same Seed, Different Top Prediction: Cross-Platform Reproducibility of AlphaFold 3 Inference on TPUs, GPUs, and CPUs

**Author:** Lorenzo Pazienza (102 pp.: 14 pp. paper + 88 pp. supplementary)

## Overview
AlphaFold 3 returns the top-ranked sample of several sampled structures, computed on a single device — but nothing in its documentation or outputs warns that the **device itself** can change which structure is returned for the same input, weights, and seed. This measurement study (arXiv:2611.34462) quantifies how often, and prescribes what to report and how to make devices agree.

## Measured Setup
Identical inputs, weights, seeds, and settings on:
- TPUs: v5e, v6e (two generations)
- GPUs: NVIDIA L4, A100, H100
- CPU: Intel Xeon
- Workload: 60 protein–ligand complexes × 5 seeds (300 predictions per condition), plus follow-ups on 72 new targets and TPU↔CPU comparisons.

## Key Measurements
| Condition | Top-ranked sample changes |
|---|---|
| Switch TPU generation (v5e↔v6e) | **18.0 %** of 300 predictions |
| Recompile on same device | 0 % on TPUs; **7.3 %** on L4 GPU |
| A100 ↔ H100 | **exceeds recompilation effect** — despite developers verifying numerical accuracy on both |
| New seed (baseline) | ~10 % |
| Correct↔incorrect flip from device switch | **3.3–3.7 %** (vs ~10 % for reseeding) |

- Pose flips nearly always trace to a single validity check with the ligand within 2 Å — i.e. **near-tied candidates** where tiny floating-point differences decide the ranking.
- Effect replicates across 72 new targets and between TPUs and the CPU.

## Reporting & Mitigation Recommendations (verbatim findings)
1. **Report the device** used for inference, and **every near-tied sample**, not just the top-ranked one.
2. **Mitigation that works**: a float32 trunk with full-precision matrix products made all five accelerators agree on nearly every prediction.

## Relevance to Our Domain
The canonical case study for hardware-induced non-reproducibility in ML serving: identical software + identical seed ≠ identical output when schedulers move jobs across GPU types or CPU nodes. The guidance (pin/report device class, surface near-ties, selectively upcast the numerically-coupled trunk) generalizes to any ranking/sampling inference service — including LLM serving with greedy top-k outputs — and complements `reference-ml reproducibility audits`-style notes in this topic.

## Artifact Links
- Code: https://github.com/lorenzopazienza/af3-cross-platform
- Data: https://doi.org/10.5281/zenodo.24057470 , https://doi.org/10.5281/zenodo.24057544
- Pre-registration: https://osf.io/fegsy
- Paper: https://arxiv.org/abs/2611.34462
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34462
