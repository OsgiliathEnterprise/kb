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

## How good is it

JetBrains evaluates every candidate model on its own private test set before it
ships in Junie. **Qwen3.6-27B (with reasoning disabled) scored on par with
Sonnet 4.5** (10,000-token reasoning limit), while **GPT-5 at medium effort
scored slightly higher**. The notable detail: those local-model numbers are
what it achieves *without* reasoning, against cloud models that had it
enabled — so the local agent is competitive even after shedding the
reasoning overhead that would otherwise make it 2–3x more token-hungry.

## Where it stands

Junie Local launched on **M5-only Macs** and is explicitly a first step in a
longer project to run the agent across a wide variety of hardware:

- **The int8-prefill patch** (the ~40% prefill win) is being sent as a PR
  upstream to **MLX-VLM**.
- **Discrete-GPU support** — working prototypes for **DGX Spark** and
  **RTX 5090**, with 24 GB cards in exploration; prefill behavior on
  discrete GPUs differs substantially, so much of the remaining tuning
  shifts to that hardware.
- **Lowering the 64 GB memory floor** is the stated priority.
- As a cloud-based middle ground, Junie's **default moved to Gemini 3.7
  Flash at 40% off base pricing** (Aug 2026).

## Update (Sep–Oct 2026): the hardware floor came down

The launch promises were kept quickly — the M5/64 GB exclusivity did not last:

- **Sept 2026 — "Making Local AI Smarter and Faster":** experimental Windows
  support for NVIDIA RTX cards with **24 GB VRAM**, plus a new merged model,
  **Qwen3.8-3.6-27B-blend**, which retains much of Qwen3.8's coding ability
  while keeping Qwen3.6's shorter reasoning — more solves than Qwen3.6 with
  ~71% fewer output tokens than Qwen3.8. Users can pick either model via
  `/model`.
- **Oct 16, 2026 — NVIDIA RTX Spark day-one support and Windows stable.**
  Junie Local runs natively on RTX Spark PCs (Blackwell RTX GPU + Grace CPU,
  Windows 11 on Arm) and on x64 Windows 11 with **Ampere-or-newer 24 GB RTX
  cards (RTX 3090, 4090, 32 GB 5090)**. Key details:
  - Up to **55 tokens/s generation** on RTX Spark (initial baseline).
  - Uses **Blackwell Tensor Cores for FP8** computation plus speculative
    decoding (draft tokens verified together).
  - **Context window auto-sized** to the memory available to the GPU.
  - Requirements: NVIDIA driver 581+, ~20 GB free disk. Windows install:
    `iex (irm 'https://junie.jetbrains.com/install.ps1')` with
    `JUNIE_LOCAL_MODEL=1`; macOS: `curl -fsSL https://junie.jetbrains.com/install.sh | bash -s -- --local-model`.
- **Oct 28, 2026 — ~70% faster on Mac M5:** with **Splash and DFlash2**
  speculative-decoding work, Junie Local hits **~70 tokens/s on M5 Max**,
  cuts memory use, and **adds support for M4 Macs with 64 GB RAM** —
  dropping the M5-only requirement.
- **Junie Eco Mode** (Oct 2026): about half the model cost with similar
  resolve rates in internal benchmarks.
- Junie Local is **free**: no registration, subscription, credits, or card.

## References

- [JetBrains' Junie now runs entirely offline (TheNewStack)](https://thenewstack.io/jetbrains-junie-local-agent/)
- [Junie local launch (JetBrains blog)](https://blog.jetbrains.com/junie/2026/08/junie-local-launch/)
- [How We Optimized the Qwen 3.6 Model for Our Junie Agent (JetBrains blog, 2026-08-24)](https://blog.jetbrains.com/junie/2026/08/qwen-for-junie/)
- [Making Local AI Smarter and Faster (JetBrains blog, 2026-09-18)](https://blog.jetbrains.com/junie/2026/09/smarter-local-al/)
- [Junie Local on NVIDIA RTX Spark (JetBrains blog, 2026-10-16)](https://blog.jetbrains.com/junie/2026/10/junie-local-rtx-spark/)
- [Junie Local became 70% faster on Mac M5 (JetBrains blog, 2026-10-28)](https://blog.jetbrains.com/junie/2026/10/junie-local-splash-dflash2/)
- [JetBrains Junie official product page](https://www.jetbrains.com/junie/)

## Related
- [[explanation-perplexity-portable-computer-local-agent]]
- [[explanation-openai-hugging-face-agent-incident]]
