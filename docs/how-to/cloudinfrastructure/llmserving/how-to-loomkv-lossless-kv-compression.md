---
title: 'LoomKV: Lossless KV Cache Compression from GPU Memory to SSD for LLM Serving'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.32954
date: '2026-11-25'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# LoomKV: Lossless KV Cache Compression from GPU Memory to SSD for LLM Serving

## Overview
LoomKV applies **lossless** (bit-exact) compression to the KV cache in two places at once — the external DRAM/SSD offload tiers and the GPU KV pool itself — on an unmodified serving engine. Because it never alters KV values, it sidesteps the accuracy risk that plagues lossy KV compression, while making tiers act ~1.4× larger and letting the GPU pool hold ~1.3× more tokens.

## When to Use This
You run vLLM/LMCache-style serving with multi-turn or agent traffic that reuses prompt prefixes, and either (a) your DRAM/SSD prefix tier evicts before reuse, or (b) the GPU KV pool caps concurrent long requests. Lossy KV compression is unacceptable (numerical accuracy guarantees required).

## Procedure
1. **Encode KV with a calibrated per-head code.** Use a two-level 3-bit code over the BF16 high byte (sign + upper seven exponent bits). Measured footprint: BF16 KV at 0.71× raw size (stable across nine models); FP8 KV at 0.85–0.87×.
2. **Tier mode (DRAM/SSD offload).** Store exact-length compressed records with TileStream: the record length is read back off the load path, so the existing tier storage, eviction and prefetch machinery stays unchanged. On a tier hit, decompress fetched records directly into scattered GPU pages.
3. **Pool mode (GPU KV pool).** Use FragPack to pack variable-length compressed records into smaller shared-budget GPU pages, read in place by a fused decode-attention kernel — faster than FlashAttention-3 on BF16, matching its numerical accuracy.
4. **Integrate on an unmodified engine.** LoomKV is built with LMCache and vLLM; both modes operate without engine changes.
5. **Validate your regime.** If raw capacity already suffices, expect a throughput tax of at most 2.2%; confirm tier mode output is bit-exact vs. raw.

## Expected Results
| Scenario | Outcome |
|---|---|
| AgentX, compressed tiers | tiers act as 1.4× larger raw tiers; 2.7–3.6× raw goodput across LMCache's LRU cliff; 1.9–3.1× lower mean TTFT |
| Repeated prompts | up to 1.7× lower TTFT via SSD→DRAM promotion |
| Tier-holds-working-set | pool mode fits 1.31–1.34× more GPU tokens; admits 12 long requests at ~raw's queue/goodput |
| AI IDE trace (tiers + GPU pool both constrained) | goodput +1.24× (tier mode), +1.59× (pool mode) |
| Sufficient raw capacity | ≤2.2% throughput cost; tier mode bit-exact |

## Gotchas
- The goodput wins concentrate around the **LRU cliff** of LMCache — if your working set already fits raw DRAM, compression mostly buys insurance, not speed.
- Pool mode's win depends on the fused decode-attention kernel reading packed pages in place; adopting FragPack means adopting that kernel, not just a storage codec.
- Replacement-policy sensitivity is neutral: the LRU cliff shifts identically under other simulated policies.

## Relevance to Our Domain
Prefix caching for agent workloads is one of our highest-leverage serving levers (cf. KVCompass, Stint, Callo notes). LoomKV is the first practical *lossless* tier+pool codec, which matters for regulated or accuracy-sensitive deployments where lossy KV quantization is a non-starter. The 0.71× BF16 ratio via sign+exponent entropy alone is a strong reminder that KV bytes are far more compressible than assumed.

## References
- Paper: https://arxiv.org/abs/2611.32954
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32954
- Related in KB: reference-stint-productive-preemption-long-output.md, explanation-callo-invalidated-kv-speculative-decoding.md
