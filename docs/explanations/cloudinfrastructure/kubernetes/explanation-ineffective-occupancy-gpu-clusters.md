---
title: 'Ineffective Occupancy in Heterogeneous GPU Clusters: Readiness-Aware Scheduling
  (RAS)'
diataxis: Explanation
domain: cloud-infrastructure
topic: kubernetes
source: 'arXiv: Ineffective Occupancy in Heterogeneous GPU Clusters: Prediction, Contribution
  Analysis, and Readiness-Aware Scheduling (arXiv:2610.25066)'
source_url: https://arxiv.org/abs/2610.25066
date: 2026-10-25
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- explanations
---
# Ineffective Occupancy in Heterogeneous GPU Clusters

## Overview

In heterogeneous GPU clusters, placing a job on a machine does not mean the job is *ready to run* — it may sit allocated, waiting on dependencies, images, or upstream jobs, holding expensive GPUs while producing no useful computation. This paper (cs.DC, Oct 2026; 24 pages, code at `github.com/liaobin665/gpu-ras`) measures that waste on the Alibaba GPU cluster trace and names it **ineffective occupancy**: **52.70% of execution records never became ready at all**, even when GPU capacity was sufficient and placement was complete. It then proposes **Readiness-Aware Scheduling (RAS)**, which keeps the placement policy fixed and instead reorders *admission* using a readiness-probability model.

## Problem Statement

Classical cluster scheduling optimizes placement given jobs are ready. The missing dimension: readiness itself. Allocated-but-not-ready jobs are invisible to utilization metrics — the GPUs show as busy while doing nothing — which aggravates waste in exactly the large, long-running, multi-GPU jobs that dominate heterogeneous clusters.

## Key Contribution

- **A measurable phenomenon**: ineffective occupancy, quantified on a production trace (52.70% of execution records never ready).
- **RAS**: a scheduler that uses **only nine attributes observable at admission time** to predict per-job readiness probability and reorders the admission queue accordingly — no ground-truth labels, no changes to the placement policy.
- **A contribution analysis** of the predictive model (gradient-boosted, five-fold split grouped by machine): the score is driven mainly by **job profile, duration, and GPU model**; the **request-size group contributes least**, followed by the scheduling/concurrency group. The joint model captures gains that no single-attribute rule combination reaches.

## Results

| Metric | Baseline | RAS |
|--------|----------|-----|
| Model quality (readiness ROC-AUC) | — | **0.8187** |
| Ineffective-occupancy ratio (share of cluster GPUs held under ineffective occupancy) | 43.64% | **27.15%** |
| Effective coverage of large requests (≥8 GPUs) | 46.11% | **63.18%** |
| Capacity utilization | — | preserved (no sacrifice) |
| vs. ground-truth ordering upper bound | — | captures **65.1%** of attainable improvement |

The last row is the important robustness claim: RAS recovers most of what an oracle with perfect readiness labels could do, using only admission-time features.

## Relevance to Our Domain

Directly relevant to the GPU-workload scheduling notes in this topic (and to the securing-Kubernetes-for-AI-agent-workloads note): the "allocated ≠ ready" gap is the same failure mode that makes GPU capacity look scarcer than it is for LLM-serving and training workloads on Kubernetes. The nine admission-time attributes are cheap to instrument in any admission webhook, and the result — a ~16.5-point drop in the ineffective-occupancy ratio with zero utilization cost — is exactly the class of win admission-ordering changes should deliver. The contribution analysis (job profile/duration/GPU model matter; request size barely matters) is a useful prior for feature selection in our own scheduling experiments.

## References

- Paper: https://arxiv.org/abs/2610.25066
- Code: https://github.com/liaobin665/gpu-ras
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.25066
