---
title: 'IndexerStage: Staging Indexer-K across Memory Tiers for Sparse-Attention LLM
  Serving'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.28625
date: '2026-11-24'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# IndexerStage: Staging Indexer-K across Memory Tiers for Sparse-Attention LLM Serving

## Overview
Offloading attention data out of GPU HBM is not enough for long-context sparse-attention serving: the **Indexer-K** state used by DeepSeek Sparse Attention (DSA) to choose which tokens attention will read still pins GPU memory, because the indexer scans this growing state in full at every layer and every decode step. IndexerStage (arXiv:2611.28625, cs.DC) is a serving runtime that externalizes Indexer-K state to a backing memory tier while keeping the native GPU score, top-k, and attention kernels untouched.

## Key Insight
The full scan needs only the **current layer's** Indexer-K state at a given decode step — not simultaneous residency of all layers. That temporal locality makes per-layer staging viable: pull in the pages the current layer will scan, keep freshly appended entries local, push completed pages out.

## Architecture
- **Externalized Indexer-K** with native kernels preserved — no rewrite of score/top-k/attention GPU kernels.
- **Staged completed pages** flow through shared execution buffers; new entries stay resident locally.
- **Joint memory-and-transfer admission**: before accepting a growing batch, the runtime checks both storage capacity and each layer's transfer demand.
- **Tier split of control**: the backing tier gathers pages; the model-serving GPU controls transfer timing and byte budgets.
- **Implementation**: built into SGLang, evaluated on 16 model-serving + 16 backing H800 GPUs.

## Benchmark Results (from the paper)
- 16K–64K input context: local streaming storage footprint only **0.65–0.70 GiB per model-serving GPU**.
- vs HiSparse (host-memory-backed): batch size **+12.28–23.08%**, decode throughput **1.08–1.14×** TPS.
- 64K context, latent-KV backing path fixed: larger batch yields **1.10×** decode TPS; enabling streaming at batch size 24 costs +2.42% time-per-output-token.
- Mixed-length dynamic serving: mean generating batch **+12.07%**, **1.31×** decode TPS.

## Design Takeaways for LLM Serving Platforms
1. Sparse attention shifts the capacity bottleneck from attention KV to the indexer state — profile the indexer, not just the KV cache.
2. Layer-serial access patterns (only the current layer's state is scanned) make tiered offloading viable even for full-scan components.
3. Admission control must be joint over storage **and** per-layer transfer demand, or growing batches silently violate bandwidth budgets.
4. A dedicated backing tier (disaggregated GPUs here) beats host-memory offload on batch size, echoing scale-up memory-pool results (see XM-Sparse note).

## Relevance to Our Domain
Complements the KB's LLM Serving line on sparse-attention serving and memory tiering (XM-Sparse, KV offloading, Superfluid). Concrete numbers for planning DSA-based deployments (DeepSeek-style models) on disaggregated H800-class fleets.

## References
- Paper: https://arxiv.org/abs/2611.28625 (cs.DC, submitted 2026-11-21)
- PDF: https://arxiv.org/pdf/2611.28625
