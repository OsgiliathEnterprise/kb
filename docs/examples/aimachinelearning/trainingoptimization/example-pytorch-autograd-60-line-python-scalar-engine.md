---
title: 'PyTorch Autograd Demystified: A 60-Line Scalar Reverse-Mode Engine in Pure
  Python'
diataxis: Example
domain: ai-machine-learning
topic: training-optimization
source: HackerNews
source_url: https://farid-alexander.github.io/autograd-from-scratch/
date: 2026-11-25
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- examples
---
# PyTorch Autograd Demystified: A 60-Line Scalar Reverse-Mode Engine in Pure Python

A minimal, runnable reverse-mode autodiff engine (like Karpathy's micrograd) whose objects are deliberately named and shaped like PyTorch's internals (`grad_fn`, `next_functions`, `AccumulateGrad`), so you can print PyTorch's graph and the mini engine side by side and every gradient is checked against PyTorch. Adapted from Chapter 6 of *The Complete Guide to PyTorch 2* by Farid Rahmani.

Diagram: `diagram-autograd-scalar-engine.excalidraw` (forward pass builds nodes left→right; `backward()` replays them right→left in reverse topological order).

## The mental model in one sentence

> Autograd is **recorded local rules, applied in the right order**. The forward pass only computes values and leaves behind a note per operation saying how to pass a gradient back through it; `backward()` follows those notes from the loss to the parameters.

## What the forward pass leaves behind

For `L = (w·x + b − y)²` with `x=2, y=5, w=1 (requires_grad), b=0 (requires_grad)`:

```python
import torch
x = torch.tensor(2.0)
y = torch.tensor(5.0)
w = torch.tensor(1.0, requires_grad=True)
b = torch.tensor(0.0, requires_grad=True)

p = w * x          # MulBackward0
y_hat = p + b      # AddBackward0
e = y_hat - y      # SubBackward0
L = e ** 2         # PowBackward0
L.backward()
print(w.grad, b.grad)   # tensor(-12.) tensor(-6.)
```

Inspecting `t.grad_fn.next_functions` for each intermediate prints the graph skeleton. Each operation has **one link per input**, and every link is exactly one of three things:

1. **Another backward node** — when the input was itself computed (e.g. `y_hat` links to `MulBackward0`).
2. **`AccumulateGrad`** — when the input is a leaf that `requires_grad`; it adds whatever arrives into the leaf's `.grad`.
3. **`None`** — when the input needs no gradient (`x`, `y`).

Nothing is differentiated yet: the forward pass also *saves the values the local rules will need* (`MulBackward` keeps `x` because ∂p/∂w = x; `PowBackward0` keeps `e` because ∂L/∂e = 2e).

## The backward rules table

`backward()` starts at the loss with ∂L/∂L = 1; each node multiplies the incoming gradient `g` by its local derivative and forwards the result:

| Node | Rule for incoming `g` | Sends (for the example) |
|---|---|---|
| `PowBackward0`, L = e² | `g·2e` toward e | 1·2(−3) = −6 |
| `SubBackward0`, e = ŷ − y | `g` toward ŷ | −6 |
| `AddBackward0`, ŷ = p + b | `g` toward both p and b | −6 and −6 |
| `MulBackward0`, p = wx | `g·x` toward w | −6·2 = −12 |

## The 60-line engine

```python
class Node:
    def __init__(self, name, rule, inputs):
        self.name = name
        self.rule = rule    # incoming gradient -> one per input
        self.next_functions = [t.grad_fn or t.accumulator
                               for t in inputs]

class AccumulateGrad:
    name = "AccumulateGrad"
    next_functions = []
    def __init__(self, leaf):
        self.leaf = leaf
    def rule(self, g):
        old = self.leaf.grad
        self.leaf.grad = g if old is None else old + g
        return []

class Scalar:
    def __init__(self, value, requires_grad=False):
        self.value, self.requires_grad = value, requires_grad
        self.grad = None
        self.grad_fn = None
        self.accumulator = AccumulateGrad(self) if requires_grad else None

    def __add__(self, other):
        return record("AddBackward", self.value + other.value,
                      [self, other], lambda g: [g, g])
    def __sub__(self, other):
        return record("SubBackward", self.value - other.value,
                      [self, other], lambda g: [g, -g])
    def __mul__(self, other):
        a, b = self.value, other.value   # saved for backward
        return record("MulBackward", a * b, [self, other],
                      lambda g: [g * b, g * a])

def record(name, value, inputs, rule):
    out = Scalar(value)
    if any(t.requires_grad for t in inputs):
        out.requires_grad = True
        out.grad_fn = Node(name, rule, inputs)
    return out

def backward(loss):
    order, seen = [], set()
    def visit(node):               # a node's inputs go first
        if node is not None and node not in seen:
            seen.add(node)
            for nxt in node.next_functions:
                visit(nxt)
            order.append(node)
    visit(loss.grad_fn)

    grads = {loss.grad_fn: 1.0}    # dL/dL = 1
    for node in reversed(order):   # the loss's node comes first
        g = grads.pop(node)        # every arrival, summed
        for nxt, g_in in zip(node.next_functions, node.rule(g)):
            if nxt is not None:
                grads[nxt] = grads.get(nxt, 0.0) + g_in
```

Key mechanics worth memorizing:

- **`record()` propagates `requires_grad`**: the output is tracked if *any* input is tracked — which is why frozen parameters (`requires_grad=False`) automatically drop their subtrees from the graph.
- **The lambdas are the saved-tensor mechanism**: `__mul__`'s `lambda g: [g*b, g*a]` closes over `a` and `b`; addition/subtraction capture nothing because their local derivatives are constant (1, −1).
- **`backward()` is two stages**: (1) a DFS that appends each node only after all nodes it sends gradients to, reversed into a **topological order**; (2) one walk of that order where each node's accumulated `g` is split by its local rule into the recipients' entries.
- **Multi-path summing is the chain rule**: for `s = a*a + a` at `a=3`, the multiply node sends 3 along each link and the add sends 1, `grads` sums them → `a.grad == 7.0`, matching PyTorch exactly.

## Verified gotchas this engine reproduces (and PyTorch's variants)

- **Gradient accumulation across calls**: calling `backward(L)` twice stores `-24.0` in `w.grad` because `AccumulateGrad` *adds*. PyTorch refuses the second call instead (saved tensors are freed after use → RuntimeError unless `retain_graph=True`), but after a fresh forward pass PyTorch accumulates the same way — this is precisely why training loops need `optimizer.zero_grad()`.
- **`e * e` vs `e ** 2`**: with `e * e` the Mul node links to the Sub node *twice*, and the summed arrivals (−3 + −3) reproduce the single-step `PowBackward0` result −6. Multiple paths through the same node are handled purely by summing.

## What the real PyTorch engine adds on top

| Concern | Real autograd |
|---|---|
| Data | Tensors; rules compute vector-Jacobian products without building Jacobians |
| Rules | Written once in `tools/autograd/derivatives.yaml`; C++ nodes generated from them |
| Scheduling | Link counting: run a node once all incoming gradients arrived (not recursive DFS) |
| Memory | Saved values freed as soon as backward consumes them |
| Safety | Per-tensor version counter → in-place mutation of a saved tensor raises instead of silently corrupting gradients |
| Off switch | `torch.no_grad()` records nothing — inference pays no graph memory |
| Extensibility | `torch.autograd.Function` to plug custom forward/backward rules into the real engine |

## Exercises (from the article)

1. Add `exp()` — its rule reuses the output value (d/dx eˣ = eˣ); check `exp(a*c)` at a=2, c=3 → `a.grad ≈ 1210.29` in both engines.
2. Accept plain numbers via `__rmul__`/`__rsub__` so `2 * w` works.
3. Run gradient descent on the toy model (forward → backward → update → reset grads) until `2w + b → 5`.

## References

- Original article: [How PyTorch's autograd works, rebuilt in 60 lines of Python](https://farid-alexander.github.io/autograd-from-scratch/)
- Engine source (MIT): [small_autograd.py on GitHub](https://github.com/farid-alexander/autograd-from-scratch/blob/main/small_autograd.py)
- Cross-check script: [check_with_pytorch.py](https://github.com/farid-alexander/autograd-from-scratch/blob/main/check_with_pytorch.py)
- Related in KB: [Why PyTorch KL Divergence Goes Negative](../../../explanations/aimachinelearning/trainingoptimization/explanation-stablekl-pytorch-kl-divergence-precision.md)
- Karpathy's prior art: [micrograd](https://github.com/karpathy/micrograd)
