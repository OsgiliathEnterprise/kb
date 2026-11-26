---
title: Neural Memory Orchestration
diataxis: Explanation
domain: cloud-infrastructure
topic: storage-hardware
source: arXiv
source_url: https://arxiv.org/abs/2611.23857
date: 2026-11-22
keywords:
- knowledge-base
- storage-hardware
- cloud-infrastructure
- explanations
---
# Neural Memory Orchestration

## Overview

Modern HPC workloads increasingly **stall on the memory hierarchy rather than on compute**: page faults from mmap'd files, swap, and tiered memory are a growing fraction of wall time. *Neural Memory Orchestration* presents **Overseer**, the first end-to-end learned page-prefetching system deployed against **live workloads on real hardware** — prior learned prefetchers had only been demonstrated in simulation.

## Problem Statement

The kernel's heuristic prefetchers handle stride-like and temporally clustered access patterns well but **degrade sharply on the irregular, data-dependent access streams** typical of memory-intensive HPC workloads. Learned prefetchers can capture such patterns, but until now none had been taken through a deployed pipeline: collector, predictor, and enforcer running together on production hosts.

## Architecture: Three-Stage Pipeline

| Stage | Component | Role |
|-------|-----------|------|
| Observe | **eBPF collector** (on the target host) | Observes page faults as they happen |
| Predict | **OverNet** (transformer predictor on *network-attached* inference hardware) | Consumes fault sequences, emits future page addresses |
| Enforce | **Kernel-resident enforcer** (on the target) | Materializes predicted pages into the address space *before* they are demanded |

Key design choice: OverNet encodes fault sequences via **per-instance ordinal ranks over deltas** — relative, instance-normalized positions instead of raw addresses. This lets **a single trained model serve any target process without retraining**, which is what makes fleet deployment feasible.

## Results

On two page-fault-heavy workloads:
- **~35% runtime reduction** on Hilbert-curve traversal
- **~an order of magnitude** runtime reduction on dense matrix multiplication
- Corresponding reductions in major-fault counts

## Relevance to Our Domain

Page-fault stalls from mmap'd files and tiered memory are a live SLO problem for large-model serving and data-heavy pipelines. Overseer's pattern — eBPF observation, prediction offloaded to network-attached inference, kernel enforcement — is a deployable template for learned systems infrastructure, and the rank-over-deltas encoding shows how one model generalizes across processes.

## Context & Related Work

- **Prior learned prefetchers** (e.g., IPCP/Ship-based designs) were evaluated only in simulators; Overseer's claimed novelty is the full deployed pipeline — eBPF collector + remote OverNet inference + kernel enforcer — running against live workloads.
- On the enforcement side, **FetchBPF** (USENIX ATC 2024, https://tfjmp.org/publication/2024-atc/) showed that prefetching policies themselves can be made programmable via eBPF in Linux; Overseer's kernel-resident enforcer fits this lineage of eBPF-based, in-kernel extensibility, but swaps heuristics for a remote transformer predictor.
- Paper details: 10 pages, 9 figures; cs.DC/cs.LG/cs.OS; released under CC-BY 4.0 (https://arxiv.org/abs/2611.23857).

## References
- Paper: https://arxiv.org/abs/2611.23857 (cs.DC, cs.LG, cs.OS — Michael Zizov, Boris Morose, 2026-11-18)
- FetchBPF: Customizable Prefetching Policies in Linux with eBPF — https://tfjmp.org/publication/2024-atc/
- Related in vault: cloud-infrastructure/gpu-compute (HBM pressure), cloud-infrastructure/llm-serving (KV-cache tiering)
