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
Chen et al. (arXiv:2611.32520, submitted 2026-11-24) address a neglected dimension of edge agent deployment: **reliability**. When AI agents run distributed across heterogeneous, user-controlled edge devices, node failures and wireless disruptions can corrupt or lose execution state, and the resulting recovery/recomputation eats the remaining deadline budget. Their answer is **WorldMPC** — a world-model-based model-predictive controller that plans resource allocation, state protection, and recovery jointly.

## Problem Statement
Collaborative edge computing spreads agent execution over flaky, resource-limited personal devices. Disruptions make agent execution state unavailable or inconsistent; naive recovery wastes the deadline budget, so task completion before deadlines collapses. Keeping execution states *recoverable* — proactively — is what preserves deadline compliance.

## Approach
1. **Formulate an online execution-management problem**: jointly select resource allocations, state-protection actions, and recovery targets to maximize expected task success rate under resource, compatibility, and deadline constraints.
2. **Build a world model** that jointly captures evolving agent workflows *and* recoverable execution state under candidate management actions, accounting for node reliability, network conditions, and resource availability.
3. **Simulate before committing**: the controller rolls out future execution and recovery trajectories under each candidate action to estimate effects on progress and on-time completion.
4. **Control with WorldMPC**: world-model-based model predictive control with **Monte Carlo rollouts** picks the action set optimizing long-term reliable execution.

## Results
Evaluated in **simulation and on a real-world testbed** with real-world and synthetic datasets: WorldMPC improves task success rate over baselines in both settings.

## Relevance to Our Domain
As we run agent workloads closer to the edge (and on heterogeneous GPU fleets), the framing "state protection is a scheduling decision, not an afterthought" is the transferable idea: checkpoint/protection actions should be optimized *jointly* with placement, using a model of node reliability. The world-model + MPC pattern is also a reference architecture for any agent orchestrator that must meet deadlines under failure.

## References
- Paper: https://arxiv.org/abs/2611.32520
