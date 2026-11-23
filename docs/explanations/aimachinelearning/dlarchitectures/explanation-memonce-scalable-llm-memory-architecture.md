---
title: 'MemOnce: A Scalable Memory Architecture for Large Language Models'
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.27973
date: 2026-11-23
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# MemOnce: A Scalable Memory Architecture for Large Language Models

## Overview
MemOnce is a foundation architecture for LLMs that maintains **learned, reusable memory states** instead of either a growing token-level KV cache (Transformers: linear memory growth, quadratic compute as context expands) or a fixed-size compressed state (linear-time architectures: poor fine-grained recall). It caches only a small subset of **final-layer hidden states** and dynamically decodes them back into KV caches on demand, achieving linear-time complexity while retaining detail.

## Problem Statement
Long-horizon and continual interaction requires memory that survives across inferences. Transformers pay for fidelity with unbounded KV-cache growth and quadratic attention; linear-time models cap memory by compressing history into fixed states and lose fine-grained detail. Existing architectures offer no middle ground that is both cheap and detail-preserving.

## Key Contribution
- **Memory encoder-decoder**: cache only a small subset of final-layer hidden states as compact memory representations; dynamically decode them back into KV caches for the attention layers when needed.
- **Memory sparse attention**: for each continual input, adaptively retrieve the relevant memory representations, with the **sparse indices computed only once across all layers** (not per layer).
- Coupling the two designs allows on-the-fly memory loading and KV-cache decoding with a drastically reduced GPU memory footprint and linear-time complexity.
- Broad evaluation across model sizes, context lengths, and training paradigms (pretraining and post-training adaptation), plus zero-shot generalization to downstream representation tasks.

## Technical Approach
Rather than storing per-token, per-layer K/V tensors, MemOnce stores compact final-layer hidden-state memories. At inference, relevant memories are selected via sparse attention whose indices are shared across layers, then decoded into the per-layer KV caches attention actually consumes. This decouples what is *stored* (small, learned) from what attention *sees* (reconstructed on the fly), giving Transformer-level fidelity at linear-architecture cost.

## Results (paper-reported)
Adapting **Qwen3.5-4B** with MemOnce: memory-state cache reduced **1313×**, prefill latency reduced **6.9×** at 1M context, throughput up **3.5×**, overall memory performance **+5.77%**; outperforms Transformers and other architectures across sizes/lengths/paradigms, and is competitive with specialized models on downstream representation tasks zero-shot.

## Relevance to Our Domain
KV-cache memory is the binding constraint in self-hosted long-context serving; a decode-on-demand memory architecture changes capacity planning and pairs naturally with serving-side cache management (compare paged-attention systems already covered in the KB).

## See Also
- [[Who Grades the Agent? Privilege Separation for Coding-Agent Benchmarks]] (reference)
- [[Speculative Decoding Is Less Speculative Than You Think]] (explanation)

## References
- Paper: https://arxiv.org/abs/2611.27973
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27973
