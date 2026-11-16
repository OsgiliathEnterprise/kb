---
title: Superfluid — Local AI Server for Distributed LLM Inference
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.17753
date: 2026-11-16
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Superfluid: Local AI Server for Distributed LLM Inference

> Corrected 2026-11-16 by KB Zookeeper: the first intake version of this note described a different paper ("fine-grained multi-LLM sharing on a single A40", attributed to Jiang & Lu, CUHK-Shenzhen). That content did not match arXiv:2611.17753 and was replaced with facts verified against the arXiv abstract page.

## Overview

Superfluid (Prabod Rathnayaka, Isura Manchanayake, Srikandabala Kogul, Steve Siu, Fabian Waschkowski, Lukas Wesemann — BaseCompute; arXiv:2611.17753, submitted 13 Nov 2026, cs.DC) is an **open-source local-inference LLM server** designed for two scales at once: several agents sharing one locally served model alongside an interactive user on a single device, and a heterogeneous fleet of owned machines served through one API endpoint. Local serving keeps data private, removes per-token cost, cuts latency, and works offline; existing local servers serve one runtime on one machine, leaving multi-device owners' hardware idle.

## Problem Statement

On one device, agents sharing a model with an interactive user starve the user's requests. Across devices, every conventional local server (llama-server, Ollama, mlx_lm.server) is single-runtime and single-machine, so capable machines from different vendors sit idle most of the day.

## Key Technical Specifications

| Property | Detail |
|---|---|
| Backends | llama.cpp, MLX, or BaseRT driven in **isolated worker processes** |
| Scheduling | One scheduler prioritises interactive requests ahead of agent work |
| Prompt reuse | A prompt shared by many requests is computed once |
| Durability | Every token is written to a durable log before reaching the client |
| Fleet mode | One Superfluid server turns many machines into a single API endpoint |
| Heterogeneity | Machines with different hardware serve copies of the same model; work is assigned by measured speed |
| Elasticity | Machines can join or fail under load without losing a request |
| License | Apache-2.0, https://github.com/basecompute/superfluid |

## Results (Benchmark Data, from the abstract)

- **Qwen3.8-27B on Apple M5 Pro:** a chat sent while eight agents are working receives its first token in **1.5 s**, versus **291–612 s** on llama-server, Ollama, and mlx_lm.server.
- **Six machines, three chip vendors, 64 simulated users for one hour:** all **5,041 requests** answered while machines join one at a time and one is killed and rejoins; throughput grows **112 → 534 tok/s**, median first-token time falls **99 → 12 s**.
- **Twelve Mac Studio M3 Ultras:** sustains **10,656 tok/s** across **38,563 requests** from 384 agents without a failure.

## Relevance to Our Domain

A concrete reference point for on-prem/edge LLM operations: the interactive-vs-agent priority scheduler, shared-prompt prefill reuse, durable token log, and speed-weighted heterogeneous fleet routing are directly reusable design patterns for self-hosted inference platforms. Complements our fair-inference and batch-inference serving notes.

## References

- Paper: https://arxiv.org/abs/2611.17753
- Code: https://github.com/basecompute/superfluid
- Related: `explanation-fairinference-token-latency-fairness-llm-serving.md`
