---
title: 'VelServe: Taming Decode Jitters in LLM Inference with Tail-Calibrated Scheduling'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.18392
date: '2026-11-16'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# VelServe: Taming Decode Jitters in LLM Inference with Tail-Calibrated Scheduling

## Overview
Interactive LLM services must meet latency SLOs on two axes: time-to-first-token (TTFT) and time-between-tokens (TBT), since streaming and soft-real-time applications need predictable token delivery. The paper identifies **decode jitters** — occasional overruns of a decode step's iteration latency — in both aggregated and disaggregated serving. A jitter delays every request in the batch, and long responses span hundreds of steps, so even rare overruns multiply into many SLO violations. VelServe is a scheduler that calibrates how much prefill work each decode step carries using the **measured tail of that instance's own iteration latency**.

## Problem Statement
SLO-aware schedulers in aggregated serving set each step's prefill budget until predicted latency just meets the TBT target — leaving zero headroom for mispredictions or host stalls. Disaggregation meets average TBT targets at a capacity cost, yet steps that admit new requests still run late. Optimizing the mean, not the tail, is what leaks SLO violations.

## Key Contribution
- **Tail-calibrated prefill budgeting**: the SLO determines how rare a late step must be; VelServe leaves per-iteration headroom sized from the measured iteration-latency tail so overruns don't breach the target decode latency.
- **Shortest-waiting-prompt-first ordering** to offset the prefill slowdown the headroom causes — sound because TTFT deadlines grow with prompt length, so the long prompts it delays have the most slack.
- **Admission spacing under disaggregation** so no request waits behind a burst of admissions.
- **Disaggregated deployment** of the same calibration.

## Results
Measured against the strongest baseline under P99 TBT SLOs, across three attention families and varying workloads:
- VelServe sustains **2.4–2.9× the SLO goodput** of the strongest baseline on Qwen3-8B and DeepSeek-V4-Flash, and **at least 4.4×** on DeepSeek-V2-Lite.
- With prefill and decode disaggregated on eight GPUs, the calibrated admission spacing preserves the goodput advantage.

## Relevance to Our Domain
Interactive agent and chat workloads on shared GPU serving platforms are judged on perceived smoothness, not averages — TBT tail control is the difference between "fast model" and "glitchy model". Sizing deployments by SLO goodput (the highest request rate where most requests still meet their SLO) rather than mean latency is directly applicable to serving dashboards and admission control in our GPU fleet. Related: [[explanation-prefill-fairness-decode-interference-agentic-serving]].

## Enriched Details (verified from arXiv v1 full text, 2026-11-27)

**Provenance.** Ishaan Datta, Alind Khare, Koushik Kumar Dey, Ratnesh Jamidar, Anand Kumar Singh — Sprinklr & Microsoft; submitted 2026-11-13 (cs.AI).

**SLO formalization (why the tail, not the mean).** A request meets the SLO if TTFT ≤ max(1 s, κ·t_solo(P)) with κ=3 (a request may wait up to twice its own idle-prefill time) and its **per-request P99 TBT** ≤ S_D = 150 ms. SLO goodput = highest request rate with ≥90% attainment. Prior SLOs hide the tail: DistServe bounds mean TPOT, Niyama's cumulative token deadlines bound average token rate (pauses up to ~1 s hide there), and pooled P99-over-all-tokens (Sarathi/Medha) lets smooth streams mask stalling ones. A stricter *worst-gap* variant (every gap ≤ S_D) is also reported for speech/pipeline consumers.

**Jitter amplification math.** Even a 1%-per-step jitter rate means **95% of 300-token answers see at least one late gap**; jitters are also correlated (host stalls arrive in bursts). Measured: 89–98% of requests meet the 150-ms bound at P90 but only **62–74% at P99**. Medha *plans* zero overruns yet 1.4–4% of its iterations actually jitter; Niyama *plans* 1–8% (banked slack from cumulative deadlines lets it schedule steps past S_D by design).

**Mechanism internals.** Fast path (every iteration): planner orders waiting prompts shortest-remaining-first, fills budget N* with one decode token per stream plus prefill chunks; a shorter arrival preempts a running prefill at a chunk boundary (KV stays on GPU). Slow path (background, every 500 iterations): refit the linear cost model t = a + c_p·p + c_d·b + g·Σ C_i·k_i + ε via **Huber regression on the last 8k iterations** (regularized toward an offline fit), then set the margin Q as a **rank statistic of its own residuals** at share η = β(1−α)(k+1)/ō (β=0.5, attainment target α=0.99) — a fitted distribution misses clustered host stalls. Residuals that would break S_D even at minimal budget count toward the rank instead of inflating Q; if N* bottoms out, the TBT SLO is flagged infeasible. On Qwen3-8B the margin self-calibrates from 2.3 ms to ~50 ms. Moore–Hodgson-style demotion (not dropping) protects hopeless requests.

**Attention family decides the cost model.** Under GQA/MLA, cost grows with context offset (late chunks/deep decodes cost more) — a context-aware time model is required. Under **compressed attention (DeepSeek-V4 style)** cost barely grows with context and a decode ≈ one prefill token, so plain token counts work up to ~170–220k context; VelServe auto-switches between the two regimes. On DeepSeek-V2-Lite, token-only budgeting would drop attainment from 99% to 84% at 0.75 req/s.

**Disaggregation ("joins").** The decode step that admits newly prefilled requests takes 170–185 ms *regardless of how many it admits* — every join is a jitter, and expert-parallel ranks in lockstep spread it cluster-wide. Fix: amortize joins **group-commit-style** (batch admissions together) and admit on all EP ranks simultaneously (**coordinated-GC-style** merged pause), with the interval *derived from the SLO*: a 600-token answer tolerates k(600)=6 gaps above S_D, so a stream may absorb one stall every n·t_d/k(n) seconds.

**Implementation & evaluation footprint.** ~1k lines of Python as a vLLM 0.30 V1-scheduler plugin (queue reordering + per-request chunk caps; batching/KV/CUDA graphs untouched); planning median 0.01 ms vs 10.6 ms median iteration. Evaluated across 3 attention families (Qwen3-8B GQA, DeepSeek-V2-Lite MLA, DeepSeek-V4-Flash compressed), 5 workloads (incl. replayed Mooncake trace), 6 schedulers, TBT targets 100–500 ms; disaggregated arm = one node, 4 prefill + 4 decode GPUs. VelServe measured overrun: 0.00–0.02% of iterations vs Medha 1.36–3.97%. Prefix-cache-aware: follow-up turns are sized by their uncached suffix, holding P99 TTFT ≤ 1.5 s to saturation on multi-turn sessions.

## References
- Paper: https://arxiv.org/abs/2611.18392
- HTML v1 full text: https://arxiv.org/html/2611.18392v1
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18392
