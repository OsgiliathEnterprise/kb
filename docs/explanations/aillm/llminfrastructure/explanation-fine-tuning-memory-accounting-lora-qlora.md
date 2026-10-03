---
title: Why Fine-Tuning a 7B Model Needs ~112 GB — The 16-bytes-per-parameter Accounting
diataxis: Explanation
domain: AI-LLM
topic: LLM-Infrastructure
source: DEV.to Tech News
source_url: https://dev.to/narotra05hp/fine-tuning-a-7b-model-needs-112-gb-the-model-is-only-14-gb-of-it-ieb
date: 2026-10-03
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- explanations
---
# Why Fine-Tuning a 7B Model Needs ~112 GB — The 16-bytes-per-parameter Accounting

Ask how much memory it takes to fine-tune a 7B model and the instinct is "the model's 14 GB in fp16, so a bit more than that." The real figure is about **112 GB**, before storing a single activation — and only 14 GB of it is the model you're actually trying to change. Once you see where the other 98 GB goes, LoRA and QLoRA stop looking like clever tricks and start looking obvious.

## Where the memory actually goes

The accounting comes from the [ZeRO paper](https://arxiv.org/abs/1910.02054), which states it plainly: mixed-precision training with Adam requires `2Ψ + 2Ψ + KΨ = 16Ψ` bytes, where Ψ is the parameter count (their example: GPT-2's 1.5B parameters need at least 24 GB versus a "meager" 3 GB for fp16 weights alone).

Per parameter, mixed-precision training with Adam holds:

| Component | Bytes/param | Notes |
| --- | --- | --- |
| fp16 weights | 2 | the model itself |
| fp16 gradients | 2 | one backward pass's worth |
| K (fp32 master copy + Adam moments) | 12 | 4-byte fp32 weight copy + two 4-byte moment buffers |
| **Total** | **16** | ×7B params = **112 GB** |

The optimizer state alone is 84 GB — six times the weights. Fine-tuning memory isn't dominated by the model; it's dominated by the *bookkeeping needed to update it*.

## LoRA: stop paying for the bookkeeping

If most of the cost is gradients and optimizer state, the obvious move is to have far fewer things that need them. That's [LoRA](https://arxiv.org/abs/2106.09685): freeze every pretrained weight and train a pair of small matrices injected into each layer instead. The frozen base still sits in memory at fp16 (14 GB) but carries no gradients and no optimizer state — only the small adapters do.

How small? Take a Llama-style 7B: 32 layers, hidden size 4096, with adapters on the query and value projections. At rank 8, each adapter is `8 × (4096 + 4096) = 65,536` values. Across 32 layers and two projections that's **4,194,304 trainable parameters — about 0.06% of the model**. You're training four million numbers, not seven billion.

Hu et al.'s GPT-3 result: compared to full fine-tuning with Adam, LoRA "can reduce the number of trainable parameters by 10,000 times and the GPU memory requirement by 3 times" while performing on-par or better in quality. And because the low-rank update merges back into the base weight afterwards, there's **no additional inference latency** — what separated it from earlier adapter methods that left an extra layer permanently in the forward pass.

## QLoRA: shrink the part you can't avoid

LoRA leaves one big cost standing: the frozen base still needs 14 GB at fp16. [QLoRA](https://arxiv.org/abs/2305.14314) goes after exactly that — store the frozen base in 4-bit and it drops to about 3.5 GB (slightly more in practice, because quantization needs constants of its own). Dettmers et al.'s double quantization cuts even that overhead "from 32/64 = 0.5 bits to 8/64 + 32/(64·256) = 0.127 bits" per parameter.

Gradients still flow through the 4-bit base into LoRA adapters kept at higher precision. The headline result: enough memory saved "to finetune a 65B parameter model on a single 48GB GPU while preserving full 16-bit finetuning task performance." The cost is time — 4-bit weights must be dequantized for every arithmetic operation, so QLoRA runs slower than plain LoRA. You're trading speed for memory.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "ft1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 230,
      "height": 150,
      "strokeColor": "#c0392b",
      "backgroundColor": "#f5b7b1",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Full fine-tuning\npays all 16 bytes/param:\n2 fp16 weights +\n2 fp16 grads +\n12 optimizer (K)\n7B → ~112 GB", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ft2",
      "type": "rectangle",
      "x": 340,
      "y": 60,
      "width": 250,
      "height": 150,
      "strokeColor": "#2980b9",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "LoRA\nbase frozen at fp16 (14 GB)\nno grads/optimizer on base\ntrain ~4M adapter params\n(rank 8, q+v, 32 layers)\n≈0.06% of model", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ft3",
      "type": "rectangle",
      "x": 660,
      "y": 60,
      "width": 250,
      "height": 150,
      "strokeColor": "#27ae60",
      "backgroundColor": "#d5f5e3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "QLoRA\nbase in 4-bit (~3.5 GB)\n+ double quantization\n(0.127 bits/param overhead)\nadapters at higher precision\n65B on one 48GB GPU;\ncost: dequantize = slower", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ft4",
      "type": "arrow",
      "x": 270,
      "y": 135,
      "width": 70,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [70, 0]]
    },
    {
      "id": "ft5",
      "type": "arrow",
      "x": 590,
      "y": 135,
      "width": 70,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [70, 0]]
    }
  ]
}
```

## The unifying question

The three methods are really one question: **which of the 16 bytes per parameter are you willing to stop paying for?**

- **Full fine-tuning** pays all 16. Worth it when hardware isn't the constraint, or the task is far from what the model was trained on.
- **LoRA** stops paying the 14 bytes of bookkeeping on the base; the 2-byte fp16 copy stays.
- **QLoRA** shrinks that remaining 2 bytes to roughly half a byte.

If someone says their 7B model "needs 14 GB," they're quoting *inference*. Ask about the other 98.

## References

- [Fine-tuning a 7B model needs 112 GB. The model is only 14 GB of it (DEV.to)](https://dev.to/narotra05hp/fine-tuning-a-7b-model-needs-112-gb-the-model-is-only-14-gb-of-it-ieb)
- [ZeRO paper — arXiv:1910.02054](https://arxiv.org/abs/1910.02054)
- [LoRA paper — arXiv:2106.09685](https://arxiv.org/abs/2106.09685)
- [QLoRA paper — arXiv:2305.14314](https://arxiv.org/abs/2305.14314)
