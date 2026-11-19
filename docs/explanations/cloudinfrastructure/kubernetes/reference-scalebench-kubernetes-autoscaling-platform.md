---
title: 'ScaleBench: An Extensible and Reproducible Experimental Platform for Kubernetes
  Autoscaling Research'
diataxis: Explanation
domain: cloud-infrastructure
topic: kubernetes
source: arXiv
source_url: https://arxiv.org/abs/2611.24398
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

## Relevance to Our Domain
The missing evaluation tooling for our Kubernetes autoscaling cluster of notes ([[howto-choose-hpa-vpa-cluster-autoscaler]], [[explanation-ineffective-occupancy-gpu-clusters]]): before adopting any ML-based autoscaler, ScaleBench provides the harness to test integration overhead in-cluster instead of trusting paper benchmarks. Also useful as a template for building our own reproducible infra experiments.

## References
- Paper: https://arxiv.org/abs/2611.24398
- Context: Kubernetes Horizontal Pod Autoscaler (the reactive baseline)
