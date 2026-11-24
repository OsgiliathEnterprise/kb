---
title: When Does Decomposition Help? Empirical Study on Workload-Architecture Affinity
  in LLM Inference Serving
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.29104
date: '2026-11-24'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# When Does Decomposition Help? Empirical Study on Workload-Architecture Affinity in LLM Inference Serving

**Authors:** Jihui Yang, Wentai Wu, Jiahua Huang, Weiwei Lin, Ligang He, Linghong Tsang

## Overview
LLM inference can be organized three ways: independent **monolithic replicas**, tensor/pipeline-**parallel groups**, or **disaggregated prefill/decode** services. Decomposition is usually sold as the efficient option; this study isolates its effect under a fully controlled envelope and finds it is **not a monotonic optimization** — value depends on matching parallelism granularity to the dominant phase while preserving queue stability. The paper coins the term **workload-architecture affinity** for this regime dependence.

## Experimental Setup (the control that makes it credible)
Prior comparisons change several factors at once; this one pins everything:
- **5 SGLang serving organizations** evaluated under one hardware envelope: **4× A100-40GB**
- Model pinned: **Qwen3-8B**; same software stack, same prompts, same arrival schedules
- **150 audited conditions** over three workload shapes: **short-chat, decode-heavy, 32K prefill-heavy**

## Findings Matrix
| Architecture | Wins on | Evidence | Failure mode |
|---|---|---|---|
| **4× one-GPU replicas** (monolithic) | Short chat & long output E2E latency; stability | Lowest E2E latency in these regimes; **only architecture stable in every condition** | Long prefills interfere with decodes in principle (not observed as dominant here) |
| **Pipeline parallelism (PP)** | 32K prefill-heavy TTFT | **TTFT −58–59 %** at non-stress rates | Gains disappear at stress rates |
| **Hybrid pipeline-based disaggregation** | 32K end-to-end latency | Best at **0.4 req/s** | Only best at that rate, not universally |
| **Static single-VM TP2+TP2 split** (no independent phase scaling) | — | No latency improvement over plain replication | **Collapses** at higher 32K load |

## Decision Rules (lookup)
1. **Decode-heavy / concurrent traffic → replicate.** Four independent replicas beat every decomposition on E2E latency and are the only always-stable option.
2. **Prefill-heavy (long input) → pipeline decomposition**, below stress load — it targets exactly the TTFT of long prefills.
3. **Do not statically split a single VM in half** (fixed TP2+TP2) without independent phase scaling: it buys nothing over replication and collapses under long-context stress.
4. General rule: decomposition's value = f(dominant phase vs. parallelism granularity, queue stability). Match granularity to the phase that dominates your traffic; verify queue stability after the split.

## Why It Matters (Reference)
The reusable contribution is the methodology — audited-condition sweeps under a pinned envelope — and the negative result: disaggregation literature's wins often come from confounded comparisons (workload + scaling + stack changing together). Treat "adopt PD-disaggregation" as a default requiring workload justification on your own traffic.

## References
- Paper: https://arxiv.org/abs/2611.29104
- Related in KB: `reference-serverbench-coding-agents-serving-systems.md`, HiPerfCC-KVCache note (this run)
