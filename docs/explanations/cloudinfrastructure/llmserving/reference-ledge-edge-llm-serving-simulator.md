---
title: 'LEDGE: An Efficient Simulator for Distributed LLM Serving on Heterogeneous
  Edge Devices'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.24085
date: '2026-11-20'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# LEDGE: An Efficient Simulator for Distributed LLM Serving on Heterogeneous Edge Devices

## Overview
LEDGE is a lightweight, open-source simulator for evaluating distributed LLM serving across heterogeneous edge devices (Jetsons, Raspberry Pis) **without executing tensor operations**. It targets the costly design space of model partitions × device placements × network conditions, where repeated physical experiments are impractical.

## Problem Statement
Evaluating edge LLM serving requires exploring diverse partition schemes, placements, and network conditions. Physical testbeds are slow and expensive to sweep; existing simulators either lack fine-grained placement support, miss runtime behavior, or have high simulation overhead.

## Specification / Key Features
| Aspect | Detail |
|---|---|
| Model representation | Event graphs supporting non-uniform **tensor and pipeline parallelism** |
| Cost estimation | Reusable performance models calibrated from end-to-end measurements (no tensor execution) |
| Network | Simulates **shared-link contention** between co-located devices |
| Testbed validation | 10 Jetson + Raspberry Pi devices, 17 model–precision combinations, 4 LLM families |
| Accuracy (Qwen) | Request-level MAPE **&lt; 3.6%** |
| Transfer accuracy | Models calibrated on one LLM family: **7.44% zero-shot** end-to-end latency MAPE on three other families |
| Speed | **135.3× aggregate speedup** over physical inference; 26,773 simulation runs in 83.8 minutes across four edge environments |
| Source | https://github.com/gdfwj/LEDGE |

## Technical Approach
LEDGE builds an event graph of the serving pipeline, estimates each stage's execution cost from calibrated performance models, and layers on shared-link contention so placement decisions reflect real bandwidth interference. Because costs come from models rather than kernel execution, sweep sizes impossible on hardware become routine.

## Findings Enabled by the Simulator
- Shared-link contention materially changes optimal placement decisions.
- Network topology (not just compute) constrains scaling of distributed edge serving.

## Broader Context (added 2026-11-20, KB enrichment)
- Edge-first inference studies underscore *why* heterogeneous placement matters: memory is the binding constraint on-device (e.g., full-precision Llama2-7B needs ≥28 GB vs. 8–16 GB on a Jetson Orin NX), forcing partition/quantization decisions that LEDGE's model–precision sweep space captures.
- Cloud-vs-edge cost comparisons (GPT-4 cloud vs. Qwen-2.5 SLMs on Jetson AGX/Nano) show per-response economics, not just latency, drive placement — an axis a calibrated simulator can sweep cheaply before buying hardware.

## Relevance to Our Domain
Complements the KB's LLM-serving simulation coverage (Koi, InferSim/ROCm, ServerBench): LEDGE fills the **heterogeneous edge** niche — useful for planning distributed inference on ARM/Jetson fleets, on-prem edge boxes, or federated devices where interconnect asymmetry dominates.

## References
- Paper: https://arxiv.org/abs/2611.24085
- Code: https://github.com/gdfwj/LEDGE
- Edge-First Language Model Inference: Models, Metrics, and Tradeoffs: https://arxiv.org/abs/2505.16508
- Related: [[reference-rocm-inferasim]], [[reference-koi-edge-llm-serving-simulator]]
