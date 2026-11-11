---
title: 'Google TPU Sync: Zero-Copy KV-Cache Movement Between Memory Tiers for LLM
  Serving'
diataxis: Explanation
domain: AI-LLM
topic: LLM-Infrastructure
source: TheNewStack
source_url: https://thenewstack.io/google-tpu-sync-inference/
date: 2026-11-11
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- explanations
---
# Google TPU Sync: Zero-Copy KV-Cache Movement Between Memory Tiers for LLM Serving

Alongside its eighth-generation TPU announcement (Nov 2026), Google open-sourced **TPU Sync**, a C++ framework that moves data between accelerator memory, host DRAM, storage, and the network. The target is the problem that grows with context windows: shuttling KV-cache and weights between memory tiers — the data movement that dominates **disaggregated serving** (separate prefill and decode workloads) and million-token-context / RL training loops.

## How it works

- **Zero-copy transfers** using native **PjRtBuffer hardware descriptors** instead of staging copies through host buffers.
- Unified API over the memory hierarchy: HBM ↔ host DRAM ↔ storage ↔ network.
- Shipped together with **TorchTPU** (native PyTorch on TPUs) and integrated with **vLLM and SGLang**, so existing serving stacks can run disaggregated workloads on TPU without a rebuild.

## The claimed numbers (with caveats)

- Combined host↔device throughput: **223 GB/s per Ironwood TPU host** — close to the 256 GB/s theoretical PCIe Gen5 limit.
- KV-cache transfer for **Qwen3-235B**: several seconds → **~230 ms**; average time-to-first-token (TTFT) **−60%** at low concurrency, **−90%** with a 480B-parameter model.
- Prefix caching at 64K-token contexts: TTFT **−90%**, throughput **+50%**, P99 inter-token latency **−30%**.

Caveats are load-bearing: results depend on workload mix, how much cached data is actually reusable, and available network bandwidth. SemiAnalysis notes external TPU serving previously simply *lacked* the infrastructure to split prefill/decode cleanly — part of the gain is catching up, not magic. Nvidia GB200/GB300 NVL72 still lead parts of the disaggregated-serving curve per InferenceX; no fully tuned TPU v7 comparison has been published.

## Production readiness

- APIs are **still changing** — Google recommends pinning a verified commit or tagged release.
- Supported only on **Cloud TPU v7x and v6e**, with specific JAX/PyTorch version requirements.

## Why it matters

KV-cache reuse is the lever behind most long-context serving economics (prefix caching in vLLM/SGLang, provider-side prompt caching). Until now, GPUs had mature KV-offload ecosystems while TPU serving moved caches through host copies. TPU Sync attacks the same bottleneck at the memory-system level — and, strategically, it lowers the switching cost away from CUDA by meeting developers inside vLLM/SGLang and PyTorch.

## Cross-links

- `explanation-prefixbench-h100-prefix-reuse-ttft.md` — the GPU-side counterpart: measuring prefix reuse and TTFT
- `explanation-janas-moe-ssd-streaming-llm-inference.md` — the same tiering idea at the storage edge (experts streamed from NVMe)
- `howto-tier-storage-for-ml-data-pipeline.md` — memory/storage tiering as a general design pattern
- `howto-exact-match-prompt-caching-single-flight.md` — the application-layer cache tier that sits above serving-layer KV reuse

## References

- The New Stack: *Google claims its new AI software cuts inference latency by over 90% — but there's a catch* — [thenewstack.io/google-tpu-sync-inference/](https://thenewstack.io/google-tpu-sync-inference/)
- TPU Sync repository: [github.com/google/tpu-sync](https://github.com/google/tpu-sync)
- Google announcement (TPU 8i Max / 8tx): [blog.google/innovation-and-ai/infrastructure-and-cloud/global-network/tpu-8i-max-and-8tx/](https://blog.google/innovation-and-ai/infrastructure-and-cloud/global-network/tpu-8i-max-and-8tx/)
- Introducing TPU Sync (Cloud blog, benchmarks): [cloud.google.com/blog/topics/ai-infrastructure/introducing-tpu-sync-fast-kv-cache-and-weight-transfer-on-tpu](https://cloud.google.com/blog/topics/ai-infrastructure/introducing-tpu-sync-fast-kv-cache-and-weight-transfer-on-tpu)
- TorchTPU open-sourced: [cloud.google.com/blog/topics/ai-infrastructure/torchtpu-is-now-open-source-run-native-pytorch-on-tpus](https://cloud.google.com/blog/topics/ai-infrastructure/torchtpu-is-now-open-source-run-native-pytorch-on-tpus)
- SGLang + TorchTPU: [lmsys.org/blog/2026-10-20-sglang-torchtpu](https://lmsys.org/blog/2026-10-20-sglang-torchtpu)
- SemiAnalysis InferenceX glossary entry: [inferencex.semianalysis.com/glossary/tpu-sync](https://inferencex.semianalysis.com/glossary/tpu-sync)
