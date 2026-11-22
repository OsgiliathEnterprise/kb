---
title: Locality-Aware Scheduling for Stream Processing Applications in Serverless
  Environments
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.23879
date: '2026-11-22'
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# LcSched: Locality-Aware Scheduling for Serverless Stream Processing

## Overview
LcSched is a **distributed scheduling strategy for stateful serverless (FaaS) stream-processing pipelines**. It resolves a locality conflict in state-of-the-art FaaS schedulers: the tension between keeping a function's *state* local and keeping *chained invocations* local. By maximizing local execution of chained calls while still giving every execution local access to its state — and rebalancing at runtime — it reports up to **3.6× throughput** and up to **79% lower end-to-end latency** versus the state-of-the-art distributed scheduler.

## Problem Statement
Stream applications on serverless platforms are pipelines of chained functions; many operators are **stateful**, and platforms place **state servers on worker nodes**, co-locating state with computation to cut access latency. Modern schedulers avoid centralized bottlenecks by using **worker-level distributed scheduling**: locally generated chained requests are routed straight to destination workers. But these approaches always co-locate *state and execution for the same operator on the same worker*, which forces most invocations of the **next** operator in the chain to cross worker boundaries — inflating network latency and I/O overhead.

## Key Contribution
- Identifies the **two-locality conflict** in stateful serverless chains: state locality (operator's own state on its worker) vs chain locality (successive chained invocations on the same worker) cannot both be trivially satisfied by the same co-location policy.
- **LcSched** schedules to **maximize local execution of chained function invocations** while ensuring each execution still accesses *its* state from the local worker — i.e. it separates "where the chain runs" from "where each operator's state lives" and optimizes both constraints jointly.
- Includes **runtime workload monitoring** to keep workers balanced as stream loads shift — locality optimizations that ignore balance collapse under skew.

## Results
Versus the state-of-the-art distributed scheduling strategy for stateful serverless: **throughput up to 3.6×**, **end-to-end latency reduced by up to 79%**.

## Relevance to Our Domain
Direct fit for our **Kubernetes/distributed-systems and serverless infrastructure** coverage: the state-locality vs chain-locality framing applies to any chained-invocation architecture (FaaS workflows, DAG executors, data pipelines on K8s). The takeaway — co-location policies must be *operator-aware* and paired with runtime rebalancing — is a reusable design lesson for pipeline schedulers.

## Corroboration (verified 2026-11-22 vs primary record)
All load-bearing claims verified verbatim against the arXiv abstract page: title, authors, submission date (18 Nov 2026, cs.DC), the state-server co-location design, the worker-level distributed-scheduling problem framing, the "maximise local execution of chained function invocations while ensuring each execution accesses its state from the local worker" objective, runtime workload monitoring, and both headline numbers (up to **3.6× throughput**, up to **79%** lower end-to-end latency vs the state-of-the-art distributed scheduler for stateful serverless).
- The paper's own HTML title ("LcSched: Locality-Aware Distributed Scheduling for Stream Processing in Stateful Serverless Environments") confirms the LcSched name used here.
- Research-lineage context: the same Melbourne (Buyya group) line produced **ScalaSSC** (Scalable Stateful Serverless Computing for Stream Processing), which co-locates requests with the state they act upon to avoid cross-worker state access — LcSched reads as the successor that additionally optimizes chain locality and runtime balance.

## References
- Paper: https://arxiv.org/abs/2611.23879 (arXiv:2611.23879, submitted 2026-11-18; cs.DC)
- Authors: Tianyu Qi, Maria A. Rodriguez, Rajkumar Buyya
- Related prior work (same group): ScalaSSC — Scalable Stateful Serverless Computing for Stream Processing, https://jarrett.cis.unimelb.edu.au/papers/ScalaSSC2025.pdf
