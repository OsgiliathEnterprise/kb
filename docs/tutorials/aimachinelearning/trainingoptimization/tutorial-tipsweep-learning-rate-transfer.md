---
title: Precision-Aware Learning Rate Transfer Across Block Count in LLM Post-Training
diataxis: Tutorial
domain: ai-machine-learning
topic: training-optimization
source: 'arXiv: Precision-Aware Learning Rate Transfer Across Block Count in LLM Post-Training
  (arXiv:2611.31166)'
source_url: https://arxiv.org/abs/2611.31166
date: 2026-11-24
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- tutorials
---
# TipSweep: Transfer the Learning Rate from One Block to the Whole Model (Tutorial)

**Authors:** Nan Chen, Soledad Villar, Soufiane Hayou.


## Overview

Post-training — SFT, DPO, and RL with verifiable rewards (RLVR) — is extremely sensitive to the learning rate, and grid-searching it on a full LLM is expensive in compute *and* memory. **TipSweep** (cs.LG/cs.CL, November 2026) exploits a regularity: the optimal learning rate **transfers predictably across the number of trainable transformer blocks k**. You search on the last block or two, then extrapolate to full-depth training with a precision-aware scaling rule.

## What You'll Learn

- Why the optimal LR depends on k (the number of trainable blocks), and why it depends on your **numerical precision** too.
- A hands-on workflow: tune k₀=1, extrapolate to k=L.
- Two practical prototypes: a 16 GiB consumer-GPU search and a single-pass multi-candidate search.

## Step-by-Step: LR Search via Block-Count Transfer

1. **Pick your precision mode first** — this changes the scaling law:
   - **FP32 master weights**: optimal LR scales approximately as **k⁻¹**.
   - **BF16 updates applied directly (no master copy)**: optimal LR scales as **k⁻¹ᐟ²**.
2. **Run the search at minimal depth**: train only the last **k₀ blocks (typically k₀ = 1)** over a small grid of candidate LRs. This is the whole point — one-block training fits tiny hardware.
3. **Apply the scaling rule** to predict the optimal LR for any target depth k, including **k = L** (full transformer). Models validated: 1–7 B parameters.
4. **Sanity-check the mechanism if precision is unusual**: both rules are explained by an analytical model that accounts for **update rounding** (why BF16-without-master decays more slowly with k), with assumptions supported by profiling experiments.

## Two Working Prototypes (6.7 B model)

| Prototype | Hardware | Trick | Cost |
|---|---|---|---|
| Budget search | Single **consumer GPU, 16 GiB** | Search fits entirely because only the last block trains | Runs where full-depth search can't fit at all |
| Fast search | High-end GPU | Evaluate **all candidate LRs in one pass over the data** | Five-candidate search ≈ **half the GPU-hours of a single k=L run** |

## Exercises to Internalize

- Predict: doubling trainable depth k under FP32 master weights should *halve* the optimal LR; under direct BF16 updates it should divide by √2. Verify on your own fine-tuning job.
- Profile a BF16 run for update rounding effects before trusting a transferred LR — the scaling laws assume the rounding model holds.

## Relevance to Our Domain

For ML-Ops and post-training workflows, this turns the single most sensitive hyperparameter of SFT/DPO/RLVR into a **one-block experiment plus arithmetic**, with a memory story (16 GiB search) and a throughput story (shared-pass candidate evaluation). The precision dependence is the practical trap: a rule learned from FP32 master-weight runs will misprice BF16 direct-update jobs.

## References

- Paper: https://arxiv.org/abs/2611.31166
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.31166 (not yet indexed at time of writing)
- Related in vault: training-optimization hyperparameter-transfer notes
