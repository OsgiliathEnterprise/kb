---
title: 'ScaleBench: An Extensible and Reproducible Experimental Platform for Kubernetes
  Autoscaling Research'
diataxis: Explanation
domain: cloud-infrastructure
topic: kubernetes
source: arXiv
source_url: https://arxiv.org/abs/2611.24398
date: 2026-11-19
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- explanations
---
# ScaleBench: An Extensible and Reproducible Experimental Platform for Kubernetes Autoscaling Research

## Overview
**ScaleBench** is a native-Kubernetes experimental platform for extensible, reproducible evaluation of autoscaling solutions. Its distinguishing design choice: research autoscalers are integrated as **native Kubernetes components**, so evaluation covers not just scaling performance but also deployment characteristics and integration requirements in realistic cloud-native environments.

## Problem Statement
A large gap persists between academic autoscaling research (rule-based, optimisation-based, ML-based) and practice: real Kubernetes deployments still rely on the reactive, CPU-based Horizontal Pod Autoscaler. Prior reproducibility studies looked at configuration and benchmark metrics, but the *practical deployment, integration complexity, and operational overhead* of research autoscalers in Kubernetes received little attention.

## Platform Components
- **Native component integration** — autoscalers run as first-class Kubernetes components rather than external controllers bolted on, exposing real integration costs.
- **Extensible evaluation surface** — systematic, repeatable experiments across competing autoscaling approaches.
- **Dual assessment axes** — scaling performance *and* deployment/integration characteristics (install footprint, operational overhead) within realistic cloud-native stacks.

## How to Use It (lookup guidance)
| Goal | What ScaleBench gives you |
|------|---------------------------|
| Compare autoscalers reproducibly | Common experimental platform with repeatable runs |
| Assess adoption feasibility | Deployment/integration metrics per autoscaler |
| Prototype a new autoscaler | Native-component interface instead of standalone controller |
| Case-study evidence | Published multi-approach case study demonstrating systematic assessment |

## Results
A case study evaluating multiple autoscaling approaches demonstrates the platform supports systematic, repeatable, and practical assessment — surfacing deployment-level differences that pure benchmark studies hide.

## Publication Details
Ze Wang, Sajid Alam, Amjad Ullah — submitted 2026-11-18, accepted at **ContinuumOps: DevOps for the Edge-Cloud Continuum**, the 1st workshop co-located with the 24th IEEE International Symposium on Network Computing and Applications (IEEE NCA). CC-BY 4.0. A workshop-scale systems paper: read it for the platform design pattern, not for headline benchmark numbers.

## ⚠️ Naming Collision
The GitHub repo `scaledown-team/ScaleBench` (and PyPI package `scalebench`, homepage `ScaleBench_AI` by Infobell IT) is an **unrelated project** — a CLI tool for benchmarking LLM inference endpoints, not a Kubernetes autoscaling harness. Searching "ScaleBench" will surface it first; it is **not** the code for this Kubernetes autoscaling platform. No public code release for the autoscaling ScaleBench was found as of 2026-11-19.

## Positioning vs Prior Reproducibility Work
Earlier reproducibility studies of Kubernetes autoscalers focused on configuration surface and benchmark metrics (scaling latency, SLO violation rates). ScaleBench's delta is treating *integration itself* as a measured axis: by running candidate autoscalers as native Kubernetes components, install footprint, deployment characteristics and operational overhead become first-class results — the factors that actually gate adoption of research autoscalers in production.

## Relevance to Our Domain
The missing evaluation tooling for our Kubernetes autoscaling cluster of notes ([[howto-choose-hpa-vpa-cluster-autoscaler]], [[explanation-ineffective-occupancy-gpu-clusters]]): before adopting any ML-based autoscaler, ScaleBench provides the harness to test integration overhead in-cluster instead of trusting paper benchmarks. Also useful as a template for building our own reproducible infra experiments.

## References
- Paper: https://arxiv.org/abs/2611.24398
- Context: Kubernetes Horizontal Pod Autoscaler (the reactive baseline)
