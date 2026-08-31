---
title: p99 ~0 ms Autocomplete for 240M Domain Names (Trie + Memory-Mapped Index)
diataxis: How-to Guide
domain: programming
topic: data-structures
source: HackerNews
source_url: https://ruurtjan.com/articles/p99-0ms-autocomplete-for-240-million-domain-names
date: 2026-08-31
keywords:
- knowledge-base
- data-structures
- programming
- how-to
---
# p99 ~0 ms Autocomplete for 240M Domain Names (Wirewiki)

A case study in making a web autocomplete feel *instant* across 240 million domain names. The trick is to make the API response land **before the user releases the second key**, so perceived latency is zero at p99.

## Defining the latency budget

Latency is measured as `keyUp -> results ready for rendering`. On a 60 Hz display (16.7 ms/frame) you have roughly two key-press durations plus the gap between presses. Measured by typing 100 domain names fast: **p99 budget ~121 ms**.

The client-side trick that buys time:
- On `keyDown` (user starts pressing a key), **prefetch** suggestions for the typed char + any likely next char.
- On `keyUp`, **render** — by then the response is already in hand.

```jsonc
// GET /autocomplete?q=wi  -> returns current results AND precomputed next-char buckets
{
  "results": ["wikipedia.org", "windowsupdate.com", "..."],
  "next": {
    "-": ["wi-fi.ru", "wi-fi.org", ...],
    ".": ["wi.gov", "wi.us", ...],
    "a": ["wiadomosci.wp.pl", ...]
  }
}
```

## The two-tier data structure (head + tail)

Data sources: **Tranco** top-1M popular domains (the head, suggested first) and **CZDS** full gTLD domain lists (the tail). Results returned in rank order.

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "c1", "type": "rectangle", "x": 40, "y": 160, "width": 200, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Browser\nkeyDown -> prefetch q+next char\nkeyUp -> render", "fontSize": 14, "fontFamily": 1}}, {"id": "cdn", "type": "rectangle", "x": 300, "y": 160, "width": 200, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#fff3bf", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Cloudflare\nglobal edge cache\n(absorbs hot requests)", "fontSize": 14, "fontFamily": 1}}, {"id": "srv", "type": "rectangle", "x": 560, "y": 160, "width": 200, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#ffe8cc", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "nginx + API\nsingle EU server", "fontSize": 14, "fontFamily": 1}}, {"id": "head", "type": "rectangle", "x": 300, "y": 300, "width": 200, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "HEAD: in-memory char trie\ntop-8 per prefix\nO(len typed)", "fontSize": 14, "fontFamily": 1}}, {"id": "tail", "type": "rectangle", "x": 560, "y": 300, "width": 200, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#d9ccff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "TAIL: SSD mmap block index\nsorted+delta-compressed\nbinary-search 27MB dir + scan 1 block of 256", "fontSize": 14, "fontFamily": 1}}, [{"id": "a1", "type": "arrow", "x": 240, "y": 200, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [60, 0]]}, {"id": "a1_lbl", "type": "text", "x": 240, "y": 176, "width": 120, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a2", "type": "arrow", "x": 500, "y": 200, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [60, 0]]}, {"id": "a2_lbl", "type": "text", "x": 500, "y": 176, "width": 120, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a3", "type": "arrow", "x": 400, "y": 240, "width": 0, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 60]]}, {"id": "a3_lbl", "type": "text", "x": 400, "y": 216, "width": 120, "height": 20, "text": {"content": "search head first"}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a4", "type": "arrow", "x": 660, "y": 240, "width": 0, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 60]]}, {"id": "a4_lbl", "type": "text", "x": 660, "y": 216, "width": 120, "height": 20, "text": {"content": "then tail if needed"}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]]}
```
- **Head — in-memory character trie:** stores the precomputed top-8 suggestions for *every* prefix; a lookup is a walk of a few pointers. Worst case `O(len typed)`.
- **Tail — SSD-backed memory-mapped block index:** CZDS domains sorted and delta-compressed into fixed-size blocks with a tiny in-memory directory (~27 MB). A lookup binary-searches the directory, then linearly scans one 256-name block. ~240M names take ~2.5 GB on disk; hot pages stay cached by the OS. Worst case `O(len typed * log N)`.

Both query length and domain count are bounded, so both structures are effectively **O(1)** in practice — keeping p99 latency low.

## Measured results (LLM stress test: 720k keystroke queries from 60k simulated domains, open-loop replay)

- API alone answers most requests within **2 ms**.
- Through nginx at 1.6k req/s: **15 ms** at p99.
- End-to-end (browser -> Cloudflare -> server + ~10 ms) stays within the 121 ms budget even with 1000 concurrent typers — *for European traffic*. US traffic adds 100-200 ms and would exceed the budget; geo load-balancing across regions is what would close that gap (deliberately not built for a niche tool).

## Reusable lessons

1. **Prefetch on keyDown, render on keyUp** — hide network latency inside the human typing interval rather than fighting it.
2. **Precompute next-char buckets server-side** so one request covers multiple future keystrokes.
3. **Tier your data:** a small hot in-memory structure (trie) for the head + a compact mmap index for the long tail; both bounded -> effectively constant time.
4. **Let the CDN absorb hot paths** and measure end-to-end, not just API latency — network dominates once you're past ~10 ms of compute.

## References

- [p99 0 ms* autocomplete for 240M domain names (ruurtjan.com)](https://ruurtjan.com/articles/p99-0ms-autocomplete-for-240-million-domain-names)
