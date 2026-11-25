---
title: 'Spade: Scalable Placement for Disaggregated LLM Serving on Heterogeneous Edge
  Fleets'
diataxis: Explanation
domain: cloud-infrastructure
topic: edge-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.32881
date: '2026-11-25'
keywords:
- knowledge-base
- edge-compute
- cloud-infrastructure
- explanations
---
# Spade: Scalable Placement for Disaggregated LLM Serving on Heterogeneous Edge Fleets
**Authors:** Truong-Thanh Le, Hoang-Loc La, Amir Taherkordi, Frank Eliassen, Phuong Hoai Ha (arXiv:2611.32881, cs.DC, 24 Nov 2026)
## Overview
Spade is a **placement planner** for disaggregated prefill/decode (d-p-d) LLM serving with **pipeline replication** across heterogeneous edge clusters. It decides how devices are grouped into model replicas, which replicas take the prefill vs decode role, and how layers are partitioned across devices — jointly optimized under a **congestion-aware objective**. Target environment: commodity local-area networks rather than high-speed interconnects such as NVLink; measurement studies cited by the paper show that queueing delay and KV-cache transfer dominate tail TTFT in loaded clusters, which is why the planner optimizes a congestion-aware objective.
## Problem Statement
Edge clusters are attractive for privacy-sensitive, on-prem serving but are resource-poor and highly heterogeneous, and bursty demand causes congestion and queue buildup. Replicating the model into multiple pipeline instances raises capacity, yet grouping devices into replicas, assigning them prefill/decode functions, and partitioning layers across heterogeneous devices jointly form a large combinatorial optimization problem. Prior search-based planners (tabu search à la ThunderServe, genetic algorithms à la E2LLM) scale poorly and offer no optimality guarantee; Helix and Parallax maximize aggregate throughput without prefill–decode role assignment, and the exact formulations of Helix and Halda solve only layer placement (the inner problem) rather than replica formation — none handle the full joint problem at fleet scale.
## System Design & Method
| Aspect | Spade's choice |
|---|---|
| Workload | Disaggregated prefill/decode with replicated pipeline instances |
| Hardware (testbed) | 8 devices spanning 5 hardware types over a LAN, CUDA–Metal mix (RTX 5070 12 GB, RTX 3060M 6 GB, DGX Spark 128 GB, Apple M1/M2 Max, Ryzen 5 5800H) |
| Models evaluated | DeepSeek_R1_Distill_Qwen_14B_Q6_K ("DeepSeekR1": 11.3 GB stored, all 14B params activated via dense FFNs) and Qwen3-30B-A3B-Q4_K_M ("Qwen3MoE": 17.3 GB stored, ~3B activated via MoE) |
| Search-space reduction | **Dominance-based pruning**: discard inferior replica candidates, recursively eliminate larger candidates that contain them |
| Layer partitioning | **Water-filling** approach, reducing complexity from O(KL²) to O(K) |
| Placement | **Bounded multidimensional knapsack** under a congestion-aware objective; solved by knapsack DP (~109 ms) or MILP when memory limits bind |
| Topology | Decentralized routing (vs the star topology routing all activations through one node used by llama.cpp/E2LLM) |
| Validation | 8-device physical CUDA–Metal testbed + synthetic fleets; throughput predictor with &lt;0.5 % error |
Key modeling insight: the placement objective must be **congestion-aware** (charge KV-cache transfer and queueing, not just token load), otherwise placements that look balanced computationally collapse on tail latency over a commodity LAN.
## Results
- **Synthetic fleet of 30 devices / 5 hardware classes**: Spade finds the **optimal placement in 441 ms**, whereas the state-of-the-art genetic-search baseline with DP partitioning needs ~**6855 s (≈2 h)** and still ends **19.7 % worse** on the congestion objective.
- **Fleets with 10 device types**: dominance pruning eliminates **99.6 % of candidate placements** while yielding the *same surviving candidate set* as exhaustive enumeration (correctness-preserving reduction).
- On the 8-device CUDA–Metal testbed, Spade-selected placements reduce worst-case waiting time vs role-agnostic baselines (FT, E2LLM, Splitwise incur maximum waiting times on the DeepSeekR1 workload).
- Planner runtime: knapsack DP best ~109 ms; full-MILP Pareto solve ~223 ms–11.3 s depending on memory constraints.
## Relevance to Our Domain
Complements the KB's edge-serving line (LEDGE request-level simulator, edge-inference offloading notes): Spade supplies the *fleet-planning* layer — a knapsack/DP + MILP formulation anyone building on-prem heterogeneous inference clusters (consumer RTX GPUs, DGX Spark, commodity LAN) can adapt, plus a quantitative case that congestion-aware (KV-transfer-aware) placement is what makes disaggregation pay off outside the datacenter. Note for tooling: the planner's inputs are (device inventory, layer costs, demand profile, SLO) → outputs (replica grouping, prefill/decode roles, layer partition) — a clean candidate for a coded AI tool.
## References
- Paper: https://arxiv.org/abs/2611.32881 (Le, La, Taherkordi, Eliassen, Hoai Ha)
- Related: [[reference-ledge-edge-llm-serving-simulator]], , 
