---
title: 'ROCm InferaSim: Cut LLM Serving Trial Costs and Deploy the Best Configuration'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.04032
date: '2026-11-17'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# ROCm InferaSim: Cut LLM Serving Trial Costs and Deploy the Best Configuration

## Overview
ROCm InferaSim is an AMD framework that **predicts LLM serving performance from a few measured "anchor" configurations** instead of exhaustively benchmarking every candidate on real GPUs. Exhaustively evaluating all candidate serving configurations in the paper's study would have required **~25,000 GPU-hours**; InferaSim replaces that sweep with predictions grounded in a small measured anchor set plus transfer laws, so teams shortlist configurations before committing scarce AMD GPU time.

## Core Idea (anchor-based prediction)
- **Key observation**: many serving choices change performance in smooth, predictable ways, so a handful of carefully chosen measured points ("anchors") can predict the behavior of the surrounding configuration space.
- **Anchor economics (measured on AMD Instinct MI355X, engines vLLM / SGLang / ATOM)**: measuring **11 anchors took 9.1 GPU-hours**, while physically measuring the **226 fixed-length configurations they cover took 204 GPU-hours** — a ~22× measurement saving for that slice.
- Predictions cover the serving configuration space (engine choice, model/hardware mapping, multi-GPU step-time behavior) so deployment candidates are ranked off-GPU.

## Transfer Laws — the mechanics (why the 44% case is a baseline, not a limit)
Per the AMD ROCm blog, InferaSim splits configuration parameters into two kinds:
- **Anchor-defining** (change *which kernels run*, each combination needs its own anchor): model, dtype, attention/collective backend, graph mode, speculative decoding.
- **Transferable** (carried analytically from an existing measurement): batch, concurrency, context length, TP/EP/PP, replica count, arrival rate.

An **anchor** is a JSON file holding a batch sweep of measured prefill/decode step latencies plus a signature of exactly what was running. Key transfer tricks:
- **TP carry**: weight reads and GEMMs shard across GPUs, but launches/synchronization/scheduling do not — InferaSim keeps that unsharded floor (read from the anchor's batch sweep) and divides only the rest. Carrying a DeepSeek-V4-Pro TP4 anchor to TP8: **0.9% median error** with the floor trick vs **44.1% error** for naive whole-step division. (The 44% figure is the naive baseline, not InferaSim's accuracy.)
- **Prefill** fitted as a curve `F + a·n + b·n²`; fixed cost `F` held across parallelism, per-token terms sharded (measured `F` agrees within 1% across widths).
- **Graph-capture staircase**: captured graphs run at fixed batch sizes (batch 33 pads to 40); projection looks up the measured "rung" instead of interpolating.
- **Multi-node: reduce → measure → restore** (adapted from Primus Projection for training): reduce the target to at most one node, measure there, restore EP load / PP hops / cross-node collectives / disaggregated pools / host-DRAM KV tiers analytically. Measurement stays confined to one node regardless of deployment size.
- **DES (discrete-event simulator)** for tails: a measured DeepSeek-V4-Pro TP8 run had median ITL 21.7 ms but p99.9 **1392 ms** (decode pauses when a new prompt's prefill is admitted) — steady-state means hide this, the DES does not.

## CLI Quick Start (lookup)
```bash
git clone https://github.com/AMD-AGI/Infera.git && cd Infera
pip install ".[projection]"          # inferasim
pip install ".[projection-tuning]"   # adds inferasim-tune
# kernel models (Origami) build against ROCm/HIP

inferasim inference --config ... --gpu-arch mi355x --hbm-capacity-gb 288 \
  --profiling-mode simulate                 # no GPU needed; rank within one engine
inferasim anchor --model ... --serving-backend sglang --tp 8 --save anchor.json
inferasim inference ... --load-benchmark anchor.json   # anchored mode (default)
inferasim pareto ... ; inferasim mix pareto_out --top 5
inferasim-tune --inference --workload ... --target-cluster ...
```
`--profiling-mode simulate` is fully analytical (no anchor) — use only for ranking within one engine; anchored mode calibrates the step model for absolute numbers. The tuning agent searches 36 serving levers against 24 projected objectives; the LLM loop only *proposes*, every number comes from the projector. Mix planner `--top 5` picks included a candidate within 12% of the measured best for 22/23 model×latency-tier combinations.

## Validation Numbers
- On **172 configurations** passing the authors' measurement filters: **8.1% median error on time-per-output-token**.
- On a **multi-turn coding workload**: predictions **within 8% on throughput**.
- Transfer-law limits are honest: extrapolating a measured four-GPU DeepSeek-V4-Pro step time to predict eight-GPU performance gives **44% median error only if you naively divide the whole step by TP** — InferaSim's unsharded-floor transfer law brings that same carry to **0.9% median error**. Intra-regime interpolation is strong; naive cross-size extrapolation is the weak spot.
- Broader validation on the public InferenceX benchmark (262 fixed-length runs, 159 disaggregated, plus AgentX agentic traces): disaggregated serving predicted at **5.5% error on throughput/GPU** with no disaggregated anchor; ranking correctness 93.4% (anchored) / 89.0% (simulate) on decisive throughput pairs.

## When To Use This (lookup)
Teams on AMD/ROCm hardware deciding serving configurations (engine × model × parallel layout) before burning GPU-hours: use anchors + predictions to shortlist, then measure only the finalists on hardware. Caveats: fidelity is validated on MI355X with vLLM/SGLang/ATOM; simulate mode (no anchor) is for within-engine ranking only, and anchor-defining changes (dtype, backend, graph mode, speculation) each need a fresh anchor.

## References
- Paper: https://arxiv.org/abs/2611.04032
- AMD ROCm blog (quick start, architecture, validation): https://rocm.blogs.amd.com/software-tools-optimization/inferasim/README.html
- Code: https://github.com/AMD-AGI/Infera (Origami kernel models: https://github.com/ROCm/rocm-libraries/tree/develop/shared/origami)
- InferenceX public benchmark: https://inferencex.semianalysis.com/
- Related: [[Evolving Infra: Agent-Adaptive LLM Serving at Scale]], [[ServerBench: How can your coding agents design specialized LLM serving systems?]]
