---
title: 'LoCoJAX — Host-Local Coordination for Small-Model RL on TPUs: Overhead Characterization'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.16301
date: '2026-11-13'
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# LoCoJAX: Host-Local Coordination for Small-Model RL on TPUs

## Overview
Reference for scaling behaviour of single-controller RL stacks (Pathways-style) on TPU v7x, and for the LoCoJAX alternative that moves rollout/reward coordination to each TPU host. The paper's value is its quantitative characterization: where host and network overhead sit as model size shrinks, and when disaggregating rollout from training actually pays.

## Characterization Sweep (dense models, decode-heavy workload, TPU v7x)

| Model size | Non-compute cost profile |
|---|---|
| 0.6B | host orchestration ≈ **36% of step time**; network ≈ 2% |
| Large (→405B) | network communication dominates non-compute time |

Implication: single-controller coordination costs amortize for large models but dominate for the small-model RL regime (RLVR on 0.6–8B, agent post-training).

## LoCoJAX Modes

| Mode | Design | Measured result |
|---|---|---|
| LoCoJAX-CO (colocated) | local rollout + reward processing on each host, synchronous global training | **1.3–3.6× faster/step** vs tuned Pathways baseline (Qwen3-0.6B, 8–64 chips, 3 workloads); on GSM8K completes a step on 8 chips faster than Pathways on 64 |
| LoCoJAX-DA (disaggregated, Ray-managed) | separate hosts for rollout vs training, overlapped | Only pays off when rollout dominates the step: NuminaMath-CoT @256 chips, giving rollout 75% of hosts cuts step time ~15% vs colocated |

## Decision Rule
- **Small model, orchestration-bound** → colocate (host-local coordination), do not disaggregate.
- **Rollout-dominated step, large fleet** → disaggregate with rollout getting most hosts; otherwise the host split + weight transfer costs eat the overlap gain.

## Technical Approach
LoCoJAX keeps JAX's synchronous global training but removes the single controller from per-step hot paths by executing rollout and reward loops locally per host — trading controller-level global scheduling for host autonomy, which is exactly the regime where Pathways' coordination tax is worst.

## Relevance to Our Domain
Direct lookup table for sizing RL fine-tuning clusters on accelerators, and an argument that self-hosted RL infra for small models should avoid centralized coordination layers. Complements our GPU scheduling notes (KVFlow, PACER) from the training side.

## References
- Paper: https://arxiv.org/abs/2611.16301
- Related: explanation-pacer-gpu-power-excursions-edpp, explanation-ai21-jamba-asr-kv-cache-as-replay-buffer (small-model RL regime)
