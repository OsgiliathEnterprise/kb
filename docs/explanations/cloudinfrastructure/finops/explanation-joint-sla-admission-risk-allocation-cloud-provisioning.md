---
title: Joint SLA Admission and Risk Allocation for Cloud Resource Provisioning
diataxis: Explanation
domain: cloud-infrastructure
topic: finops
source: arXiv
source_url: https://arxiv.org/abs/2611.26924
date: 2026-11-24
keywords:
- knowledge-base
- finops
- cloud-infrastructure
- explanations
---
# Joint SLA Admission and Risk Allocation for Cloud Resource Provisioning

## Overview

A cloud controller must reserve enough CPU **and** memory to meet demand without leaving too much capacity idle. This paper studies what happens when both resources share a **single service-level agreement (SLA)**: a shortage of either CPU or memory counts against the same violation budget, so how you split that budget between the two resources directly changes how much headroom each one needs. The paper proposes a controller that chooses the risk split — and the matching reserve — from historical forecast errors.

## Problem Statement

When the SLA budget is shared across resources, the "risk allocation" between CPU and memory is a first-class decision, and it gets harder when forecast-error histories are **short or temporally correlated** (the usual situation for newly onboarded workloads). Naive fixed splits either over-provision (idle cost) or under-provision (SLA shortages).

## Key Contribution
- A controller that compares candidate ways to **split the allowed shortage risk between CPU and memory**.
- For each candidate split, the reserve is derived from **historical forecast errors**; the controller checks whether the history is sufficient to support that split and **consistent across different parts of the history**.
- Among splits that pass validation, it picks the one minimizing the **combined cost of shortages and idle capacity**; otherwise it keeps serving the workload on a **calibrated fallback**.
- Evaluation in simulation and on the **Bitbrains trace**, plus sensitivity analysis of execution delays and adjustment limits on the cost trade-off.

## Technical Approach

Pipeline per admission decision: enumerate risk splits → estimate required extra capacity from forecast-error history → validate history support and temporal consistency of the split → cost-rank surviving splits (shortage cost + idle-capacity cost) → deploy best, or fall back to a calibrated policy when no split is trustworthy. This makes the admission decision (accept under this joint SLA?) and the provisioning decision (how much extra capacity?) two outputs of the same risk-allocation analysis.

## Results

- Simulation setup: joint SLA target = CPU and memory both sufficient in ≥ **95 %** of time slots, using **192 hours** of historical forecast errors.
- Versus always using the fallback: time slots with a shortage in either resource fell by **1.04 percentage points on average**, at the price of a **0.0091 increase in normalized cost** (shortages + idle capacity).
- On the Bitbrains trace, five non-overlapping test windows gave **no clear evidence** of shortages increasing or decreasing — the authors report this honestly as inconclusive.

## Relevance to Our Domain

The shared-budget risk split is a cheap, explainable alternative to full chance-constrained provisioning for heterogeneous fleets (CPU+memory, or CPU+GPU pools): decide how much of your SLA violation budget each resource may consume, validate the split against limited forecast history, and keep a calibrated fallback. The idle-vs-shortage cost framing also applies to LLM serving fleets where reserved capacity sits empty.

## References
- Paper: https://arxiv.org/abs/2611.26924 (cs.DC)
- Related note: `cloud-infrastructure/finops/howto-cloud-budget-alerts-aws-gcp-azure.md`
