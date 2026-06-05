---
title: 'Gemma 4: Local Multimodal LLM Guide'
diataxis: Explanation
domain: AI & Machine Learning
topic: Local AI
source: DZone
source_url: https://feeds.dzone.com/link/23558/17344251/run-gemma-4-locally-guide
date: 2026-05-19
keywords:
- knowledge-base
- Local AI
- AI & Machine Learning
- explanations
---
# Gemma 4: Running Google's Open Multimodal LLM Locally

## Overview

Released April 2, 2026. Built on Gemini 3 research. Clean Apache 2.0 license (unlimited commercial use, no MAU caps).

## Model Variants

| Model | Disk | Active Params | Multimodal | Context | Best For |
|-------|------|--------------|------------|---------|----------|
| **E2B** | 7.2 GB | ~2B | text+image+audio | 128K | Phones, edge |
| **E4B** | 9.6 GB | ~4B | text+image+audio | 128K | **Laptops (recommended)** |
| **26B MoE** | 18 GB | ~4B active | text+image | 256K | Consumer GPUs |
| **31B Dense** | 20 GB | 31B | text+image | 256K | Workstations |

**Naming:** `E` = Effective params (Per-Layer Embeddings). `A4B` = Active 4B per token.
**MoE caveat:** Need full 26B in RAM despite only 4B activating per token.

## Architecture Highlights

- **3 Input Paths:** Text (SentencePiece), Images (vision encoder, variable aspect ratios), Audio (USM conformer on E2B/E4B)
- **Alternating Local/Global Attention:** Sliding-window + full context subset. Keeps KV cache manageable at 256K
- **Per-Layer Embeddings (PLE):** Each layer gets conditioning vector from lookup table - boosts capacity without increasing active params
- **MoE:** Router selects 2 of 8 expert FFNs per token
- **Thinking Mode:** Triggered by `&lt;|think|>` in system prompt. Outputs reasoning in `&lt;|channel>thought...<channel|>` blocks

## Quick Start (Ollama)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull gemma4          # E4B (~9.6 GB)
ollama pull gemma4:e2b      # Smallest (~7.2 GB)
ollama pull gemma4:26b      # MoE (~18 GB)
ollama pull gemma4:31b      # Dense (~20 GB)

# Interactive use
ollama run gemma4
>>> /set system "<|think|>You are a careful, methodical assistant."
```

## Python API

```python
import ollama

# Basic chat
response = ollama.chat(
    model="gemma4",
    messages=[
        {"role": "system", "content": "You are a senior code reviewer."},
        {"role": "user", "content": "Review this code:\n\ndef add(a, b):\n    return a+b"},
    ],
)
print(response["message"]["content"])

# Streaming
stream = ollama.chat(model="gemma4", messages=[{"role": "user", "content": "Write a haiku."}], stream=True)
for chunk in stream:
    print(chunk["message"]["content"], end="", flush=True)

# Image input
response = ollama.chat(
    model="gemma4",
    messages=[{"role": "user", "content": "What's in this?", "images": ["./photo.jpg"]}],
)

# Native function calling
tools = [{"type": "function", "function": {"name": "get_weather", "parameters": {...}}}]
response = ollama.chat(model="gemma4", messages=[...], tools=tools)
```

## Thinking Mode Guidelines

**Use when:** Code, math, multi-hop reasoning, agentic planning
**Skip when:** Factual Q&A, summarization, translation (adds unnecessary latency)

## Hardware Requirements

- Apple Silicon: 16 GB unified memory handles E4B comfortably
- NVIDIA: Model must fit entirely in VRAM for GPU acceleration
- 26B fits on 24 GB but leaves minimal headroom

## Key Insight

Gemma 4 represents a significant leap for local deployment with native multimodal support and clean licensing, making it viable for edge devices through enterprise workstations.
