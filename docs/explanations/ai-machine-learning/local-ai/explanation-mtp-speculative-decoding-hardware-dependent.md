---
title: 'MTP Speculative Decoding Is Hardware-Dependent: 1.95x on RTX 3090, 0.87x on
  M1 Max'
diataxis: Explanation
domain: AI & Machine Learning
topic: Local AI
source: DEV.to Tech News
source_url: https://dev.to/sysoft/mtp-isnt-always-a-win-195x-on-my-3090-but-speculative-decoding-is-hardware-dependent-2d5b
date: 2026-08-21
keywords:
- knowledge-base
- Local AI
- AI & Machine Learning
- explanations
---
# MTP Speculative Decoding Is Hardware-Dependent: 1.95x on RTX 3090, 0.87x on M1 Max

## Overview

A follow-up to an earlier MTP (Multi-Token Prediction) post that showed ~2x generation speedup for Qwen3.6-27B on an RTX 3090. This time the author measured the same technique on a different model — **Gemma 4 12B QAT** (`UD-Q4_K_XL`) with an MTP draft head (`Q8_0-MTP`, a 0.47 GB `nextn` head, not a full second model) — and found a big win on the 3090 but a **loss on Apple Silicon**. Core lesson: **MTP is not a free switch; it is a hardware-dependent lever.** Its speedup is a function of the draft-cost-to-verify-cost ratio on *your specific hardware*, not a property of the technique.

## 3090 Numbers

Gemma 4 12B QAT + MTP draft head, single RTX 3090, decode tok/s, 3 runs each:

| config | mean tok/s | speedup | draft acceptance |
| --- | --- | --- | --- |
| baseline (no MTP) | 85.9 | 1.00x | — |
| MTP `n-max 2` | 159.4 | **1.86x** | 0.77 |
| MTP `n-max 3` | 167.4 | **1.95x** | 0.69 |

Notable properties:

- Unusually **stable** results — run-to-run CV under 0.5% (earlier Qwen3.6-27B MTP runs were far noisier at 5–7%, needing a dozen runs; Gemma settled in three).
- Same `n-max 3` sweet spot as Qwen, and the same counterintuitive shape: deeper speculation has *lower* per-token acceptance (0.69 vs 0.77) but *higher* throughput, because more tokens land per verify step.
- Per-category, the win ranged 1.8x–2.2x (RAG and coding best at ~2.2x).
- The whole setup fit in ~8 GB VRAM.

## The Same Model, Slower on an M1 Max

A cross-hardware benchmark (another tester's runs, same `speed_bench.py` harness and `--jinja` settings, so comparable):

| hardware | MTP speedup (n-max 2) |
| --- | --- |
| **RTX 3090** (author) | **1.86x** |
| RTX 5070 Ti laptop | 1.74x |
| M1 Max (16", 64 GB) | **0.87x — slower** |

Same model, same MTP draft, and the M1 Max **loses ~13%** by turning MTP on.

## Why MTP Can Make You Slower

Speculative decoding wins when **verifying** a batch of drafted tokens is cheap relative to generating them one at a time: the draft head proposes several tokens, the main model checks them in one parallel pass, and accepted drafts give you multiple tokens for about the cost of one verify. That only pays off when there is spare compute and the verify pass is cheap:

- **Capable CUDA GPU (3090, 5070 Ti):** lots of compute headroom, parallel verify is cheap, drafts land → 1.7–1.9x.
- **Apple Silicon (M1 Max), unified memory:** running the draft adds compute the architecture doesn't have to spare relative to its memory bandwidth, and that overhead outweighs the parallel-verify gain. Net: slower than just decoding normally.

So "speculative decoding makes you faster" is a **hardware claim, not a universal one**. On Apple Silicon it can be pure overhead — measure first.

## Honest Caveats

- Only the 3090 numbers are the author's; the M1 Max / 5070 Ti figures are another tester's runs. Same harness and settings make the comparison fair, but it isn't a single controlled rig — read the cross-machine table as directional.
- Gemma 4 12B `it` runs as a *thinking* model under `--jinja` (output routes to a reasoning channel); this doesn't affect decode tok/s, which comes from the server's own token timings, and all machines used the same `--jinja`.
- MTP throughput can vary run to run: the 3090 numbers were stable (CV &lt; 0.5%), but the M1 Max's 0.87x is close enough to 1.0 to be worth re-running before treating it as exact — the *direction* (a net loss) is the point.

## Reproduce It (3090)

```bash
# llama.cpp mainline, commit e3471b3 (accepts the Gemma MTP draft - no special build), CUDA sm86
# Models from unsloth/gemma-4-12B-it-qat-GGUF:
#   main:  gemma-4-12B-it-qat-UD-Q4_K_XL.gguf
#   draft: gemma-4-12B-it-Q8_0-MTP.gguf

llama-server -m <main> \
  --model-draft <draft> \
  --spec-type draft-mtp \
  --spec-draft-n-max 3 \
  -np 1 -ub 512 -c 16384 -ngl 99 -fa on --jinja

# Benchmark:
speed_bench.py --bench qualitative --category all --osl 1024 --concurrency 1
# Compare runs:
speed_bench_compare.py
```

## Key Takeaways

1. **MTP is one of the best generation-speed levers on a capable CUDA GPU** — ~1.9x here on a 3090, with quality preserved (the verify pass keeps output exact).
2. **Deeper speculation (`n-max 3`) can beat shallower (`n-max 2`) even with lower per-token acceptance**, because more tokens land per verify step.
3. **On Apple Silicon, draft-head overhead can outweigh verify gains** — a net ~13% slowdown measured on M1 Max. Measure on your own box before committing to speculative decoding.
4. The deciding variable is the **draft-cost-to-verify-cost ratio on specific hardware**: compute headroom (CUDA) vs memory-bandwidth-bound (unified-memory Apple Silicon).

## Cross-Hardware Trade-off Diagram (Excalidraw)

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "title",
      "type": "rectangle",
      "x": 140, "y": 30,
      "width": 360, "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MTP speedup = f(draft cost / verify cost)", "fontSize": 16, "fontFamily": 1 }
    },
    {
      "id": "cuda-gpu",
      "type": "rectangle",
      "x": 60, "y": 120,
      "width": 240, "height": 120,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Capable CUDA GPU (3090)\ncompute headroom, cheap parallel verify\ndrafts land -> 1.7-1.9x win\n3090: 1.86x | 5070 Ti: 1.74x",
        "fontSize": 14, "fontFamily": 1
      }
    },
    {
      "id": "apple-silicon",
      "type": "rectangle",
      "x": 400, "y": 120,
      "width": 240, "height": 120,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Apple Silicon (M1 Max)\nunified memory, bandwidth-bound\ndraft overhead > verify gain\n0.87x -> ~13% SLOWER",
        "fontSize": 14, "fontFamily": 1
      }
    },
    {
      "id": "decision",
      "type": "rectangle",
      "x": 180, "y": 300,
      "width": 320, "height": 80,
      "strokeColor": "#bf8401",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "roundness": { "type": 3 },
      "text": {
        "content": "Decision: measure on YOUR hardware\nsame model + same draft head\n3090: +95% | M1 Max: -13%",
        "fontSize": 14, "fontFamily": 1
      }
    },
    {
      "id": "arrow-cuda-decision",
      "type": "arrow",
      "x": 180, "y": 240,
      "width": 0, "height": 60,
      "strokeColor": "#30665c",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 60]]
    },
    {
      "id": "arrow-mac-decision",
      "type": "arrow",
      "x": 520, "y": 240,
      "width": 0, "height": 60,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 60]]
    },
    {
      "id": "arrow-title-cuda",
      "type": "arrow",
      "x": 220, "y": 70,
      "width": 0, "height": 50,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 50]]
    },
    {
      "id": "arrow-title-mac",
      "type": "arrow",
      "x": 440, "y": 70,
      "width": 0, "height": 50,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 50]]
    }
  ]
}
```

## References

- [MTP Isn't Always a Win: 1.95x on My 3090, but Speculative Decoding Is Hardware-Dependent (dev.to)](https://dev.to/sysoft/mtp-isnt-always-a-win-195x-on-my-3090-but-speculative-decoding-is-hardware-dependent-2d5b)
- [Earlier post: Qwen3.6-27B MTP on RTX 3090 (bric.pe.kr)](https://bric.pe.kr/blog/qwen3-27b-rtx-3090-llama-cpp-mtp-doubling-tokens)
- [Gemma 4 12B QAT GGUF models (unsloth)](https://huggingface.co/unsloth/gemma-4-12B-it-qat-GGUF)
- [llama.cpp Apple Silicon M-series performance discussion](https://github.com/ggml-org/llama.cpp/discussions/4167)
- [Gemma 4: Local Multimodal LLM Guide (related KB note)](../explanation-gemma-4-local-multimodal-llm.md)
