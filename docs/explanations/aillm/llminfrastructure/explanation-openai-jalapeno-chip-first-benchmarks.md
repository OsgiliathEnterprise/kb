---
title: 'OpenAI''s Jalapeño Chip: First Benchmarks Target Agentic Inference Latency'
diataxis: Explanation
domain: AI-LLM
topic: LLM-Infrastructure
source: TheNewStack
source_url: https://thenewstack.io/openai-jalapeno-inference-chip/
date: 2026-08-26
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- explanations
---
# OpenAI's Jalapeño Chip: First Benchmarks Target Agentic Inference Latency

OpenAI published the first results from working **Jalapeño** silicon — its
first custom inference chip, developed with Broadcom and unveiled in June 2026.
The benchmarks were run through **InferenceX**, SemiAnalysis' public
inference benchmark, across GPT-OSS 120B, DeepSeek R1 670B, and Kimi K2.5 1T.

## Headline results

- **1.5–1.9x** more work per watt than the systems compared against, across the
  three models.
- **1.7–3.6x** lower end-to-end latency.
- On highly interactive workloads, **2.1–4.1x** faster.
- Compared at the previous best time-between-tokens operating point, OpenAI
  reported **8.6–104.3x** more work per watt, depending on the model.

## Why it is built for agents

The design thesis: agents call the model over and over in sequence, so a delay
that barely registers in a single inference compounds across an entire task
("agents need to complete many steps in sequence, so delays can compound
across an entire task"). Different phases of LLM inference place different
demands on hardware:

- **Prefill** (processing the initial prompt) is compute-bound.
- **Decode** (token-by-token generation) is memory-bandwidth-bound.
- Every data movement between cores and chips adds waiting time.

Jalapeño's approach is to cut that waiting without optimizing one phase at the
expense of the other: model state — including the **KV cache** used during
generation — stays local, while the chip's networking keeps more of the
workload within the same connected system. Less time is spent moving data as
the workload shifts between compute-heavy and memory-bound phases.

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
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Agent task loop\nmany sequential LLM calls", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 340,
      "y": 120,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Prefill phase\ncompute-bound", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 340,
      "y": 240,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Decode phase\nmemory-bandwidth-bound\n(KV cache kept local)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 640,
      "y": 160,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f2d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Jalapeño results (InferenceX)\n1.5-1.9x work/W, 1.7-3.6x lower latency", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 260,
        "y": 205,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [80, 0] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 560,
        "y": 285,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [80, 0] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Context and caveats

- These are OpenAI's first public Jalapeño numbers; the chip was built from
  scratch specifically for LLM inference.
- The baseline for the headline comparisons is an **Nvidia Blackwell** system.
  By the time Jalapeño reaches full deployment that competition may have
  advanced significantly, so the ratios should be read against today's
  state-of-the-art, not a fixed point in time.
- Numbers are vendor-reported via SemiAnalysis' InferenceX harness — treat
  the absolute ratios as directional until independent reproduction.
- The 8.6–104.3x work-per-watt range reflects comparison at the *previous
  best time-between-tokens operating point*, where older systems pay for
  latency headroom they no longer need; it is not apples-to-apples with the
  1.5–1.9x figure.

## Deployment timeline

- First announced in **October 2025** and developed in close collaboration
  with Broadcom (OpenAI's own models assisted in the design).
- OpenAI plans Jalapeño as a **multigenerational, full-stack platform** —
  products, models, chips, and memory developed in concert.
- Deployment is expected to begin **at the end of 2026 "in very small
  volumes,"** with more significant deployment in **2027** (per Richard Ho,
  OpenAI's head of hardware).
- The design specifically targets the **prefill and communication phases**,
  which OpenAI identifies as common bottlenecks, by minimizing data movement
  and keeping the KV cache local.

## References

- [The New Stack: OpenAI's Jalapeño chip tackles a problem AI agents make worse](https://thenewstack.io/openai-jalapeno-inference-chip/)
- [TechCrunch: OpenAI's Jalapeño chip is built for fast inference at scale, benchmarks show](https://techcrunch.com/2026/08/25/openais-jalapeno-chip-is-built-for-fast-inference-at-scale-benchmarks-show/)
- [OpenAI: Jalapeño first results (official blog)](https://openai.com/index/jalapeno-first-results/)
- [Tom's Hardware: Broadcom and OpenAI unveil custom-built Jalapeño inference processor](https://www.tomshardware.com/tech-industry/artificial-intelligence/broadcom-and-openai-unveil-custom-built-jalapeno-inference-processor-openais-first-chip-is-a-massive-reticle-sized-asic-built-in-an-ultra-fast-nine-month-development-cycle)
- [Tom's Hardware (Hot Chips 2026): OpenAI's Jalapeño AI ASIC unpacked — architecture detail and Blackwell comparison](https://www.tomshardware.com/tech-industry/artificial-intelligence/hot-chips-2026-openais-jalapeno-ai-asic-unpacked-accelerator-developed-using-ai-achieves-efficiency-and-throughput-gains-against-power-hungry-blackwell)
