---
title: 'DSPy Compiled Programs Re-Send Few-Shot Demos on Every Call: Hidden Per-Call
  Token Overhead'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Engineering
source: DEV.to (wartzarbee)
source_url: https://dev.to/wartzarbee/your-compiled-dspy-program-re-sends-up-to-20-few-shot-demos-on-every-single-call-3a74
date: 2026-08-22
keywords:
- knowledge-base
- AI-Engineering
- AI-Infrastructure
- explanations
---
# DSPy Compiled Programs Re-Send Few-Shot Demos on Every Call

## The Hidden Cost

DSPy's optimizer (`BootstrapFewShot`) bootstraps few-shot demonstrations and **pins them onto each predictor**. The default configuration attaches **up to 20 demos per predictor**:

```python
# dspy/teleprompt/bootstrap.py
def __init__(self, ..., max_bootstrapped_demos=4, max_labeled_demos=16, ...):
```

- **4 bootstrapped demos** — full input→output traces, including chain-of-thought rationale
- **up to 16 labeled examples** (raw trainset examples)

Cross-referenced against [DSPy's official docs](https://dspy.ai/diving-deeper/bootstrap-fewshot-family/): the default `max_bootstrapped_demos=4` + `max_labeled_demos=16` gives 4 bootstrapped + up to 12 raw per predictor — the raw demos act as ballast against bootstrap overfitting.

## Why Every Call Pays for Them

On every inference, the module hands **all** attached demos to the adapter:

```python
# dspy/predict/predict.py
demos = kwargs.pop("demos", self.demos)
```

`self.demos` is the full set the optimizer attached. There is no "use them for the first call only" — each `forward()` defaults to sending the whole list. The adapter turns every demo into a **pair of chat messages** (user turn + assistant turn) prepended ahead of the real input:

```python
# dspy/adapters/base.py — format()
messages.append({"role": "system", "content": system_message})
messages.extend(self.format_demos(signature, demos))
```

So a predictor compiled with 12 demos prepends **24 messages to every call**. Because bootstrapped demos carry the full reasoning trace, those messages are not small. This is fixed overhead paid on request #1 and request #1,000,000 alike — and it is invisible in source code, because *the optimizer* wrote those messages, not you.

## Composition Multiplies It

A real DSPy program is several modules — a couple of `ChainOfThought` steps, a retriever-reader, a router. Each is a predictor, each gets its own demo set, each re-sends it on every call:

```
per-call overhead ≈ demos_per_predictor × predictors × (avg demo size)
```

Compile a 4-module pipeline with defaults and you can be prepending **60–80 demo messages** across the pipeline for a single end-user request — none of which appear anywhere in your source.

## The Fix: Set the Demo Budget On Purpose

```python
from dspy.teleprompt import BootstrapFewShot

optimizer = BootstrapFewShot(metric=my_metric,
                             max_bootstrapped_demos=2,
                             max_labeled_demos=2)
compiled = optimizer.compile(program, trainset=trainset)
```

Then verify what actually got attached before shipping:

```python
for p in compiled.predictors():
    print(len(p.demos))   # how many few-shot pairs ride along on every call
```

## Measure Before Arguing

Price one real run of the *compiled* program instead of guessing. Options referenced by the author:

- `@wartzar-bee/tokenscope` — prices each bucket (input, output, cache-write ~1.25×, cache-read ~0.1×) into an actual per-run cost
- `wartzar-bee/ci-guardrail` — a GitHub Action that fails CI when a run crosses an absolute `max-usd` ceiling, so a recompile that bumps the demo count can't ship as a silent 3× cost increase:

```yaml
- uses: wartzar-bee/ci-guardrail@v1
  with:
    max-usd: "0.50"
```

## Per-Call Overhead Diagram

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "optimizer",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 220, "height": 90,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "BootstrapFewShot\nmax_bootstrapped_demos=4\nmax_labeled_demos=16\npins demos onto predictors", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "predictors",
      "type": "rectangle",
      "x": 340, "y": 40,
      "width": 220, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "compiled program\nN predictors x up to 20 demos\neach self.demos persists\nacross ALL calls", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "call",
      "type": "rectangle",
      "x": 340, "y": 200,
      "width": 220, "height": 90,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "every forward() call\nformats demos -> user+assistant\nmessage PAIRS prepended\nfixed overhead xN per call\ninvisible in source code", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "fix",
      "type": "rectangle",
      "x": 40, "y": 200,
      "width": 220, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "FIX: budget on purpose\nmax_bootstrapped_demos=2\nmax_labeled_demos=2\naudit: len(p.demos) per\npredictor after compile", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "x": 260, "y": 85,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-2",
      "type": "arrow",
      "x": 450, "y": 130,
      "width": 0, "height": 70,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    },
    {
      "id": "arrow-3",
      "type": "arrow",
      "x": 340, "y": 245,
      "width": 80, "height": 0,
      "strokeColor": "#30665c",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [-80, 0]]
    }
  ]
}
```

## Key Insight

> This isn't a bug — it's that the *number of demos re-sent per call* is a decision the optimizer makes for you, and the default is generous.

The demo count is a **per-call cost lever**, not a one-time tuning cost. Treat `max_bootstrapped_demos` / `max_labeled_demos` as a budget you choose deliberately, and audit `predictor.demos` after every compile.

## References

- [Your compiled DSPy program re-sends up to 20 few-shot demos on every single call — DEV.to](https://dev.to/wartzarbee/your-compiled-dspy-program-re-sends-up-to-20-few-shot-demos-on-every-single-call-3a74)
- [DSPy: BootstrapFewShot family (official docs)](https://dspy.ai/diving-deeper/bootstrap-fewshot-family/)
- [DSPy: BootstrapFewShot API reference](https://dspy.ai/api/optimizers/BootstrapFewShot/)
