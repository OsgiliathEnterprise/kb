---
title: 'Twindex: Index Cache Offloading with Coarse-to-Fine Selection for Long-Context
  Sparse-Attention Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.25078
date: 2026-11-21
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Twindex: Index Cache Offloading with Coarse-to-Fine Selection for Long-Context Sparse-Attention Serving

## Overview
Twindex tackles a second-order memory bottleneck in serving sparse-attention LLMs (Qwen3.8-Flash-Next, DeepSeek V4.1-Flash, GLM-5.2). Once systems offload the main KV cache to host memory, the *indexer cache* — the per-step scoring structure these models add — becomes the new HBM bottleneck. Twindex keeps only a compact learned copy of the indexer cache on the GPU and the full one in host RAM, using a two-stage coarse-to-fine selection.

## Problem Statement
In long-context decoding, HBM caps concurrent decoded requests. Sparse-attention models score *all* past index entries every step via an indexer cache, while attention reads main KV only for top-k entries. The paper measures the consequence of KV offloading: the indexer cache then occupies **63% of per-request HBM on Qwen and 75% on DeepSeek V4.1 at 1M tokens** — offloading the main KV simply moves the wall.

## Key Contribution
- **Compact HBM copy of the indexer cache**: the on-GPU copy is a shared component plus compressed residuals, both learned once offline — no model weights change, and it remains CUDA-graph compatible.
- **Coarse-to-fine selection**: each decoding step, the compact copy proposes a *larger candidate set*; the model's own indexer then re-scores the original rows of those candidates from host memory and picks the true top-k. Selection quality is preserved because the final ranking still comes from the real indexer.
- **Per-request indices + shared prefix KV**: every request keeps its own index entries while Qwen and GLM requests still share prefix main KV in host memory.

## Results (1M-token contexts, modern GPUs)
| Model | Request capacity vs KV-offload-only | Decode throughput (host-mem-unbound) |
|---|---|---|
| Qwen3.8-Flash-Next | 1.78× | 1.44× |
| DeepSeek V4.1-Flash | 1.62× | 1.25× |
| GLM-5.2 | 3.03× | 2.54× |

Quality: mean benchmark scores at most 3.1% below baseline in the authors' evaluations.

## Relevance to Our Domain
Extends the KB's KV-offloading line (TripleKV, Aggron) one layer deeper: when main-KV offloading matures, the *indexer cache* is the next capacity limiter for sparse-attention serving. The "cheap on-device proxy proposes, exact on-host model disposes" pattern is reusable for any learned index kept too large for HBM.

## Context & Related Work

Twindex sits on top of the mature main-KV-offloading stack; the surrounding ecosystem matters for when its gains materialize:

- **Mooncake** (arXiv:2407.00079) established the KVCache-centric disaggregated architecture (Moonshot/Kimi's serving platform); its transfer engine and paged DRAM pooling are the de-facto substrate Twindex assumes when it says "main KV already in host memory." TensorRT-LLM merged a native Mooncake Store connector (KVCMv2) in Oct 2026, so prefix-reuse pools across instances are now commodity — making the *indexer* cache, not main KV, the scarce HBM resident.
- **FlatCake** (arXiv:2610.38355) and the OSDI'26 zero-copy offloading work (USENIX OSDI'26, Luo et al.) attack the remaining staging-buffer overhead in HBM — complementary: they shrink the host↔device path, Twindex shrinks what must live on-device at all.
- **llm-d's KV offloader** shows the industry pattern of tiering KV to CPU DRAM/storage; Twindex's "compact on-device proxy proposes, exact on-host indexer disposes" is the same tiering philosophy applied to learned index structures.

**Design caveat:** the coarse-to-fine two-stage selection adds a host round-trip per decode step; Twindex's throughput wins hold only "when host memory does not limit the batch" — on bandwidth-constrained nodes the candidate re-scoring path can dominate, so benchmark before assuming the 1.44–2.54× numbers.

## References
- Paper: https://arxiv.org/abs/2611.25078 (v1, 2026-11-18, cs.DC, 25 pages)
- Mooncake: https://arxiv.org/abs/2407.00079 · https://kvcache-ai.github.io/Mooncake/
- FlatCake: https://arxiv.org/html/2610.38355
- llm-d KV-Cache offloading: https://llm-d.ai/docs/0.10/architecture/advanced/kv-management/kv-offloader
- Related: [[explanation-triplekv-kv-cache-management-ai-agents]], [[explanation-aggron-agentic-kv-cache-compression]]
