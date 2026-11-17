---
title: 'A Matter of Stages: Energy-Latency Trade-offs in Multimodal LLM Serving'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.21165
date: 2026-11-17
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# A Matter of Stages: Tuning Energy-Efficient Multimodal LLM Serving (EPD Disaggregation)

## Overview

How to configure a multimodal LLM serving stack for minimum GPU energy per successful request without breaking latency SLOs. The paper studies the two coupled knobs of **EPD (Encode–Prefill–Decode) disaggregation** — whether to separate the visual encoder, prefill, and decode stages across GPUs, and at what clock frequencies to run each — and delivers a probe-efficient tuning procedure.

## When to Use

You serve multimodal models online on a fixed GPU budget (the study uses three GPUs, four models, 18 workload combinations) and want lower energy per request than a fused, stock-frequency deployment.

## Procedure

1. **Decide the topology**: compare fused vs EPD-disaggregated serving for your workloads. Disaggregation gives independent per-stage control but changes communication and queueing behavior.
2. **Measure energy per *successful* request, not per token**: reducing power at one stage does not necessarily reduce total GPU energy per request, because downclocking one stage can increase queueing and prolong execution across the whole EPD pipeline.
3. **Apply downclocking selectively**: stage sensitivities differ; aggressive frequency cuts offset power savings through queueing. As a safe default, **uniform downclocking to 80%** cut GPU energy 11.7–18.6% with modest mean-latency changes.
4. **Don't over-trust exit throughput**: disaggregation reduced GPU energy per successful request by **13.3–37.0% at nearly identical output-token throughput**, but increased mean TTFT — check the latency metric that your SLO actually constrains.
5. **Run budgeted frequency exploration**: instead of sweeping all configurations, use the paper's strategy — **4 probes identified the lowest-energy feasible configuration among 25 measured candidates in all 288 positive-margin SLO scenarios** evaluated.

## Key Findings (reference values)

| Lever | Energy effect | Latency effect |
|-------|--------------|----------------|
| EPD disaggregation | −13.3% to −37.0% GPU energy / successful request | Mean TTFT up; throughput ~unchanged |
| Uniform downclock to 80% | −11.7% to −18.6% | Modest mean-latency change |
| Aggressive single-stage downclock | Savings can be **offset** by queueing | Prolongs pipeline execution |

## Relevance to Our Domain

Actionable guidance for GPU fleets running vision-language serving: energy tuning must be stage-aware and SLO-constrained, and a 4-probe search makes per-workload tuning operationally feasible. Complements the KB's GPU-compute/FinOps coverage with a concrete energy-tuning procedure.

## References

- Paper: https://arxiv.org/abs/2611.21165
- Background: NVIDIA Dynamo EPD disaggregation (developer.nvidia.com blog); vLLM encoder disaggregation blog (vllm.ai/blog/2025-12-15-vllm-epd)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21165
