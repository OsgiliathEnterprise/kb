---
title: 'DSPy compiled programs: set the few-shot demo budget on purpose (hidden per-call
  token overhead)'
diataxis: How-to Guide
domain: AI-Infrastructure
topic: AI-Frameworks
source: DEV.to Tech News
source_url: https://dev.to/wartzarbee/your-compiled-dspy-program-re-sends-up-to-20-few-shot-demos-on-every-single-call-3a74
date: 2026-08-21
keywords:
- knowledge-base
- AI-Frameworks
- AI-Infrastructure
- how-to
---
# DSPy Compiled Programs: The Per-Call Demo Overhead Nobody Puts a Number On

## Summary
DSPy's pitch is that you stop hand-writing prompts and let an optimizer **compile** them. You write a program out of modules, hand it a metric and a trainset, run a teleprompter, and it finds good few-shot examples for each step. The part the tutorials skip is what "found good few-shot examples" costs — **not once, but on every single call** your compiled program makes in production. This note explains the mechanism and gives the exact knobs to set the demo budget deliberately instead of inheriting the generous default.

## Why the overhead is invisible
- Compiling with the **default optimizer** bootstraps few-shot demonstrations and **pins them onto each predictor**:
  ```python
  # dspy/teleprompt/bootstrap.py
  def __init__(self, ..., max_bootstrapped_demos=4, max_labeled_demos=16, ...):
  ```
  That is **up to 20 demos per predictor** by default — 4 **bootstrapped** (full input→output traces, including the chain-of-thought rationale) plus up to 16 **labeled** examples. They live on the compiled program, **not** in any prompt string you wrote.
- On **every** inference the module hands **all** of them to the adapter:
  ```python
  # dspy/predict/predict.py
  demos = kwargs.pop("demos", self.demos)
  ```
  `self.demos` is the full set the optimizer attached. There is **no "use them for the first call only"** — each `forward()` defaults to sending the whole list.
- The adapter turns **every demo into a pair of chat messages** (a user turn + an assistant turn) and appends all of them ahead of your real input:
  ```python
  # dspy/adapters/base.py — format()
  messages.append({"role": "system", "content": system_message})
  messages.extend(self.format_demos(signature, demos))
  # per complete demo:
  messages.append({"role": "user",      "content": self.format_user_message_content(signature, demo)})
  messages.append({"role": "assistant", "content": ...})
  ```
  So a predictor compiled with 12 demos **prepends 24 messages to every call**. Because bootstrapped demos carry the full reasoning trace, those messages are not small.

## It multiplies across a multi-module pipeline
DSPy's whole point is **composition**: a pipeline is several modules (a couple of `ChainOfThought` steps, a retriever-reader, a router). Each is a predictor, each gets its **own** demo set, and each re-sends it on every call. The per-call prompt overhead is roughly:

```
demos_per_predictor × predictors × (each demo is not cheap because the rationale is long)
```

Compile a **4-module** pipeline with the defaults and you can be **prepending 60–80 demo messages** across the pipeline for a single end-user request — **none of which appear anywhere in your source**.

## How to set the knob on purpose
This is not a bug and not a strawman: DSPy hands you the lever **at compile time**. Choose the demo budget instead of inheriting 4 + 16:

```python
from dspy.teleprompt import BootstrapFewShot

optimizer = BootstrapFewShot(metric=my_metric,
                             max_bootstrapped_demos=2,
                             max_labeled_demos=2)
compiled = optimizer.compile(program, trainset=trainset)
```

**Check what actually got attached before you ship it:**

```python
for p in compiled.predictors():
    print(len(p.demos))   # how many few-shot pairs ride along on every call
```

## Measure it before you argue about it
Before tuning anything, put a **dollar figure** on one real run of the *compiled* program — priced, not guessed.
- [`@wartzar-bee/tokenscope`](https://www.npmjs.com/package/@wartzar-bee/tokenscope) (`npm i @wartzar-bee/tokenscope`) takes real usage and prices each bucket — input, output, cache-write (~1.25×), cache-read (~0.1×) — into an actual **per-run cost**, so "the compiled pipeline costs N× the zero-shot one" stops being a hunch.
- If it runs in CI, **gate it**: [`wartzar-bee/ci-guardrail`](https://github.com/wartzar-bee/ci-guardrail) is an Apache-2.0 GitHub Action (built on tokenscope) that **fails the check when a run crosses an absolute `max-usd` ceiling**, so a recompile that bumps the demo count does not ship as a silent 3× before anyone notices:
  ```yaml
  - uses: wartzar-bee/ci-guardrail@v1
    with:
      max-usd: "0.50"
  ```

## The lesson
The point is **not** "DSPy is expensive." The point is that the **number of demos re-sent per call is a decision the optimizer makes for you, and the default is generous.** If you run compiled DSPy programs, ask: how many demos are on each predictor, and how long is each one? Price one real run before the next invoice does it for you.

## Per-Call Overhead Diagram (Excalidraw)
```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "title",
      "type": "rectangle",
      "x": 140, "y": 20,
      "width": 480, "height": 44,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "DSPy compiled program: hidden per-call demo overhead", "fontSize": 16, "fontFamily": 1 }
    },
    {
      "id": "default",
      "type": "rectangle",
      "x": 80, "y": 110,
      "width": 240, "height": 90,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "default optimizer\nmax_bootstrapped_demos=4\nmax_labeled_demos=16\n= up to 20 demos / predictor\n(re-sent EVERY call)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "pipeline",
      "type": "rectangle",
      "x": 360, "y": 110,
      "width": 280, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#fff3b0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "4-module pipeline (default)\n~60-80 demo messages\nprepended per request\nnone visible in source", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "knob",
      "type": "rectangle",
      "x": 80, "y": 260,
      "width": 240, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "set it on purpose\nBootstrapFewShot(metric,\n  max_bootstrapped_demos=2,\n  max_labeled_demos=2)\ninspect: for p in compiled.predictors(): len(p.demos)", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "measure",
      "type": "rectangle",
      "x": 360, "y": 260,
      "width": 280, "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "price one real run (not a guess)\ntokenscope: input/output/\ncache-write ~1.25x / cache-read ~0.1x\nci-guardrail: fail if run > max-usd", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "arrow-default-pipeline",
      "type": "arrow",
      "x": 320, "y": 155,
      "width": 40, "height": 0,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [40, 0]]
    },
    {
      "id": "arrow-default-knob",
      "type": "arrow",
      "x": 200, "y": 200,
      "width": 0, "height": 60,
      "strokeColor": "#30665c",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 60]]
    },
    {
      "id": "arrow-pipeline-measure",
      "type": "arrow",
      "x": 500, "y": 200,
      "width": 0, "height": 60,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 60]]
    }
  ]
}
```

## References
- [dev.to — Your compiled DSPy program re-sends up to 20 few-shot demos on every single call](https://dev.to/wartzarbee/your-compiled-dspy-program-re-sends-up-to-20-few-shot-demos-on-every-single-call-3a74) (wartzarbee, 2026-08-21)
- [DSPy — BootstrapFewShot optimizer API](https://dspy.ai/api/optimizers/BootstrapFewShot/)
- [@wartzar-bee/tokenscope (npm)](https://www.npmjs.com/package/@wartzar-bee/tokenscope)
- [wartzar-bee/ci-guardrail (GitHub, Apache-2.0)](https://github.com/wartzar-bee/ci-guardrail)
