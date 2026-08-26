---
title: 'DeepSeek''s Vision Lineage: From DeepSeek-VL to Vision-Exp'
diataxis: Explanation
domain: ai-machine-learning
topic: multimodal
source: DEV.to Tech News
source_url: https://dev.to/forestlioooooo/deepseeks-vision-lineage-from-deepseek-vl-to-vision-exp-45ki
date: 2026-08-25
keywords:
- knowledge-base
- multimodal
- ai-machine-learning
- explanations
---
# DeepSeek's Vision Lineage: From DeepSeek-VL to Vision-Exp

When `deepseek-v4-flash-vision-exp` arrived, the headline was "a text model
gained native image input." The more useful story is the years of visual
research behind it. (Independent analysis; not an official DeepSeek statement.)

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "e1",
      "type": "rectangle",
      "x": 60,
      "y": 200,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "DeepSeek-VL",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "e2",
      "type": "rectangle",
      "x": 380,
      "y": 200,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "V2 (multimodal)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "e3",
      "type": "rectangle",
      "x": 700,
      "y": 200,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "vision-exp\n(deepseek-v4-flash-vision-exp)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "e4",
        "type": "arrow",
        "x": 280,
        "y": 245,
        "width": 100,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            100,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "e5",
        "type": "arrow",
        "x": 600,
        "y": 245,
        "width": 100,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            100,
            0
          ]
        ]
      },
      {
        "id": "e5_lbl",
        "type": "text",
        "x": 600,
        "y": 221,
        "width": 100,
        "height": 20,
        "text": "API endpoint",
        "fontSize": 13,
        "fontFamily": 1,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent"
      }
    ],
    {
      "id": "e6",
      "type": "rectangle",
      "x": 200,
      "y": 360,
      "width": 600,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Image -> visual tokens -> fused with text tokens\n(image token budget / limits matter for cost & context)",
        "fontSize": 14,
        "fontFamily": 1
      }
    }
  ]
}
```

## DeepSeek-VL — real-world visual data

Combined a DeepSeek language model with a vision encoder. The team built a
taxonomy from real user scenarios (recognition, transcription, conversion,
analysis, commonsense and logical reasoning, multi-image comparison, safety) to
drive instruction-tuning data.

The training recipe was **three-stage**:

1. Pretrain the vision encoder on image-text pairs.
2. **Joint pretraining** of LM + adaptor on text-only *and* multimodal data,
   keeping the main vision encoder frozen.
3. Supervised fine-tuning on multimodal instructions and text conversations.

The final pretraining mix was roughly **70% text / 30% multimodal**, with a
modality warm-up that gradually introduces images. Lesson: adding an encoder is
not enough — training must preserve the LM's reasoning and instruction-following.
~1.3B and 7B variants shipped with code and weights.

## DeepSeek-VL2 — detail + efficient inference

- **Dynamic tiling** for varied aspect ratios and higher resolutions (a fixed
  resize erases the detail a document/screenshot task needs). Precisely: for
  an input of size (H, W) it builds candidate resolutions
  `CR = {(m×384, n×384) | m,n ∈ N, 1 ≤ m,n, m×n ≤ 9}`, picks the one with the
  **minimum padding area**, then splits the resized image into `m×n` local
  **384×384 tiles plus one global tile** for context. Each tile passes
  through a shared **SigLIP-SO400M-384** encoder, yielding up to
  **729 embeddings of 1152 dimensions** per tile — fine detail without the
  compute blowup of naive resolution scaling.
- A **Mixture-of-Experts** language component (DeepSeekMoE) with
  **Multi-head Latent Attention**, which compresses the Key-Value cache into
  latent vectors for efficient inference and high throughput.
- Shipped as three variants by activated parameters: **Tiny (1.0B), Small
  (2.8B), and full (4.5B activated)** — competitive or SOTA with similar or
  fewer activated parameters than dense and MoE open-source peers, per the
  paper ([arXiv:2412.10302](https://arxiv.org/abs/2412.10302)).
- **Three-stage training recipe**: (1) *vision-language alignment* warmup on
  image-caption pairs (e.g. ShareGPT4V); (2) *pretraining* on a ~70%
  vision-language / 30% text-only mix to push cross-modal reasoning; (3)
  *supervised fine-tuning* on in-house QA and structured data (OCR, VQA,
  charts, documents). Reported strengths span visual question answering, OCR,
  document/table/chart understanding, and visual grounding.

## Janus / Janus-Pro — a distinct thread

Explored one autoregressive framework for *both* visual understanding and
image generation (a discrete visual-token path for generation). Relevant to the
broader visual ambition but **not** the same as the current API model — do not
conflate the research line with `DeepSeek-Vision-Exp`.

## What the current Vision-Exp API adds

- Accepts image input alongside text. Supports **JPEG, PNG, GIF, WebP** via
  public image URLs or Files API references.
- Available through DeepSeek's **OpenAI-compatible** Chat Completions and
  Responses APIs, and an **Anthropic-compatible** Messages endpoint.
- Documented limits: **max 384 tokens per image** after resizing, **up to 600
  images per request**, with different limits for external/base64 inputs vs.
  Files API references. These are API contract details, not evidence that
  training data is fully documented.

## What is traceable

The research lineage is visible; the complete training-data provenance of the
newest API model is not. Public material does not establish a full image list,
a complete licensing chain, a dedup/contamination report, or a one-to-one
mapping from model behavior to a named training example. Architecture docs answer
"how do I call it," not "where did every training example come from" — a
distinction that matters for legal/procurement due diligence.

## References

- [DeepSeek's Vision Lineage (dev.to)](https://dev.to/forestlioooooo/deepseeks-vision-lineage-from-deepseek-vl-to-vision-exp-45ki)
- [DeepSeek-VL2 paper (arXiv:2412.10302)](https://arxiv.org/abs/2412.10302)
- [DeepSeek-VL2 repository (deepseek-ai)](https://github.com/deepseek-ai/DeepSeek-VL2)
