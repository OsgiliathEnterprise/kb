---
title: How to Build a Diffusion Language Model (Masked/Uniform, Block, Guidance)
diataxis: Explanation
domain: AI-LLM
topic: diffusion-language-models
source: HackerNews
source_url: https://kuleshov-group.github.io/blog/blog/2026/how-to-build-a-diffusion-language-model/
date: 2026-08-31
keywords:
- knowledge-base
- diffusion-language-models
- AI-LLM
- explanations
---
# How to Build a Diffusion Language Model

An overview of the building blocks behind modern diffusion LLMs (Mercury 2 / Inception Labs, Gemma Diffusion / Google, Nemotron Diffusion / NVIDIA), adapted from Cornell's Kuleshov group workshop talks (ICLR 2026, MLSS 2026). The core question: how do you apply the *diffusion* paradigm — which dominates continuous data like images — to **discrete** data like text?

## Autoregressive vs. diffusion generation

Autoregressive LLMs emit tokens left-to-right, one at a time, each conditioned on prior tokens. Inherent limits: no error correction (a token can't be revised once emitted), slow sequential generation, and causal attention that only looks backward. Diffusion models instead generate the **whole sequence at once**, starting from an initial guess and refining every position in parallel over several steps — trading speed vs. quality by using fewer or more steps, correcting mistakes along the way, and attending bidirectionally.

## Gaussian diffusion (the continuous template)

The blueprint is *denoising*: a **forward process** adds growing amounts of Gaussian noise to clean data until it becomes pure static; a **reverse process** learns to invert that trajectory, trained on the image-to-noise pairs the forward pass manufactures. Generation = start from noise, repeatedly estimate and strip a bit of noise.

## Masked diffusion (discrete analog)

For discrete tokens, "noise" is defined by **masking**. A masked diffusion model (MDLM) is essentially a *generative BERT*: train a bidirectional transformer to fill in randomly-masked tokens at a randomized masking rate.

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "s1", "type": "rectangle", "x": 40, "y": 160, "width": 190, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Clean sequence x\n(all tokens visible)", "fontSize": 14, "fontFamily": 1}}, {"id": "s2", "type": "rectangle", "x": 270, "y": 160, "width": 190, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#fff3bf", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Forward: mask a\nrandom fraction\ngoverned by schedule alpha_t", "fontSize": 14, "fontFamily": 1}}, {"id": "s3", "type": "rectangle", "x": 500, "y": 160, "width": 190, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#ffe8cc", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Fully masked z_T\n(pure noise)", "fontSize": 14, "fontFamily": 1}}, {"id": "r1", "type": "rectangle", "x": 500, "y": 320, "width": 190, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Reverse: model x_theta(z_t)\npredicts clean tokens", "fontSize": 14, "fontFamily": 1}}, {"id": "r2", "type": "rectangle", "x": 270, "y": 320, "width": 190, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#d9ccff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Infill blanks +\nre-mask a subset\n(keep more unmasked)", "fontSize": 14, "fontFamily": 1}}, {"id": "r3", "type": "rectangle", "x": 40, "y": 320, "width": 190, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Converge to clean\nsample (any order)", "fontSize": 14, "fontFamily": 1}}, [{"id": "a1", "type": "arrow", "x": 230, "y": 200, "width": 40, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [40, 0]]}, {"id": "a1_lbl", "type": "text", "x": 230, "y": 176, "width": 120, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a2", "type": "arrow", "x": 460, "y": 200, "width": 40, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [40, 0]]}, {"id": "a2_lbl", "type": "text", "x": 460, "y": 176, "width": 120, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a3", "type": "arrow", "x": 595, "y": 240, "width": 0, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 80]]}, {"id": "a3_lbl", "type": "text", "x": 595, "y": 216, "width": 120, "height": 20, "text": {"content": "denoise"}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a4", "type": "arrow", "x": 460, "y": 360, "width": 150, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-150, 0]]}, {"id": "a4_lbl", "type": "text", "x": 460, "y": 336, "width": 150, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a5", "type": "arrow", "x": 230, "y": 360, "width": 150, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-150, 0]]}, {"id": "a5_lbl", "type": "text", "x": 230, "y": 336, "width": 150, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]]}
```
- **Forward:** mask each token with probability `1 - alpha_t`, where the schedule `alpha_t` goes 1 -> 0 (clean -> fully masked). Implemented as a Markov chain over latents z_t.
- **Reverse:** train x_theta(z_t) to predict the clean sequence; at generation, fill blanks then re-mask a subset, keeping slightly more tokens unmasked each round until convergence.
- **Objective:** with `alpha_t = 1 - t`, the ELBO reduces to the BERT cross-entropy loss averaged over all masking rates and normalized by t — which is why MDLM narrows the perplexity gap to autoregressive models on LM1B.

## Making it production-ready (the real-world extensions)

1. **Block diffusion** for variable length: diffuse one block ("canvas") of tokens at a time, conditioned on previously generated blocks; supports KV caching like AR models. Block size is tunable (domain knowledge or GPU arithmetic intensity). Alternatives: Set Diffusion (arbitrary position sets), Edit Flows / FlexMDM (insert/delete/substitute ops).
2. **Encoder-decoder architecture:** split the two jobs — a heavy *encoder* represents clean context once, a lightweight *decoder* iteratively denoises the masked canvas. Core of Gemma Diffusion and Nemotron Diffusion; also speeds training by feeding blocks to a smaller decoder.
3. **Iterative refinement / error correction** (standard MDLM can't revise committed tokens):
   - **Remasking diffusion (ReMDM):** re-mask a small subset of previously-unmasked tokens each step so they can be regenerated — gives inference-time compute scaling (more steps -> closer to AR quality).
   - **Uniform-state diffusion (UDLM):** forward process replaces tokens with *random* vocabulary tokens instead of masks, so any position can be revised at any step. Faster sampling + better controllability; Gemma Diffusion is a UDLM.
4. **Distillation for speed:** progressive distillation / self-distillation-through-time / discrete consistency distillation halve the number of sampling steps each round (diffusion can already be 5-10x faster than AR by emitting multiple tokens per step).
5. **Controllable generation:** classifier-based guidance (CBG) and classifier-free guidance (CFG), with a `gamma` strength parameter trading off naturalness vs. property satisfaction — diffusion's global refinement makes it better at steering toward a target property than AR.

## Where it's used today

- **Biology/science** (less left-to-right bias, benefits from controllable generation):
  - **ESM3** — MDLM up to 100B params over interleaved sequence/structure/function tracks; SOTA protein generation.
  - **Nucleotide Transformer v3 (NT-v3)** — MDLM scaled to billions of params / >1T DNA tokens, multi-track input, discrete CFG + remasking for target gene-expression design (validated in wet-lab).
- **General LLMs:** **LLaDA** scales MDLM to 8B with block diffusion at sampling time and remasking/post-training compatibility; competitive with similarly-sized AR models and shows AR-like scaling of accuracy vs. training FLOPs on GSM8K/MMLU.

## Key insight

Diffusion for language = "generative BERT" + a principled ELBO, then bolt on block diffusion (length), encoder-decoder (speed), remasking/UDLM (error correction), distillation (fewer steps), and guidance (control). The unifying theme: generate the whole sequence in parallel and *refine globally*, rather than committing to irreversible left-to-right tokens.

## References

- [How to Build a Diffusion Language Model — Kuleshov group](https://kuleshov-group.github.io/blog/blog/2026/how-to-build-a-diffusion-language-model/)
