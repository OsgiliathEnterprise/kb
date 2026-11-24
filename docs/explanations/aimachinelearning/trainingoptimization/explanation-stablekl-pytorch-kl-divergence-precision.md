---
title: Why PyTorch KL Divergence Goes Negative (and Why Clamping Is the Wrong Fix)
diataxis: Explanation
domain: ai-machine-learning
topic: training-optimization
source: HackerNews
source_url: https://arxiv.org/abs/2611.30835
date: 2026-11-24
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- explanations
---
# Why PyTorch KL Divergence Goes Negative (and Why Clamping Is the Wrong Fix)

KL divergence is mathematically non-negative (Gibbs' inequality), yet PyTorch users have reported **negative KL values for years** — and the standard advice has been to clamp them at zero. arXiv:2611.30835 (2026-11-23, "The KL Divergence Is Never Negative, Except in PyTorch") shows the sign is just the visible symptom of a **silent accuracy failure** that matters most exactly where ML cares most: comparing *nearby* distributions.

## What the audit found

Benchmark: **8.5M inputs with certified references** (interval arithmetic) across **18 closed-form KL families plus `F.kl_div`**, on CPU and GPU.

- Near true KL ≈ 10⁻⁷ (FP32; 10⁻³ for FP16), **over 85% of FP32 values carry ≥1% relative error** in ordinary parameter ranges; at smaller divergences **~30% become negative**.
- **More precision is not the cure**: evaluated one precision level higher, the *same formulas* still leave **7–51% of FP32 values significantly wrong in 22 of 23 configurations**. The problem is the formula, not the dtype.
- Root cause: catastrophic cancellation in naive `p*log(p/q)` style evaluations when p≈q — the informative digits cancel before rounding leaves anything meaningful.

## The fix: stable formulas, not clamps

The authors' **stablekl** library ([github.com/xi-xiaoran/stablekl](https://github.com/xi-xiaoran/stablekl)) combines:

1. **Stable closed-form decompositions** — rewrite each family as a sum of provably non-negative terms,
2. **Compensated arithmetic** (e.g., FMA-based two-sum style error capture),
3. **Special-function evaluation** (log1p-class primitives instead of `log(p/q)`),
4. **Analytic gradients** — so backward passes don't reintroduce the error.

Results: removes **>97% of significant errors** in the working format; strict variants eliminate significant errors on **7.2M scored closed-form samples** and correctly round **all 567M scored `F.kl_div` components**. `stablekl.kl_div` uses float64 internals with one rounding and a guard that falls back to exact interval evaluation, so every output is the correctly rounded value of the given inputs.

## Downstream damage measured (naive vs repaired code)

| Downstream task | Impact of the buggy KL |
| --- | --- |
| Identical-start knowledge distillation | up to **97% top-1 disagreement** between teacher/student runs |
| KL-based layer ranking in a quantized LLM | wrong rankings |
| GPT-2 circuit analysis edge scores | **19–59% of edges** mis-scored |
| Parameter fitting, Bayesian decisions | systematic bias near equal distributions |

With the repaired code these effects "all but vanish".

## Practical guidance

- **Stop clamping negative KL to zero** — it hides the failure instead of fixing the estimate (the negative samples are precisely the near-zero region where accuracy matters, e.g., KL penalties in RLHF/distillation losses).
- If your loss or metric compares similar distributions at small KL, switch to a numerically stable formulation (`log1p`, non-negative decomposition) or use `stablekl.kl_div`.
- Audit *gradients*, not just forward values — the paper finds widespread gradient errors too.
- Don't "fix" it by moving FP32 → FP64 alone: the formulas stay wrong; only a different formula fixes it.

## References

- [arXiv:2611.30835 — The KL Divergence Is Never Negative, Except in PyTorch](https://arxiv.org/abs/2611.30835) (2026-11-23)
- [xi-xiaoran/stablekl on GitHub](https://github.com/xi-xiaoran/stablekl)
- [PyTorch forum: KL Divergence produces negative values](https://discuss.pytorch.org/t/kl-divergence-produces-negative-values/) (long-standing user reports)
