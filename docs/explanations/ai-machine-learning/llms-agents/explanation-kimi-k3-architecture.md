---
title: Kimi K3 Architecture — 2.8T Open-Weight Frontier Model
diataxis: Explanation
domain: AI & Machine Learning
topic: LLMs & Agents
source: HackerNews
source_url: https://sebastianraschka.com/blog/2026/kimi-k3-architecture-notes.html
date: 2026-07-29
keywords:
- knowledge-base
- LLMs & Agents
- AI & Machine Learning
- explanations
---
## Kimi K3: Largest Open-Weight Model at 2.8T Parameters

Kimi K3 is the largest open-weight model released to date, with **2.8 trillion parameters**. It is a scaled-up production version of Moonshot AI's earlier [Kimi Linear](https://sebastianraschka.com/llm-architecture-gallery/#card-kimi-linear-48b-a3b) (48B parameters), inheriting most of its architectural innovations while introducing one key new component: **LatentMoE**.

The architecture represents a clear industry trend toward **inference efficiency** — replacing standard components with more efficient alternatives while maintaining or improving model quality.

### Architecture Overview

```
excalidraw: Kimi K3 Architecture
```

```
+---------------------------------------------------------------+
|                   Kimi K3 Architecture                         |
|               2.8T Parameters (Open-Weight)                    |
+---------------------------------------------------------------+
|                                                                |
|  Input: Text + Native Multimodal (images, audio, video)        |
|        ↓                                                       |
|  Token Embedding (NoPE — no positional embeddings)             |
|        ↓                                                       |
|  ┌────────────────────────────────────────────────────┐        |
|  │              Transformer Block (×N)                 │        |
|  │                                                     │        |
|  │  ┌──────────────┐    ┌──────────────────────┐      │        |
|  │  │  Attention   │    │     LatentMoE        │      │        |
|  │  │  Residual    │    │     (FFN replacement) │      │        |
|  │  └──────────────┘    └──────────────────────┘      │        |
|  │        ↓                    ↓                       │        |
|  │  ┌───────────────────────────────────────────┐     │        |
|  │  │         Gated Multi-Head Latent           │     │        |
|  │  │         Attention (MLA)                   │     │        |
|  │  └───────────────────────────────────────────┘     │        |
|  │        ↓                                           │        |
|  │  ┌───────────────────────────────────────────┐     │        |
|  │  │       Kimi Delta Attention                │     │        |
|  │  │       (Hybrid: global + local)            │     │        |
|  │  └───────────────────────────────────────────┘     │        |
|  │        ↓                                           │        |
|  │  ┌───────────────────────────────────────────┐     │        |
|  │  │       LatentMoE Router                    │     │        |
|  │  │       (down-project → expert select       │     │        |
|  │  │        → up-project)                       │     │        |
|  │  └───────────────────────────────────────────┘     │        |
|  │                                                     │        |
|  └────────────────────────────────────────────────────┘        |
|        ↓                                                       |
|  Output: Token logits                                         |
+---------------------------------------------------------------+
```

### LatentMoE: Compressing the Feed-Forward Path

**LatentMoE** is the one new component in Kimi K3 that was not present in Kimi Linear. It is the same LatentMoE design used in [Nemotron 3 Ultra](https://sebastianraschka.com/blog/2026/kimi-k3-architecture-notes.html).

**How it works:**
- LatentMoE replaces the standard feed-forward network (FFN) in each transformer block
- It **down-projects** (compresses) the large linear layers into a lower-dimensional latent space, similar to how [multi-head latent attention](https://sebastianraschka.com/llm-architecture-gallery/mla/) compresses attention
- A router selects which experts to activate in this compressed latent space
- The output is then **up-projected** back to the full dimensionality

**Why it matters:**
- Standard MoE activates a subset of experts but still requires full-dimensionality linear projections
- LatentMoE reduces the dimensionality of these projections, cutting both memory bandwidth and compute
- This follows the broader trend: `MoE → LatentMoE` as an efficiency upgrade

### Multi-Head Latent Attention (MLA)

Kimi K3 uses [gated multi-head latent attention](https://sebastianraschka.com/llm-architecture-gallery/mla/) instead of standard multi-head attention.

**Key idea:**
- Standard attention materializes full Q, K, V projections for every token and every head
- MLA compresses the key and value projections into a shared **latent space** before the attention computation
- This dramatically reduces KV cache size during inference — the dominant memory bottleneck for long-context generation

**Efficiency gain:**
- The KV cache scales with the latent dimension rather than the full hidden dimension
- For a 2.8T model, this savings is enormous in practice
- Follows the trend: `regular attention → MLA`

### Kimi Delta Attention: Hybrid Global + Local

[Kimi Delta Attention](https://sebastianraschka.com/llm-architecture-gallery/hybrid-attention/) is a hybrid attention mechanism that combines:

1. **Global attention** — full self-attention over the entire sequence for long-range dependencies
2. **Local (delta) attention** — a more efficient mechanism for capturing local context windows

**Why hybrid?**
- Global attention is O(n²) in sequence length — expensive for very long inputs
- Local attention captures most of the useful short-range structure at much lower cost
- The hybrid design lets the model use the right tool for each type of dependency

This is another efficiency-focused architectural choice, replacing monolithic attention with a more nuanced approach.

### Attention Residuals: Improving the Residual Path

Unlike the other components (which are efficiency tweaks), [attention residuals](https://sebastianraschka.com/llm-architecture-gallery/attention-residuals/) are a **quality improvement** to the residual connection path.

**How it works:**
- Standard residual connections pass information unchanged: `output = x + sublayer(x)`
- Attention residuals add **cross-layer residual connections** weighted by attention scores
- The attention score serves as an importance/contribution weight for each cross-layer connection
- This was already present in Kimi Linear and carried forward to K3

**Comparison to DeepSeek V4's mHC:**
- DeepSeek V4's manifold-constrained Hyper-Connections (mHC) made the residual path **wider**
- Attention residuals connect the residuals **across layers** with learned importance weights
- Both improve information flow through the network, but through different mechanisms

**Measured impact:**
- Improves validation loss and downstream performance consistently
- Adds only **~4% training cost** and **~2% inference cost**
- A strong quality-to-overhead ratio

### NoPE: No Positional Embeddings Everywhere

Kimi K3 completely eliminates RoPE (Rotary Positional Embeddings) in favor of [NoPE](https://sebastianraschka.com/llm-architecture-gallery/nope/) — no positional embeddings anywhere in the model.

**Context:**
- This is inherited from Kimi Linear
- Kimi K3 is the **first frontier-level model** known to use NoPE exclusively
- Other architectures have experimented with hybrid approaches (RoPE in local attention layers like [sliding window attention](https://sebastianraschka.com/llm-architecture-gallery/swa/), NoPE in global layers)
- A few non-frontier models used NoPE everywhere before, but none at this scale

**Why NoPE can work:**
- Attention mechanisms can learn positional relationships implicitly from the data
- Positional information can emerge from the attention patterns themselves
- Removing explicit positional embeddings simplifies the architecture and may improve extrapolation to longer contexts

### Native Multimodal Support

Kimi K3 includes **native multimodal support**, meaning it can process text, images, audio, and video inputs directly within the same architecture — not as a post-hoc adapter or separate modality encoder.

This is significant because:
- Earlier multimodal models often used separate vision/audio encoders with cross-attention bridges
- Native support means the model learns unified representations across modalities from the ground up
- It aligns with the industry trend toward truly unified multimodal foundation models

### Inference Efficiency Trend Across Modern Architectures

Kimi K3 sits at the intersection of a clear architectural trend toward **inference efficiency**. Comparing it with other frontier models reveals a pattern:

| Component | Traditional | Efficient Replacement | Models Using It |
|-----------|------------|----------------------|-----------------|
| Feed-forward | Standard FFN / MoE | **LatentMoE** | Kimi K3, Nemotron 3 Ultra |
| Attention | Multi-head attention | **Multi-head latent attention (MLA)** | Kimi K3, Kimi Linear |
| Attention scope | Global only | **Hybrid (global + local/delta)** | Kimi K3, Kimi Linear |
| Residual path | Standard skip connections | **Attention residuals / mHC** | Kimi K3, DeepSeek V4 |
| Positional encoding | RoPE | **NoPE** | Kimi K3, Kimi Linear |

**Why inference efficiency matters:**
- At 2.8T parameters, raw compute and memory bandwidth are the primary bottlenecks
- KV cache dominates memory usage during generation — MLA directly addresses this
- MoE routing is already sparse, but LatentMoE adds compression on top
- The combined effect is a model that can serve longer contexts and higher throughput than a dense model of comparable quality

### Comparison to Related Models

- **Kimi Linear (48B)** — predecessor; shares MLA, Kimi Delta Attention, attention residuals, and NoPE. K3 is the 2.8T scaled-up version with added LatentMoE
- **Nemotron 3 Ultra** — also uses LatentMoE; similar efficiency-first philosophy
- **DeepSeek V4** — uses mHC for residual path improvement (different approach from attention residuals); shares the efficiency trend

### Key Takeaways

| Concept | What It Does | Why It Matters |
|---------|-------------|----------------|
| LatentMoE | Compresses FFN layers via down-project → expert select → up-project | Reduces memory/compute in the FFN path |
| Multi-head latent attention | Compresses KV projections into latent space | Drastically reduces KV cache size |
| Kimi Delta Attention | Hybrid global + local attention | Balances long-range and short-range at lower cost |
| Attention residuals | Cross-layer residual connections with attention-weighted importance | Improves quality with only ~2% inference overhead |
| NoPE | Zero positional embeddings | Simpler architecture, first frontier model to do this fully |
| Native multimodal | Unified text/image/audio/video processing | True multimodal understanding, not bolted-on |

### References

- [Kimi K3 Architecture Notes — Sebastian Raschka](https://sebastianraschka.com/blog/2026/kimi-k3-architecture-notes.html)
- [LLM Architecture Gallery — Kimi K3 card](https://sebastianraschka.com/llm-architecture-gallery/#card-kimi-k3)
- [LLM Architecture Gallery — LatentMoE](https://sebastianraschka.com/llm-architecture-gallery/latent-moe/)
- [LLM Architecture Gallery — Multi-Head Latent Attention](https://sebastianraschka.com/llm-architecture-gallery/mla/)
- [LLM Architecture Gallery — Hybrid Attention (Kimi Delta)](https://sebastianraschka.com/llm-architecture-gallery/hybrid-attention/)
- [LLM Architecture Gallery — Attention Residuals](https://sebastianraschka.com/llm-architecture-gallery/attention-residuals/)
- [LLM Architecture Gallery — NoPE](https://sebastianraschka.com/llm-architecture-gallery/nope/)
