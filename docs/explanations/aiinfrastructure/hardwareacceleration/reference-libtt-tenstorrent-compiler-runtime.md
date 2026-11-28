---
title: 'Libtt: A Compiler and Runtime for Tenstorrent Processors'
diataxis: Explanation
domain: ai-infrastructure
topic: hardware-acceleration
source: arXiv
source_url: https://arxiv.org/abs/2611.34273
date: '2026-11-28'
keywords:
- knowledge-base
- hardware-acceleration
- ai-infrastructure
- explanations
---
# Reference: Libtt — Tenstorrent Compiler and Runtime

## Overview
Moritz & Dong (arXiv:2611.34273, submitted 2026-11-25) present **Libtt**, a compiler and runtime that brings the **PyTorch and JAX ecosystems to Tenstorrent hardware**. Its strategic move: implement **PJRT** — the very interface XLA uses to drive Google TPUs — so the entire TPU software estate becomes a portability target for Tenstorrent silicon.

## Architecture Specification

| Component | Detail |
|---|---|
| Front-end interface | **PJRT** implementation (XLA→TPU driver interface) |
| JAX | runs **directly** on Libtt |
| PyTorch | runs **through TorchTPU** |
| TPU software portability | carries over **unchanged except custom kernels** |
| Foundation | Tenstorrent's open-source compiler and runtime |
| Packaging | entire stack — compiler through **multi-chip runtime** — as a **single shared library** |
| Contents | extensive upstream Tenstorrent software fixes (out-of-the-box PyTorch/JAX compat) + new compiler optimizations |

## Workload Coverage (demonstrated)

| Workload | Framework run on Libtt |
|---|---|
| LLM serving | **SGLang** |
| Fine-tuning | **TorchTitan** |
| Reinforcement learning | **Miles** |

Conformance: **passes most of the JAX and TorchTPU test suites**.

## When to Use
- Running existing JAX/PyTorch/TPU-targeted code on Tenstorrent without rewriting — the PJRT compatibility layer is the whole point.
- Reference architecture for teams writing their own PJRT backend for custom silicon: one shared library spanning compiler to multi-chip runtime.

## Relevance to Our Domain
Practical datapoint for accelerator-portable AI infrastructure beyond CUDA/TPU: a thin PJRT layer re-targeting the TPU software ecosystem changes the economics of evaluating alternative AI processors for serving/fine-tuning/RL fleets.

## Ecosystem Context: Libtt vs. Official Tenstorrent Stack (added 2026-11-28)
Tenstorrent's own path to the same PJRT strategy is **tt-xla** (Apache-2.0, ~2.9k commits), the official PJRT-device repo in the company's AI-compiler stack:
- tt-xla ingests JAX/PyTorch models via a **PJRT plugin** and lowers through **TT-MLIR** to Tenstorrent hardware.
- Thin framework wrappers: `jax_plugin_tt` (JAX) and `torch_plugin_tt` (PyTorch/XLA) import and configure the PJRT plugin.
- Ships a **vLLM integration** (`integrations/vllm_plugin`) plus mixed-precision tooling and a public model-bring-up guide; development runs partly through Tenstorrent's bounty program.

Read alongside Libtt: the PJRT-plugin pattern is now **the** consensus integration seam for alternative AI accelerators (official tt-xla for the supported path; Libtt as a research-grade single-shared-library reimplementation demonstrating full-stack portability of the TPU estate, incl. SGLang/TorchTitan/Miles workloads). When evaluating Tenstorrent silicon for serving/fine-tuning, start from tt-xla docs and treat Libtt as evidence of how far the TPU-software-portability bet extends.

## References
- Paper: https://arxiv.org/abs/2611.34273 (28 pages, 5 figures, 13 tables)
- Code: https://github.com/pcmoritz/libtt
- Official PJRT stack: https://github.com/tenstorrent/tt-xla
- TT-XLA getting started (jax_plugin_tt / torch_plugin_tt): https://docs.tenstorrent.com/tt-xla/getting_started.html
