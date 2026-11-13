---
title: MegaOps — Tile-Level Dependency Enforcement for Kernel Overlapping with Megakernel
  Performance
diataxis: How-to Guide
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.16248
date: 2026-11-13
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- how-to
---
# MegaOps: How to Get Megakernel Performance while Keeping Kernel-per-Operator Modularity

## Overview

The kernel-per-operator paradigm (one GPU kernel per ML operator) is modular but slams a barrier between every dependent kernel: SMs idle at the boundary, computation and communication serialize, and a kernel can't prefetch weights while its producer still runs. **Megakernels** fuse a whole layer or model into one kernel to remove those barriers — at the cost of all modularity. Lin, Oh & Singh's key insight: **you don't have to fuse kernels to remove kernel barriers**. MegaOps launches dependent kernels on separate CUDA streams and enforces dependencies at the granularity of *individual tiles of the intermediate tensor*, matching hand-tuned ThunderKittens megakernels in throughput while reusing off-the-shelf Triton, cuBLAS, and cuDNN kernels.

## Procedure (How the Technique Works)

1. **Launch dependent kernels on separate CUDA streams** instead of serializing them in one stream.
2. **Define the producer/consumer contract on the intermediate tensor's tiles.** The producer writes tiles; the consumer reads them; each dependency is enforced per-tile rather than kernel-to-kernel.
3. **Synchronize on data tiles, not on thread blocks.** Consumers wait only for the specific tiles they need — the rest of the producer's work can still be running. This keeps SMs busy across the old kernel boundary and overlaps computation with communication.
4. **Adopt a shared data-tiling convention.** Any two kernels that adopt the same data tiling compose with zero modification to either kernel — modularity is preserved exactly as in PyTorch-style frameworks.
5. **Reuse existing kernels** (Triton, cuBLAS, cuDNN) rather than hand-fusing; add weight prefetching under the overlap where the preceding kernel is still executing.

## Key Contribution

- Demonstrates kernel-per-operator frameworks can reach megakernel performance *without fusion*: barrier removal is about dependency granularity, not kernel count.
- Tile-level dependency enforcement as a composable, framework-level primitive.
- Validated end-to-end on dense **Llama3 and Qwen3** models: single H100, A100, L40 GPUs and multi-GPU (4×A100, 8×H100) servers.

## Results

| Comparison | Outcome |
|---|---|
| vs. hand-tuned ThunderKittens megakernels | throughput parity |
| Decode throughput vs. best baseline | **1.09×–1.10×** |
| Prefill throughput vs. best baseline | **0.98×–1.10×** |
| Kernel engineering effort | reuses existing Triton/cuBLAS/cuDNN kernels |

## Relevance to Our Domain

LLM serving infrastructure is a core KB topic. MegaOps suggests serving stacks don't need to bet on monolithic megakernel rewrites to eliminate launch/bubble overheads: a tile-convention layer over standard kernels recovers most of the gain while keeping the profiling, composition, and maintenance ergonomics of kernel-per-operator. Pair with the PACER note — removing kernel barriers changes the kernel-time distribution that drives GPU power excursions, so overlap and power management interact.

## References

- Paper: https://arxiv.org/abs/2611.16248
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16248
- ThunderKittens (megakernel baseline): https://github.com/HazyResearch/ThunderKittens
- Perseus — same group's follow-up on multi-node megakernels (tile-granularity overlap hits hidden RDMA fence serialization beyond one node; up to 10.3× on proxy-based transports): https://arxiv.org/abs/2605.00686
- Related notes: `explanations/cloudinfrastructure/gpucompute/` (PACER, CUDA locality domains)
