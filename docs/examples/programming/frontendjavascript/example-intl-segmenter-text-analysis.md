---
title: 'Text Analysis Without a Backend: Intl.Segmenter and ~400 Lines of JavaScript'
diataxis: Example
domain: programming
topic: frontend-javascript
source: DZone AI/ML
source_url: https://feeds.dzone.com/link/23558/17427684/text-analysis-without-backend
date: 2026-08-25
keywords:
- knowledge-base
- frontend-javascript
- programming
- examples
---
# Text Analysis Without a Backend: Intl.Segmenter and ~400 Lines of JavaScript

Six small text features (flag filler phrases, score sentence-length variation,
format a citation, check a document against a rubric) first lived behind an API
route calling a model. It worked in an afternoon — then got priced out. Every
keystroke left the machine, every click added ~900 ms, and two runs over
identical input returned different advice. The fix: rewrite all six as
**deterministic browser code**. No API route, no server, no network.

## When a heuristic is the right tool

A model is worth paying for when the task needs **world knowledge or
judgment** (is the argument coherent? is this claim supported?). A regex cannot
do that. But "does this text contain the phrase *in order to*?" is a **lookup**;
"How much do sentence lengths vary?" is **arithmetic**; "Should *of* be
capitalized in this title?" is a **written rule**. Sending those to a
probabilistic system buys latency and nondeterminism for nothing.

## Sentence segmentation without a regrettable regex

Splitting on `/[.!?]+\s+/` collapses on real prose:

```text
IN   : The file cost $3.50. It shipped on Jan. 5 anyway.
naive: ["The file cost $3.50", "It shipped on Jan", "5 anyway."]

IN   : He said "stop." Then he left.
naive: ["He said \"stop.\" Then he left."]
```

The browser ships an ICU-backed segmenter:

```javascript
const SEG = new Intl.Segmenter('en', { granularity: 'sentence' });
const raw = (text) =>
  [...SEG.segment(text)].map((s) => s.segment.trim()).filter(Boolean);
```

ICU gets the cases above right, plus `9 a.m.`, decimals, and section numbers
like `2.1`. It has one production failure worth knowing: it **breaks after
title abbreviations**:

```text
IN : She met Dr. Chen last week. The draft grew by 3.5 pages.
ICU: ["She met Dr.", "Chen last week.", "The draft grew by 3.5 pages."]
```

The repair is a **merge pass** over the output, not a rewrite of the splitter —
if a segment ends in a known title, glue the next one onto it:

```javascript
const TITLE_END = /(^|\s)(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|Fig|No)\.$/i;

function sentences(text) {
  return raw(text).reduce((out, part) => {
    const prev = out[out.length - 1];
    if (prev && TITLE_END.test(prev)) out[out.length - 1] = `${prev} ${part}`;
    else out.push(part);
    return out;
  }, []);
}
```

## The comparison, with numbers

| | LLM API route | Browser heuristic |
| --- | --- | --- |
| First response | 600–1,200 ms | under 5 ms |
| Marginal cost | ~$0.001 per run | zero |
| Same input, same output | no | yes |
| User text leaves device | yes | no |
| Works offline | no | yes |
| Handles novel phrasing | yes | no |
| Judges argument quality | yes | no |
| Ships without a backend | no | yes |

Six static pages on a CDN: no runtime to patch, no key to rotate, no bill that
scales with traffic.

## When to call the model anyway

1. The task needs **judgment** rather than lookup.
2. The user **asked** for it explicitly, with the data boundary stated in plain
   language on the button.
3. The **output gets checked** — constrain the response with a schema and
   validate it before it touches the UI, because a model that returns prose
   where your parser expects an object will do it on a Friday.

Everything else stayed in the browser: six features, ~400 lines of JavaScript
total, zero infrastructure, and a p99 that is a rounding error.

## Browser support

`Intl.Segmenter` is **Baseline 2024** on MDN — supported across the latest
browser releases since April 2024 (all modern evergreen browsers; older
Safari/Firefox versions need a feature check or a regex fallback). It is part
of the TC39 `Intl.Segmenter` proposal, backed by ICU's locale-sensitive
segmentation, so behavior follows the Unicode collation/segmentation rules for
the chosen locale — which is also why the title-abbreviation failure mode is
locale-dependent rather than random.

## References

- [Text Analysis Without a Backend (DZone)](https://dzone.com/articles/text-analysis-without-backend)
- [Intl.Segmenter (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
- [TC39 proposal-intl-segmenter](https://github.com/tc39/proposal-intl-segmenter)
