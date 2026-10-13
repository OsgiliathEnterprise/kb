---
title: 'Janas: Running LLMs Larger Than RAM by Streaming MoE Experts from NVMe SSD'
diataxis: Explanation
domain: AI-LLM
topic: LLM-Infrastructure
source: HackerNews
source_url: https://github.com/prabanta-dev/janas
date: 2026-10-13
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- explanations
---
# Janas: Running LLMs Larger Than RAM by Streaming MoE Experts from NVMe SSD

## Overview

[Janas](https://github.com/prabanta-dev/janas) is a family of AI tools written in pure C with no dependencies beyond the C library, whose first component (Janas-LLM) runs large **mixture-of-experts (MoE)** language models on ordinary computers — with or without a GPU. The headline result: **37 tok/s from Qwen3-Next-80B (a 48.4 GB model) on a laptop with 32 GB of RAM**, where llama.cpp manages 2.8 tok/s; reading a 1,024-token prompt at 62 tok/s vs 16. On the same laptop, Janas was faster than llama.cpp on every one of the 13 models compared (Q4_K_M, measured 9–11 October 2026).

The mechanism: **weights stay on disk; the experts each token needs are streamed from an NVMe SSD, and the ones that keep coming back stay in memory.** This turns the SSD into a weight tier, making "model bigger than RAM" a normal operating mode rather than an exception.

## Core Mechanism

1. **Expert streaming from NVMe.** MoE models activate only a small subset of experts per token. Janas reads the needed experts from the model file at full speed with `O_DIRECT`, bypassing the page cache for bulk reads.
2. **Hot-expert cache in RAM.** The engine fills its expert cache with the free memory available when the model is opened; frequently-accessed experts stay in RAM, the rest are read from disk on demand.
3. **Adaptive engine configuration.** Everything the engine does (thread counts, pass placement, cache sizing) is chosen from what it *measures* on the machine — the first passes try every core, one thread per performance core, and the performance cores' threads, keeping the fastest. This part is designed to travel to other hardware.
4. **CPU or GPU.** Runs on CPU (AVX2, FMA, F16C, AVX-VNNI) or on an integrated GPU via Vulkan (e.g. Intel Arc through Mesa drivers). `JANAS_GPU=0` disables the GPU entirely; `--cache <GiB>` hard-limits memory.
5. **Speculative decoding via draft blocks.** The Qwen3.5/Qwen3.6 and Qwen3-Next models carry their own prediction block, and Gemma 4 ships a small drafting model; Janas uses these as drafts (`--mtp`), which the main model checks. Draft survival is text-dependent: 74–89% on Qwen/Gemma-4 large models in English, 63–72% on Gemma E2B/E4B, ~33% on Italian prose (where it gains little).

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Model file (.jns) on NVMe SSD\n48.4 GB weights (Qwen3-Next-80B)\nread at full speed via O_DIRECT", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 340,
      "y": 160,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Hot-expert cache (RAM)\n~19 GB on the 32 GB test laptop\nfrequently-accessed experts stay resident", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 640,
      "y": 160,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Per-token expert selection\nstream needed experts\nCPU AVX2/F16C/AVX-VNNI\n+ integrated GPU via Vulkan", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 640,
      "y": 320,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#b8e6b8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Speculative drafts (--mtp)\nmodel's own prediction block\ndrafts 74-89% survival in English", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 280,
        "y": 210,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 580,
        "y": 210,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 760,
        "y": 260,
        "width": 0,
        "height": 60,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [0, 60] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Benchmarks (test machine)

Developed and measured on one machine: Debian 13 (kernel 6.12), Intel Core Ultra 9 185H (6P+8E+2 low-power cores; AVX2/FMA/F16C/AVX-VNNI; integrated Arc GPU), 32 GB DDR5, 1 TB NVMe (~5.7 GB/s read), Mesa 26.1.6 Vulkan, GCC 14.2.

| Model | Reading 1,024 tok: Janas | llama.cpp | Writing: Janas | llama.cpp |
| --- | --- | --- | --- | --- |
| Qwen3-Next-80B-A3B (48.4 GB, > RAM) | 62 tok/s | 16 tok/s | 24 tok/s | 2.8 tok/s |
| Qwen3-Coder-Next (48.4 GB, > RAM) | 66 tok/s | 14 tok/s | 22 tok/s | 2.2 tok/s |
| Qwen3.6-35B-A3B | 104 tok/s | 79 tok/s | 19 tok/s | 12 tok/s |
| Qwen3-30B-A3B | 135 tok/s | 122 tok/s | 32 tok/s | 15 tok/s |
| Gemma-4-26B-A4B-it | 84 tok/s | 76 tok/s | 18 tok/s | 12 tok/s |
| Qwen3.5-0.8B | 799 tok/s | 519 tok/s | 109 tok/s | 32 tok/s |
| Qwen3-0.6B | 939 tok/s | 670 tok/s | 130 tok/s | 45 tok/s |

One exception: a 3-bit Qwen3-30B (unsloth UD-Q3_K_XL) reads prompts *slower* than llama.cpp because Q3_K weights don't go to the GPU's fast prompt path — but writes three times as fast.

**How the llama.cpp baseline was run matters.** llama.cpp's usual build ran out of memory on the 48 GB model as soon as the GPU took part (its CPU backend repacks weights into its own memory; the Vulkan backend copies CPU-left weights into unreclaimable buffers). The reported llama.cpp figures come from a build with `GGML_CPU_REPACK=OFF` plus `--no-host 1 -lm mmap`, which leaves experts in the file, read through the page cache — 16 tok/s reading with GPU, 2.8 tok/s writing on CPU alone. Janas ran the same model with no special option: ~19 GB expert cache plus disk for the rest.

**Windows parity.** On the same laptop under Windows 11 (Intel's own graphics driver), Janas wrote as fast as on Linux (Qwen3-4B 25.6 tok/s, Qwen3-30B-A3B 34.2) and read prompts 1.8× faster with dense models whose whole blocks go to the GPU.

## Ecosystem and Interfaces

- **Model format:** `.jns` files (format version 2), converted from Hugging Face weights via `janas-get` or from GGUF files; the format is stable across Janas versions. Converted files keep the model's own license.
- **Serving:** `janas-server` exposes an OpenAI-compatible `/v1/completions` API plus a browser chat page; `janas-mcp` serves the model as tools for MCP clients (Claude Code, editors). Code completion follows OpenAI's `suffix` completions and llama.cpp's `/infill` (compatible with llama.vscode/Continue); a fixed window at the cursor keeps keystroke reads to ~1.5–2.2 s instead of 17 s.
- **Benchmarking:** `janas-bench` measures the local machine (mean of three rounds, alternating order so warm-up and cache fill weigh on each setting alike) and produces a report — the project asks for reports from hardware it doesn't own.
- **Dependencies:** only libmicrohttpd 1.0.10 and yyjson 0.13.0 for the HTTP/MCP components; `libjanas_llm` itself has none. Mbed TLS 4.2.0 for HTTPS MCP servers. GPL-3.0.
- **Caveats (stated by the author):** experimental, not a product; developed on one machine; the engine fills free memory with its cache and reads at full speed — on a machine with little headroom it can push the desktop into swap; a GPU driver reset once took down the desktop. It degrades gracefully: with a browser and editor open, the 80B model kept ~75% of its speed.

## Why This Matters

SSD-based expert streaming is becoming a viable alternative to GPU-only inference for MoE models. The key insight is architectural: MoE's sparse activation pattern is *exactly* what makes disk-resident weights tolerable — you never need all experts in RAM, only the hot ones. Janas demonstrates this on consumer hardware (integrated GPU + 32 GB) with a 48 GB model, at speeds that embarrass the standard tool's out-of-the-box behavior. The comparison also documents a real llama.cpp gap: its memory-repacking defaults make large MoE models on integrated GPUs OOM, and the mmap-escape-hatch path is significantly slower than a purpose-built streaming engine.

## Open Questions

- **Generalizability.** All measurements are one machine. The adaptive-configuration layer is designed to travel, but AMD CPUs (no AVX-VNNI path tested), discrete GPUs, and slower disks are untested.
- **Cache sizing policy.** Filling "the free memory available when the model is opened" is a blunt instrument; a policy that coexists predictably with other workloads (or per-model cache profiles) would matter for desktop use.
- **Draft quality vs text domain.** Draft survival collapsing to ~33% on Italian prose means speculative gains are language/content-dependent; measuring acceptance rates per domain is the natural next benchmark.

## References

- [Janas — GitHub repository (prabanta-dev/janas)](https://github.com/prabanta-dev/janas)
- [Janas-LLM feature matrix by model and feature (docs/features.md)](https://github.com/prabanta-dev/janas/blob/main/docs/features.md)
- [Janas hardware measurement guide (docs/hardware.md)](https://github.com/prabanta-dev/janas/blob/main/docs/hardware.md)
- [Janas chat, drafts, and MCP services (docs/chat.md)](https://github.com/prabanta-dev/janas/blob/main/docs/chat.md)
- [Janas serving: MCP server and OpenAI-compatible HTTP (docs/serving.md)](https://github.com/prabanta-dev/janas/blob/main/docs/serving.md)
- [Janas model conversion and licensing (MODELS.md)](https://github.com/prabanta-dev/janas/blob/main/MODELS.md)
- [Pre-converted .jns models on Hugging Face (prabanta-dev)](https://huggingface.co/prabanta-dev)
- [llama.cpp (ggml-org) — the compared baseline engine](https://github.com/ggml-org/llama.cpp)
- [Janas streams MoE experts from SSD to run 80B models on a 32 GB laptop — deniz.in (independent write-up)](https://deniz.in/janas-streams-moe-experts-from-ssd-to-run-80b-models-on-a-32-gb-laptop) — hardware context (Debian 13, Core Ultra 9 185H + Arc iGPU, 32 GB DDR5, ~5.7 GB/s NVMe), per-model numbers, maturity caveats ("an experiment, not a product", O_DIRECT swap pressure, GPU driver-reset risk) and escape hatches (Ctrl-C, `--cache`, `JANAS_GPU=0`)
- [Running MoE LLMs larger than RAM: a llama.cpp guide to expert offloading and SSD streaming — deniz.in](https://deniz.in/running-moe-llms-larger-than-ram-a-llama-cpp-guide-to-expert-offloading-and-ssd) — the baseline-side counterpart: making llama.cpp itself stream experts
