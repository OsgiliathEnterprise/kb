---
title: 'DiffusionGemma: Block-Autoregressive Text Diffusion at ~1,500 Tokens/Second'
diataxis: Explanation
domain: AI-LLM
topic: diffusion-language-models
source: Developpez
source_url: https://intelligence-artificielle.developpez.com/actu/384080/DiffusionGemma-Google-DeepMind-lance-un-modele-dote-d-une-nouvelle-architecture-appelee-diffusion-parallele-qui-genere-du-texte-en-bloc-et-permet-de-executer-l-IA-quatre-fois-plus-rapidement-en-local/
date: 2026-09-03
keywords:
- knowledge-base
- diffusion-language-models
- AI-LLM
- explanations
---
# DiffusionGemma: Block-Autoregressive Text Diffusion at ~1,500 Tokens/Second

Google DeepMind's **DiffusionGemma** (June 2026) is an experimental open-weights model that replaces sequential token-by-token decoding with **discrete text diffusion**: it denoises a whole block of tokens in parallel. It is built by fine-tuning the Gemma 4 MoE checkpoint rather than training from scratch, and ships under Apache 2.0 on Hugging Face with support in Transformers, vLLM, and Unsloth.

## Why AR decoding is slow locally

Autoregressive LLMs emit one token per forward pass; each pass reloads the full model weights from memory, so single-user local inference is **memory-bandwidth-bound** while tensor cores sit mostly idle. DiffusionGemma gives the GPU a large parallel workload — denoising up to 256 tokens at once — shifting the bottleneck from bandwidth to raw compute ("from a sequential typewriter to a printing press").

## Architecture and training

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {"id": "d1", "type": "rectangle", "x": 40, "y": 80, "width": 220, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Prompt + committed\ncanvas history\n(causal prefill,\nKV cache)", "fontSize": 14, "fontFamily": 1}},
    {"id": "d2", "type": "rectangle", "x": 320, "y": 80, "width": 240, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#fff3bf", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Canvas: 256 noisy\nplaceholder tokens\n(bidirectional attention,\nblock-diagonal mask)", "fontSize": 14, "fontFamily": 1}},
    {"id": "d3", "type": "rectangle", "x": 620, "y": 80, "width": 240, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#ffe8cc", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "~12 denoising passes\n(<=48 max steps,\nadaptive entropy stop)", "fontSize": 14, "fontFamily": 1}},
    {"id": "d4", "type": "rectangle", "x": 320, "y": 250, "width": 240, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Committed clean block\n-> appended to KV cache\n-> next canvas starts", "fontSize": 14, "fontFamily": 1}},
    {"id": "a1", "type": "arrow", "x": 260, "y": 125, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [60, 0]]},
    {"id": "a2", "type": "arrow", "x": 560, "y": 125, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [60, 0]]},
    {"id": "a3", "type": "arrow", "x": 440, "y": 170, "width": 0, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 80]]}
  ]
}
```

- **Backbone:** Gemma 4 26B A4B — a Mixture-of-Experts model with ~25.2–26B total parameters but only **3.8B active per step**, so it fits in ~18 GB of VRAM (consumer RTX class). Encoder-decoder transformer with shared weights; the AR backbone is repurposed for both causal context encoding and bidirectional denoising, inheriting long context (up to 262k), multimodal inputs (text/image/video → text), and thinking mode.
- **Generation:** block-autoregressive multi-canvas sampling — a "canvas" of 256 tokens is initialized with placeholder noise and refined over ~12 forward passes on average (~20 tokens per pass vs the ~3–6 TPF of state-of-the-art speculative decoding/MTP). Once fully denoised, the block commits to the KV cache and the next canvas starts.
- **Training:** two-stage pipeline using &lt;10% of the AR model's original token budget: (1) SFT teaching bidirectional denoising over 256-token canvases with a block-diagonal attention mask; (2) online RL combined with **sampler distillation** to jointly improve quality and compress denoising steps.
- **Inference details:** FlashAttention-4 kernels for the bidirectional canvas attention (~4x slower per pass than AR single-token decode, offset by far fewer passes); vocabulary 262k; sampler config: max 48 denoising steps, adaptive stopping entropy threshold 0.005, token-selection entropy threshold 0.1, linear temperature schedule 0.8 → 0.4.

## Measured speed

| Hardware | Throughput |
|---|---|
| NVIDIA H100 (single) | ~1,500 tokens/s (technical report; Google blog: 1,000+) |
| RTX 6000 (Unsloth benchmarking) | up to ~2,000 tokens/s |
| GeForce RTX 5090 | ~700+ tokens/s |

That is roughly **4x faster** than same-size autoregressive Gemma models — and faster even with speculative decoding. The speedup targets **local / low-concurrency** use: under high-QPS cloud serving, AR batching saturates compute better, so DiffusionGemma's parallel decode shows diminishing returns at large batch sizes.

## Trade-offs (stated by Google)

- **Higher error rate:** text is a discrete system — one wrong token can break an entire paragraph, unlike a stray pixel in an image. Self-correction across the canvas helps but does not eliminate this.
- **Inefficient for short answers:** massive parallel work is wasted when only five words are needed (AR would finish in five steps).
- **Not yet datacenter-ready:** positioned for interactive local workflows — in-line editing, code infilling, rapid iteration, non-linear structures (Sudoku-style puzzles, molecular sequences, math graphs) where bidirectional attention lets every token attend to all others.
- **Hybrid path:** despite diffusion fine-tuning the weights still support AR generation with only minor degradation, pointing toward hybrid diffusion/AR decoding.

## Running it

```bash
vllm serve google/diffusiongemma-26B-A4B-it \
  --max-model-len 262144 \
  --max-num-seqs 4 \
  --gpu-memory-utilization 0.85 \
  --attention-backend TRITON_ATTN \
  --generation-config vllm \
  --hf-overrides '{"diffusion_sampler": "entropy_bound", "diffusion_entropy_bound": 0.1}' \
  --diffusion-config '{"canvas_length": 256}' \
  --enable-chunked-prefill
```

Also runs on DGX Spark and in Hugging Face Transformers / Unsloth — no cloud, no per-token cost.

**NVIDIA-optimized variant:** `nvidia/diffusiongemma-26B-A4B-it-NVFP4` (on Hugging Face since 10 June 2026) is the same model quantized with NVIDIA Model Optimizer for vLLM on Blackwell and Hopper hardware — ~1,100+ tokens/s at low batch sizes on an H100 in FP8. The model card also documents capabilities the launch coverage underplays: native function calling, structured JSON output, configurable thinking mode, and multilingual inference across 35+ languages; image inputs use a configurable visual token budget (70–1,120 tokens per image) and video up to 60 s at 1 fps.

## References

- [Google blog: DiffusionGemma — 4x faster text generation](https://blog.google/innovation-and-ai/technology/developers-tools/diffusion-gemma-faster-text-generation/)
- [DiffusionGemma Technical Report (arXiv 2608.00146)](https://arxiv.org/abs/2608.00146)
- [Google AI for Developers: DiffusionGemma model overview](https://ai.google.dev/gemma/docs/diffusiongemma)
- [DiffusionGemma developer guide (vLLM integration)](https://developers.googleblog.com/en/diffusiongemma-the-developer-guide/)
- [nvidia/diffusiongemma-26B-A4B-it-NVFP4 model card (Hugging Face)](https://huggingface.co/nvidia/diffusiongemma-26B-A4B-it-NVFP4)
