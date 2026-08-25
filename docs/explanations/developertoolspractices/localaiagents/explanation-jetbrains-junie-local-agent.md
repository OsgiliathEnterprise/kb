---
title: JetBrains Junie Now Runs Entirely Offline
diataxis: Explanation
domain: developer-tools-practices
topic: local-ai-agents
source: TheNewStack
source_url: https://thenewstack.io/jetbrains-junie-local-agent/
date: 2026-08-25
keywords:
- knowledge-base
- local-ai-agents
- developer-tools-practices
- explanations
---
# JetBrains Junie Now Runs Entirely Offline

Most AI coding tools default to cloud-hosted models; local model runtimes have
become a viable alternative. Junie Local takes the agent **fully offline**,
including an offline mode for air-gapped setups.

## What changed

Junie is not new to local models, but with Junie Local, JetBrains **picked the
model, quantized it, and tuned the inference engine and agent harness** around
that specific combination. Setup happens inside Junie itself: running `/local`
downloads the model and inference engine, starts a local server, and switches the
agent over automatically. There is **no separate Ollama or LM Studio
installation, endpoint to configure, or model profile to write.**

## Under the hood: why Qwen3.6, and why an M5 Mac

Junie runs **Qwen3.6-27B at 4-bit** using an inference engine based on
**mlx-vlm**, which in turn uses **MLX** (Apple's machine-learning framework).
That combination is what makes the agent harness and the model behave as one
unit on Apple Silicon.

## The hardware floor

JetBrains confirms Junie Local involves **~20 GB of downloads** and requires:

- **macOS 26**
- **at least 64 GB of unified memory**
- an **Apple M5** chip or newer

In practice that 64 GB requirement puts users into **M5 Pro / M5 Max** MacBook
Pro territory — "firmly a high-end Mac proposition." JetBrains is candid:

> "We know that an M5 Mac with 64 GB of RAM is a big ask. We are not going to
> pretend otherwise. That is simply what it costs to run a 27B model well today,
> and it is the number we are working hardest to bring down."

## Why developers want it

Privacy. Running the entire agent locally means **no external model provider
sits between the developer and their code**, and no source, prompts, or
generated changes leave the machine. For proprietary code, client NDAs, or
environments where sending source to a third party is off the table, that is a
substantial part of the appeal.

## Why Qwen3.6 and not Qwen3.8 (and what they tuned)

JetBrains' engineering follow-up explains the model choice: **Qwen3.8-27B
requires reasoning mode** to function well; without it, output quality drops
sharply and tasks can get stuck in a repeating tool-call loop. With reasoning
enabled at medium effort it emits roughly **5x more tokens** — a net ~4x
slowdown on agent tasks. Qwen3.6 works with `reasoning_effort: None`, cutting
generated tokens by 2–3x (a ~2x speed-up with no meaningful quality loss).

The other stack-level optimizations that made the local agent viable:

- **Rolling context across tasks** in a session, so KV-cache from earlier
  requests is reused instead of re-prefilling files.
- **4-bit quantization** — near-8-bit benchmark quality at ~2x generation
  speed (generation is memory-bottlenecked).
- **int8 prefill patch for MLX-VLM**: on M5, most prefill matrix ops ran in
  16-bit even with 4-bit weights; switching self-attention prefill to 8-bit
  gave **~40% prefill speed**. (M5 has 8-bit instructions M4 lacks — a big
  reason the launch is M5-only.)
- **Speculative decoding via MTP draft model + n-gram matching**, enabled
  together: up to ~3 tokens from the draft model plus up to 8 from n-grams —
  up to 2x generation speed.
- **Multi-agent mode and optional LLM calls disabled** — sequential processing
  is the most efficient path on a single local inference engine.

## References

- [JetBrains' Junie now runs entirely offline (TheNewStack)](https://thenewstack.io/jetbrains-junie-local-agent/)
- [Junie local launch (JetBrains blog)](https://blog.jetbrains.com/junie/2026/08/junie-local-launch/)
- [How We Optimized the Qwen 3.6 Model for Our Junie Agent (JetBrains blog, 2026-08-24)](https://blog.jetbrains.com/junie/2026/08/qwen-for-junie/)
