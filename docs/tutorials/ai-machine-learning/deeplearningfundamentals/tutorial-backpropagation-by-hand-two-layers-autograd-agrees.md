---
title: 'Backpropagation by Hand: Two Layers, a Pen, and Then Autograd Agrees'
diataxis: Tutorial
domain: AI & Machine Learning
topic: Deep-Learning-Fundamentals
source: DEV.to Tech News
source_url: https://dev.to/pytorchfromgroundup/backpropagation-by-hand-two-layers-a-pen-and-then-autograd-agrees-13i6
date: 2026-08-23
keywords:
- knowledge-base
- Deep-Learning-Fundamentals
- AI & Machine Learning
- tutorials
---
# Backpropagation by Hand: Two Layers, a Pen, and Then Autograd Agrees

## Overview

A learning-oriented exercise: take a **two-layer network small enough to hold in your head**, compute **every gradient by hand, one node at a time**, then type the identical computation into PyTorch and watch autograd land on the exact same numbers. The whole point is the moment where **the pen and the computer agree** — and then deliberately breaking one neuron to see *why* the gradients die.

## The network

Two layers: one input → hidden neuron with ReLU → output neuron → squared-error loss. Written as plain scalars so nothing hides inside a matrix:

```
x ──▶ h1 = w1·x + b1 ──▶ a1 = ReLU(h1) ──▶ h2 = w2·a1 + b2 ──▶ L = (h2 − y)²
```

Four parameters to differentiate: `w1`, `b1`, `w2`, `b2`. Numbers chosen so nothing is hidden:

```
x = 1.0
w1 = 2.0   b1 = 0.0
w2 = 3.0   b2 = 1.0
y = 2.0    (target)
```

## Exercise 1 — Forward pass (keep every intermediate)

Compute left to right, writing down **all** intermediates — the backward pass reuses these exact numbers, so this bookkeeping is not optional:

```
h1 = w1·x + b1 = 2·1 + 0 = 2.0
a1 = ReLU(h1)  = max(0, 2) = 2.0
h2 = w2·a1 + b2 = 3·2 + 1 = 7.0
L  = (h2 − y)²  = (7 − 2)² = 25.0
```

## Exercise 2 — Backward pass, one node at a time

The entire method, unchanged no matter how deep the net is: **at each node, take the gradient arriving from the right, multiply by that node's local derivative, pass the result further left.** That is the chain rule and nothing else.

- **loss → h2:** `L = (h2 − y)²` ⇒ `∂L/∂h2 = 2(h2 − y) = 2·5 = 10.0`
- **h2 → output params:** `∂h2/∂w2 = a1`, `∂h2/∂b2 = 1` ⇒ `∂L/∂w2 = 10·2 = 20.0`, `∂L/∂b2 = 10·1 = 10.0`
- **h2 → a1 (crossing into the hidden layer):** `∂h2/∂a1 = w2` ⇒ `∂L/∂a1 = 10·3 = 30.0` — the gradient does *not* stop at the output layer; it flows back through `w2`.
- **a1 → h1 (through the ReLU):** ReLU derivative is 1 when input > 0, else 0. `h1 = 2 > 0` ⇒ gate open: `∂L/∂h1 = 30·1 = 30.0`
- **h1 → first-layer params:** `∂L/∂w1 = 30·x = 30.0`, `∂L/∂b1 = 30·1 = 30.0`

Result, by hand:

```
∂L/∂w1 = 30    ∂L/∂b1 = 30    ∂L/∂w2 = 20    ∂L/∂b2 = 10
```

Notice the shape: the `10` computed at the output is carried all the way back, multiplied by `w2`, then the ReLU's `1`, then `x`. **Every gradient in the network is the loss's number times a chain of local slopes.** Deeper nets are just longer chains.

## Exercise 3 — Ask PyTorch the same question

```python
import torch

x  = torch.tensor(1.0)
w1 = torch.tensor(2.0, requires_grad=True)
b1 = torch.tensor(0.0, requires_grad=True)
w2 = torch.tensor(3.0, requires_grad=True)
b2 = torch.tensor(1.0, requires_grad=True)
y  = torch.tensor(2.0)

h1 = w1 * x + b1
a1 = torch.relu(h1)
h2 = w2 * a1 + b2
loss = (h2 - y) ** 2

loss.backward()

print(f"loss   = {loss.item()}")     # 25.0
print(f"dL/dw1 = {w1.grad.item()}")  # 30.0
print(f"dL/db1 = {b1.grad.item()}")  # 30.0
print(f"dL/dw2 = {w2.grad.item()}")  # 20.0
print(f"dL/db2 = {b2.grad.item()}")  # 10.0
```

All four match, and the loss matches. Autograd traced the same chain of operations, stored the same intermediate values on the forward pass, and multiplied the same local derivatives on the way back. The only thing it did that you didn't is **bookkeeping — without asking you, and identically with ten million parameters.**

> If you read nothing else, run that block and put it next to the hand calculation. That's the moment the pen and the computer agree.

## Exercise 4 — Break the hidden neuron (debugging skill)

Same network, but flip `w1` to `-2`:

```
h1 = -2·1 + 0 = -2.0
a1 = ReLU(-2) = 0.0
h2 = 3·0 + 1 = 1.0
L  = (1 − 2)² = 1.0
```

```python
w1 = torch.tensor(-2.0, requires_grad=True)   # the only change
# ... rest identical ...
loss.backward()

print(w1.grad.item(), b1.grad.item())   # 0.0 0.0
print(w2.grad.item(), b2.grad.item())   # 0.0 -2.0
```

**Three of the four gradients are zero, and the loss is not.** The network is wrong and mostly getting no signal about it. Because you did the hand version, you can say *exactly why*: the ReLU gate is closed (`h1 &lt; 0` ⇒ `∂a1/∂h1 = 0`), which zeroes the entire chain into layer 1 — the classic **dead-ReLU** signature. The one surviving gradient (`∂L/∂b2 = -2`) only tells you the output bias is off, which is useless when the hidden neuron is the problem.

## Why this matters

- Hand-deriving one small net makes `loss.backward()` **legible instead of magical**: it's the same chain rule, with automatic bookkeeping.
- It converts gradient debugging from guessing into **localization**: when a gradient is 0, you can name the exact node whose local derivative killed it.
- The same node-at-a-time recipe scales; autograd just does it for you at any size.

## Diagram: where the gradient flows

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "x",
      "type": "rectangle",
      "x": 40, "y": 60,
      "width": 100, "height": 60,
      "strokeColor": "#999",
      "backgroundColor": "#eee",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "x = 1.0", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "h1",
      "type": "rectangle",
      "x": 220, "y": 60,
      "width": 130, "height": 60,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "h1 = w1x+b1 = 2.0", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "a1",
      "type": "rectangle",
      "x": 430, "y": 60,
      "width": 130, "height": 60,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "a1 = ReLU(h1) = 2.0", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "h2",
      "type": "rectangle",
      "x": 640, "y": 60,
      "width": 130, "height": 60,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "h2 = w2a1+b2 = 7.0", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "L",
      "type": "rectangle",
      "x": 850, "y": 60,
      "width": 120, "height": 60,
      "strokeColor": "#c0345c",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "L = (h2-y)^2 = 25", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "fwd1",
      "type": "arrow",
      "x": 140, "y": 75,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "fwd2",
      "type": "arrow",
      "x": 350, "y": 75,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "fwd3",
      "type": "arrow",
      "x": 560, "y": 75,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "fwd4",
      "type": "arrow",
      "x": 770, "y": 75,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "bwd",
      "type": "text",
      "x": 240, "y": 140,
      "text": { "content": "backward: dL/dh2=10 -> xw2=30 -> x1(ReLU)=30 -> dw1=30, db1=30 | dw2=20, db2=10", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "dead",
      "type": "text",
      "x": 240, "y": 170,
      "text": { "content": "break w1=-2: h1<0 => ReLU gate 0 => dw1=db1=dw2=0 (dead neuron), only db2=-2 survives", "fontSize": 12, "fontFamily": 1 }
    }
  ]
}
```

## References

- [Backpropagation by Hand: Two Layers, a Pen, and Then Autograd Agrees (dev.to, original)](https://dev.to/pytorchfromgroundup/backpropagation-by-hand-two-layers-a-pen-and-then-autograd-agrees-13i6)
- [PyTorch autograd documentation](https://pytorch.org/docs/stable/autograd.html)
- Related KB note: [Using PyTorch Autograd for Automatic Differentiation](../../PyTorch/How-to-Use-PyTorch-Autograd-for-Automatic-Differentiation.md)
