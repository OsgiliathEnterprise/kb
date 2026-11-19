---
title: 'eFAIR: Fair LLM Serving under Hourly Electricity Commitments'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.24119
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# eFAIR: Fair LLM Serving under Hourly Electricity Commitments

## Overview
eFAIR is an online scheduler for LLM serving inside a hard hourly electricity budget — the kind imposed when a datacenter commits to day-ahead market purchases hour by hour. It shows that maximizing aggregate throughput under such a budget can still starve individual requests, and formulates *fair* serving as a leximin optimization over a normalized-throughput metric.

## Problem Statement
When an LLM service must respect an hourly energy commitment, throughput-maximizing schedulers can leave some requests waiting or served far below desired rates. Fairness is harder than usual because electricity spent now is electricity unavailable to unknown future arrivals in the same hour — the scheduler must reserve energy for future demand while lifting the worst-served current requests.

## Key Contribution
- **Normalized throughput** as the fairness unit: a request's actual output rate divided by (its standalone throughput × its service entitlement, a per-request weight for desired service level).
- Formalization of fair serving as **leximin optimization under an hourly electricity constraint** — iteratively improving the most poorly served request.
- The **eFAIR scheduler** coordinating three levers around a common normalized-throughput target:
  1. *Request dispatching* — prioritized by desired service level and progress;
  2. *Electricity budget allocation* — reserves energy for current plus expected future work;
  3. *GPU frequency selection* — spends electricity savings to raise GPU clocks for high-entitlement requests.

## Technical Approach
All three subsystems (dispatch, budget, frequency) are driven by the same target normalized throughput, so allocation decisions stay consistent. Energy reservation anticipates intra-hour arrival and demand uncertainty instead of greedily consuming the hourly commitment. DVFS (GPU frequency) becomes a fairness knob, not just an efficiency knob.

## Results
- Evaluated on H20 and H200 configurations with 32 replicas each.
- Improves the **10th percentile of normalized throughput by 28.0–31.0%** over the best budget-feasible baseline.
- Keeps absolute deviation from the hourly electricity commitment **below 0.26%**.
- Better throughput balance among concurrent requests; electricity allocation tracks service demand over time more closely.

## Relevance to Our Domain
Energy is becoming a first-class scheduling constraint for GPU fleets (see the KB's PACER power-excursion and energy-latency serving notes). eFAIR adds the fairness dimension: how to keep tail requests healthy when the hour's kWh is a hard budget, relevant for anyone operating LLM inference against day-ahead power markets or carbon-aware commitments.

## References
- Paper: https://arxiv.org/abs/2611.24119
- Related: [[explanation-pacer-gpu-power-excursions-edpp]], [[how-to-energy-efficient-epd-serving]]
