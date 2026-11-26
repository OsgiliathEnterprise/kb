---
title: Breaking Routing And Inter-device Dependencies in Mixture-of-Experts
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.32572
date: 2026-11-24
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Breaking Routing And Inter-device Dependencies in Mixture-of-Experts
**Authors:** John Zarka, Danyal Ahmed, Eugene Belilovsky, Edouard Oyallon
## Overview
BRAID-MoE is an MoE architecture modification that untangles the sequential dependencies making expert-parallel (EP) communication a hard inference bottleneck. By pairing **laddered residual connections** (each expert combine can be deferred to the next block) with **early routing** (the next routing decision is computed from the pre-combine residual), it opens an extended communication window where the previous combine and next dispatch run back-to-back on a dedicated stream, overlapping with attention compute. On a converted Qwen3-30B-A3B it delivers up to 1.29× prefill and 1.37× decode speedups at ~1% validation-loss cost.
## Problem Statement
Under expert parallelism, token dispatch/combine operations between devices scale with model size and can dominate inference latency. Standard MoE dataflow is strictly sequential — routing needs the post-combine hidden state, and combine must finish before the next block — so there is no computational slack in which to hide communication.
## Key Contribution
- **Two coupled architectural relaxations**:
  - *Laddered residuals*: the expert combine of block *i* may be deferred into block *i+1*'s residual path.
  - *Early routing*: block *i+1*'s routing is computed from the **pre-combine** residual (experts still receive the updated post-combine hidden state), removing the routing dependency on the pending combine.
- Creates an extended window where **combine(i) and dispatch(i+1) execute back-to-back on a separate communication stream**, overlapping attention.
- **Checkpoint conversion**: existing MoE checkpoints can be adapted to BRAID with limited extra training, largely recovering original accuracy — adoption doesn't require training from scratch.
- Systematic wins over competing overlap strategies in all tested settings, strongest when communication duration approaches the available compute window.
## Technical Approach
Validated on Qwen3-shaped MoEs at 0.4B-A0.1B and 2.5B-A0.5B: BRAID matches sequential training at matched compute with validation-loss increases of only 1% and 0.5%. For serving, a converted Qwen3-30B-A3B achieves up to 1.29× (prefill) and 1.37× (decode) speedups, and ≥1.12× across diverse workloads and EP configurations on one or two four-H100 nodes.
## Results
- Training parity: +1% / +0.5% validation loss vs sequential at matched compute (0.4B-A0.1B / 2.5B-A0.5B).
- Inference: up to **1.29× prefill, 1.37× decode** on converted Qwen3-30B-A3B; ≥1.12× across all tested workloads/EP configs (1–2 × 4×H100 nodes).
- Beats alternative communication-overlap strategies in every tested setting.
## Relevance to Our Domain
EP inference bottlenecks are exactly where multi-node MoE serving (DeepSeek-style models) loses efficiency; this KB already tracks expert-offloading and EP serving optimizations. BRAID's notable angle is architectural: rather than only scheduling tricks, it reshapes the model so overlap becomes possible — and the checkpoint-conversion path makes it deployable against existing open MoE weights.
## References
- Paper: https://arxiv.org/abs/2611.32572
- Related: [[reference-moe-core-expert-offloading-residency]], [[explanation-echomoe-activation-compression-expert-parallelism]], [[explanation-expert-parallel-bubble-colocation]]
