---
title: 'Reliability-aware AI Agent Execution in Collaborative Edge Computing: A World
  Model Approach'
diataxis: Explanation
domain: cloud-infrastructure
topic: edge-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.32520
date: 2026-11-24
keywords:
- knowledge-base
- edge-compute
- cloud-infrastructure
- explanations
---
# Reliability-aware AI Agent Execution in Collaborative Edge Computing: A World Model Approach

## Overview
Chen, Cao, Gao, Wu & Ji (arXiv:2611.32520, submitted 2026-11-24; HK PolyU / Qilu Univ. of Technology / NII Tokyo) address a neglected dimension of edge agent deployment: **reliability**. When AI agents run distributed across heterogeneous, user-controlled edge devices, node failures and wireless disruptions can corrupt or lose execution state, and the resulting recovery/recomputation eats the remaining deadline budget. Their answer is **WorldMPC** — a world-model-based model-predictive controller that plans resource allocation, state protection, and recovery jointly.

## Problem Statement
Collaborative edge computing spreads agent execution over flaky, resource-limited personal devices. Disruptions make agent execution state unavailable or inconsistent; naive recovery wastes the deadline budget, so task completion before deadlines collapses. Keeping execution states *recoverable* — proactively — is what preserves deadline compliance.

## Approach
1. **Formulate an online execution-management problem**: jointly select resource allocations, state-protection actions, and recovery targets to maximize expected task success rate under resource, compatibility, and deadline constraints.
2. **Build a world model** that jointly captures evolving agent workflows *and* recoverable execution state under candidate management actions, accounting for node reliability, network conditions, and resource availability.
3. **Simulate before committing**: the controller rolls out future execution and recovery trajectories under each candidate action to estimate effects on progress and on-time completion.
4. **Control with WorldMPC**: world-model-based model predictive control with **Monte Carlo rollouts** picks the action set optimizing long-term reliable execution.

## Results
Evaluated in **simulation and on a real-world testbed** with real-world and synthetic datasets: WorldMPC improves task success rate over baselines in both settings.

## Evaluation Detail (added 2026-11-28)
**Baselines (4):** HEFT (upward-rank ordering on the revealed DAG), EDF (absolute-deadline ordering, arrival-order tie-break), FIFO (arrival order), FRH (arrival order + lowest-placement-risk heuristic). All four baselines are pinned to compute fraction 1 and **8 s periodic checkpointing** at supported committed boundaries; WorldMPC additionally chooses from {1, 0.5} compute fractions and selects protection actions. Service rate scales as (allocated fraction)^0.8. All methods share dependency checks, compatibility constraints, transfer accounting, and recovery rules — so the comparison measures the **complete control policy**, not just the ordering rule.

**Headline TSR gains over HEFT / EDF / FRH / FIFO:** +16.7% / +21.7% / +75.0% / +21.7%. Planning and recovery costs are counted inside the numbers, so the gain is net of WorldMPC's own rollout overhead. Ablations additionally probe how the planning budget trades off TSR against controller fallback.

**Real-world testbed:** 2× RTX 4090 worker hosts wired to existing model services; one agent stage admitted per worker. Tool containers run two profiles (0.5 CPU / 256 MiB and 1 CPU / 512 MiB); checkpoint storage bounded at **64 MiB per worker**; export and import share a single serialized controller path with transfer caps of 128 KiB/s, 512 KiB/s, and 2 MiB/s. A controller-side monotonic clock measures complete response delivery.

The transfer caps and the 64 MiB checkpoint bound are the load-bearing constraints: state protection competes with execution for memory *and* bandwidth, which is exactly the trade-off WorldMPC prices in rather than hardcoding a checkpoint interval.

## Relevance to Our Domain
As we run agent workloads closer to the edge (and on heterogeneous GPU fleets), the framing "state protection is a scheduling decision, not an afterthought" is the transferable idea: checkpoint/protection actions should be optimized *jointly* with placement, using a model of node reliability. The world-model + MPC pattern is also a reference architecture for any agent orchestrator that must meet deadlines under failure.

## References
- Paper: https://arxiv.org/abs/2611.32520
