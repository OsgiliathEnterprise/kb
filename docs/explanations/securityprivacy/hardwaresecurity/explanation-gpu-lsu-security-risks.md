---
title: Dissecting the GPU Load/Store Unit and Exposing Its Security Risks
diataxis: Explanation
domain: security-privacy
topic: hardware-security
source: arXiv
source_url: https://arxiv.org/abs/2611.23022
date: '2026-11-18'
keywords:
- knowledge-base
- hardware-security
- security-privacy
- explanations
---
# Dissecting the GPU Load/Store Unit and Exposing Its Security Risks

## Overview
Han and Talbot (Wenbo Han, Pierre Talbot; arXiv:2611.23022, cs.AR/cs.CR, submitted 2026-11-17, DOI 10.48550/arXiv.2611.23022) reverse-engineer the **Load/Store Unit (LSU)** — the hardware component processing all global-memory and shared-memory accesses — of recent NVIDIA GPUs using carefully designed microbenchmarks. They derive **cycle-accurate latency formulations** for global (L1-hit) and shared-memory accesses and show the LSU is a much larger attack surface than previously recognized. Their framing: until each LSU mechanism is *measured*, neither its security risk nor a defense is known — prior work knew "only a few isolated mechanisms and parameters, and even a single one has been enough for an attack."

## Problem Statement
Prior GPU microarchitecture studies probed only **parts** of the LSU, and prior side-channel/DoS work exploited only some of the resources it manages — leaving the LSU's exploitable resources largely unexplored.

## Technical Approach
- **Microbenchmarks** expose **address-dependent latency terms**: bank conflicts and L1 tag lookups, for both global and shared memory, plus contention arising from both sites.
- Novel finding: when the LSU pipeline is full, **a warp can starve a warp of a later-launched block** — a scheduling pathology with security consequences.

## Results
- **Information leakage**: an AES-128 key is recoverable using **only** global-memory bank-conflict or L1-tag-lookup leakage (under the threat model of the prior GPU AES timing attack) — showing LSU access timing alone can leak keys.
- **Cross-process covert channels** via **MPS co-execution**, available separately through bank accesses and tag lookups, with **rates increasing across GPU generations**.
- **Cross-tenant DoS/starvation**: LSU contention slows a co-located **cuBLAS matrix multiplication by up to 750× on A100 and 563× on H100**.

## Context & Related Work
- **Bank-conflict side channels are established prior art**: an ACM survey of bank-conflict-based GPU timing leakage (doi 10.1145/3361870) covers Kepler-era shared-memory/L1 bank attacks — this paper's novelty is showing LSU channels *beyond* bank conflicts (tag lookups, pipeline starvation) and quantifying them cycle-accurately. Per the paper, an `bf`-way bank conflict adds `2(bf − 1)` extra cycles via serialization. https://dl.acm.org/doi/fullHtml/10.1145/3361870
- **Same threat class at the serving layer**: "Governing the KV Cache" (arXiv:2608.09225) shows shared KV/prefix caches in multi-tenant LLM serving leak private prompts via cache-hit latency (cold TTFT 149.6 ms vs cached 32.8 ms on A100) — an attack surface *above* the LSU; together they bound the isolation problem at two stack levels. https://arxiv.org/abs/2608.09225
- **Mitigation direction**: NVIDIA is pushing memory-enforced GPU sharing on Kubernetes via CUDA MPS supervision with per-workload limits (GPU Operator), a step toward containment but not timing isolation — MIG or dedicated allocation remain the stronger controls against LSU contention. https://developer.nvidia.com/blog/memory-enforced-gpu-sharing-in-kubernetes-with-nvidia-cuda-13-4/

## Relevance to Our Domain
Multi-tenant GPU serving (shared A100/H100 pools for LLM inference) is our deployment model; this quantifies a **concrete cross-tenant risk class** beyond memory-capacity attacks: timing side channels and extreme matmul degradation via LSU contention. Relevant to GPU-fleet isolation policy (MPS vs MIG vs dedicated allocation) and to threat models for shared accelerator infrastructure.

## References
- Paper: https://arxiv.org/abs/2611.23022
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23022
