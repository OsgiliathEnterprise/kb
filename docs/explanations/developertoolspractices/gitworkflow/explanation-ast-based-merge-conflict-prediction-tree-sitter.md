---
title: AST-Based Merge Conflict Prediction — Symbols Are the Right Unit, Not Lines
diataxis: Explanation
domain: developer-tools-practices
topic: git-workflow
source: DEV.to Tech News
source_url: https://dev.to/muhammad_abdullahshah_96/i-built-a-merge-conflict-predictor-that-ignores-lines-and-reads-the-ast-instead-38fh
date: 2026-10-04
keywords:
- knowledge-base
- git-workflow
- developer-tools-practices
- explanations
---
# AST-Based Merge Conflict Prediction — Symbols Are the Right Unit, Not Lines

Git's definition of a merge conflict is narrower than it should be. Two branches change the same *lines* → conflict. Two branches touch the same *function* from different files and never collide on lines → git merges cleanly and congratulates you. Then production breaks. That "clean" merge is the dangerous one: one person refactors a function while another adds a call to it, the merge goes through without a peep, and the bug report arrives a week later.

The fix in the PRISM project (an AI-powered git time machine) is a conflict predictor built on one idea: **lines are the wrong unit; symbols are better.**

## The approach

1. Parse the merge-base and both branch heads into ASTs with **tree-sitter**.
2. Extract the symbols — functions, classes, methods.
3. Flag overlap between the two sides: both branches touching the same symbol is risk, *even across different files*.
4. Saturate the score so one hot file cannot dominate the whole prediction.

It's exposed as `POST /repos/{id}/predict-conflict`, with a branch-compare UI showing a risk bar and the overlapping symbols listed — so the number is inspectable instead of magic. The predictor answers exactly one narrow question: *did these two branches step on the same symbols?* That is cheap to answer, and it catches precisely the class of breakage git itself cannot see. It does not replace tests or review; a planned next step is semantic code ownership with embeddings, which should catch cases where even symbol names diverge.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "mc1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 230,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "merge-base + both heads\\n→ tree-sitter ASTs\\nextract symbols (fn/class/method)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "mc2",
      "type": "rectangle",
      "x": 350,
      "y": 40,
      "width": 260,
      "height": 130,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "symbol overlap between sides\\nincluding across files\\nscore saturates per hot file", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "mc3",
      "type": "rectangle",
      "x": 690,
      "y": 40,
      "width": 280,
      "height": 130,
      "strokeColor": "#c0392b",
      "backgroundColor": "#f5b7b1",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "POST /repos/{id}/predict-conflict\\nrisk bar + overlapping symbols listed\\ninspectable, not magic", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "mc4",
      "type": "rectangle",
      "x": 690,
      "y": 230,
      "width": 280,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#b2f2ef",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "grammar missing?\\ndegrade to line-level scoring\\n(demo → tool)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "mc5",
      "type": "arrow",
      "x": 270,
      "y": 105,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "mc6",
      "type": "arrow",
      "x": 610,
      "y": 105,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "mc7",
      "type": "arrow",
      "x": 830,
      "y": 170,
      "width": 0,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [0, 60]]
    }
  ]
}
```

## The unglamorous parts took most of the time

Two engineering details are what separate a demo from a tool:

- **Missing grammar packages.** Tree-sitter grammar packages aren't always installed on the machine. The first version crashed when one was missing — which made it a demo, not a tool. Now the service degrades to line-level scoring when a grammar is absent.
- **Method detection inside class bodies** broke twice before the tree-sitter queries finally caught it. Queries for methods are fiddlier than function queries (methods live nested in class scopes).

Test state at shipping: 9 new tests, 39 passing overall.

## Why this matters for review workflows

Line-based conflict detection answers "did we touch the same text?" — a question that is easy to satisfy and easy to pass while still breaking behavior. Symbol-level overlap answers "did we change the same *thing*?", which is what actually predicts breakage from refactors, call-site additions, and cross-file edits. The cost of the check (parse + set intersection) is trivial compared to a week-later bug report, so it fits naturally into pre-merge CI or branch-compare UIs as an advisory signal — cheap enough to run on every merge request, specific enough that a reviewer can act on the listed symbols instead of trusting a score.

## References

- [I built a merge-conflict predictor that ignores lines and reads the AST instead (DEV.to)](https://dev.to/muhammad_abdullahshah_96/i-built-a-merge-conflict-predictor-that-ignores-lines-and-reads-the-ast-instead-38fh)
- [tree-sitter — incremental parsing for programming tools](https://tree-sitter.github.io/tree-sitter/)
