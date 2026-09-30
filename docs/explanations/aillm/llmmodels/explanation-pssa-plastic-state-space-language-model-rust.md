---
title: PSSA — A Plastic State-Space Language Model Written From Scratch in Rust
diataxis: Explanation
domain: AI-LLM
topic: LLM-Models
source: HackerNews
source_url: https://github.com/Sparticle62ops/pssa
date: 2026-09-30
keywords:
- knowledge-base
- LLM-Models
- AI-LLM
- explanations
---
# PSSA — A Plastic State-Space Language Model Written From Scratch in Rust

PSSA is a small non-transformer language model written entirely in Rust with no
ML framework underneath (no PyTorch/TensorFlow). It reads text one token at a
time through a recurrent state-space layer, keeps an episodic memory bank it
can look things up in, and **rewrites part of its own weights while it runs**
(hence "plastic"). At matched parameters on the same corpus it learns faster
than a parameter-matched transformer and generates text ~12x quicker on CPU.

## Why Rust (and why that's not the point)

PSSA needed per-token weight updates, a memory bank written during inference,
a forward pass plus a scalar reference path every batched kernel could be
differentiated against. Expressing that inside an autograd framework meant
fighting the framework at every step, so the linear algebra is hand-written in
Rust instead — which made the plastic parts straightforward and let gradients
be checked against a scalar CPU reference to ~3e-8 on every commit
(`cargo run --release --example twin_check`).

## Architecture: one PSSA layer per token

Defaults: `d_m = 256` channels, `d_s = 16` states per channel, rank-16 adapter.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "p0",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 180,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "token x\n(layer-normed)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "p1",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "selective SSM\nrecurrence (S4/Mamba family)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "p2",
      "type": "rectangle",
      "x": 300,
      "y": 260,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "hyperbolic memory read\n512 slots, top-4 Poincare", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "p3",
      "type": "rectangle",
      "x": 600,
      "y": 160,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "gate + rank-16 adapter\n+ SiLU MLP (residual)", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "pa1",
        "type": "arrow",
        "x": 220,
        "y": 195,
        "width": 80,
        "height": -40,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [80, -40]]
      }
    ],
    [
      {
        "id": "pa2",
        "type": "arrow",
        "x": 220,
        "y": 215,
        "width": 80,
        "height": 40,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [80, 40]]
      }
    ],
    [
      {
        "id": "pa3",
        "type": "arrow",
        "x": 520,
        "y": 195,
        "width": 80,
        "height": -40,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [80, -40]]
      }
    ],
    [
      {
        "id": "pa4",
        "type": "arrow",
        "x": 520,
        "y": 305,
        "width": 80,
        "height": -40,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [80, -40]]
      }
    ]
  ]
}
```

### The recurrence (standard selective SSM)

Three projections read off the token make it *selective* rather than fixed:

```text
delta = softplus(W_delta x)   per-channel step size
B     = W_B x                 input map
C     = W_C x                 output map
A     = -softplus(A_raw)      diagonal transition, negative by construction

Abar_ij = exp(delta_i * A_ij)
h_ij <- Abar_ij * h_ij + delta_i * B_j * x_i
y_i   = sum_j C_j * h_ij
```

`A_raw` is initialized so each channel's 16 rates sit on log-spaced timescales
(tau from 1.5 to 200 tokens, HiPPO-style) — one channel starts holding the
last two tokens and the last two hundred simultaneously; training moves those
horizons rather than discovering them. This half claims no novelty: same family
as S4/Mamba, written scalar-first so the backward pass checks term by term.

### The memory read (the PSSA-specific part)

The query is formed from **both** the current token and the recurrent state, so
retrieval is conditioned on where the recurrence has gotten to:

```text
q  = W_qx x + W_qh y
qh = proj(q)                     diffeomorphic map into Poincare ball, |qh| < 1
w = softmax(-d_H(qh, k_s) / tau_mem)   over the 4 nearest slots
m = sum_k w_k * v_k
```

Hyperbolic distance grows toward the boundary of the ball, so slots holding
general context and slots holding one specific episode stay separable without
widening the read. Four slots is a fixed cost per token regardless of bank size.

### Gate, adapter, MLP

```text
g     = sigmoid(W_gate x)
z     = s * y + g (elementwise) W_proj m + adapter(x)
u     = W_2 silu(W_1 z)
z_out = z + u
```

### The write path — why "plastic"

- A slot is inserted when the incoming state is **novel** against what the bank
  already holds.
- Each slot carries a **refractory counter** that rate-limits overwrites, so a
  stream of contradictory updates can't erase a slot repeated evidence has
  stabilized.
- **Closed-form consolidation**: fast plastic updates are folded back into the
  base transition matrix by ridge regression rather than living in the external
  store forever:

```text
A_base <- A_base + (H^T H + lambda I)^-1 H^T dH
```

## Results (with honest caveats)

Two models, same corpus/tokenizer/optimizer/seed/parameters — PSSA vs standard
transformer, over 12.7M tokens of cleaned WikiText-103:

| Held-out slice, 198,939 unseen tokens | PSSA | Transformer |
| --- | --- | --- |
| Cross-entropy | **3.997** | 4.429 |
| Perplexity | **54.4** | 83.8 |
| Next-token accuracy | **24.1%** | 18.0% |

The held-out gap (0.43 nats) ≈ the training gap — PSSA generalizes better, not
just memorizes harder. Generation: 200 tokens in **226 ms vs 2,735 ms** on the
same CPU (~12x), because a recurrent model carries fixed-size state while a
transformer re-reads its whole context every step.

Caveats stated by the author: these are **1.5M-parameter models** — a research
prototype; text quality at this scale is poor for both; training throughput
numbers are not hardware-matched; retention after corpus switch and memory-bank
ablation are still unmeasured. Trained on a free hosted notebook with one
entry-level GPU in 200k-token links.

## Backends and tooling

- CPU-oriented prototype: hand-written linear algebra, Rayon-parallelized dense
  backward adjoints (fixed-work probe: ~843 → ~2710 tok/s packed).
- Optional native **CUDA/cuBLAS** backend (`--features cuda`, `cudarc` loaded
  dynamically) alongside WebGPU; `try_gpu` prefers CUDA, falls back to WebGPU,
  then CPU.
- `.pssa` checkpoints are project-specific binary artifacts (no migration
  tooling); model shape cannot change across a resume chain.

## Key takeaways

- The interesting claims are the **hyperbolic bounded read conditioned on the
  recurrent state**, the novelty/refractory write rules, and ridge
  consolidation of fast weights into the transition matrix — not the SSM core.
- A scalar reference path that every batched kernel is differentiated against
  (max gradient diff ~3e-8) is a practical pattern for framework-free ML code.
- Linear-cost recurrent + episodic memory beats parameter-matched attention on
  learning efficiency at small scale; whether the gap holds at 10x/100x params
  is the open question.

## References

- [PSSA repository (README with full math)](https://github.com/Sparticle62ops/pssa)
- [Architecture diagrams in docs/img](https://github.com/Sparticle62ops/pssa/tree/main/docs)
