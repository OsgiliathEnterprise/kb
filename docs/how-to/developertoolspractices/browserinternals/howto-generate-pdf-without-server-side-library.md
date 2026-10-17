---
title: Generate PDFs With window.print() and a Print Stylesheet Instead of a PDF Library
diataxis: How-to Guide
domain: developer-tools-practices
topic: browser-internals
source: DEV.to Tech News
source_url: https://dev.to/sheaf/i-almost-added-a-pdf-library-a-print-stylesheet-was-enough-5eha
date: 2026-10-17
keywords:
- knowledge-base
- browser-internals
- developer-tools-practices
- how-to
---
# Generate PDFs With window.print() and a Print Stylesheet Instead of a PDF Library

Every browser already ships a PDF renderer. Before adding a server-side PDF library (fonts, a render route, rate limits, and customer data flowing through your backend), try the lazy option: `window.print()` plus a print stylesheet.

## Step 1 — Build the document as normal HTML

The on-page preview is the document itself: a plain-HTML invoice (or time card, rate table, …). Nothing special is needed to make it printable.

## Step 2 — Add a print stylesheet

Hide everything except the document when printing:

```css
@media print {
  @page { margin: 14mm; }
  header, footer, form, .buttons { display: none !important; }
  .invoice { box-shadow: none; padding: 0; }
}
```

## Step 3 — Wire the button to window.print()

```js
document.querySelector("#download-pdf")
  .addEventListener("click", () => window.print());
```

The user clicks *Download PDF*, the print dialog opens, they pick **Save as PDF** — done. The browser handles font rendering, page breaks, and the file format. On phones the same path goes through the share sheet.

## Step 4 — Persist client-side only

If the tool should remember user details, save the form to `localStorage` — nothing leaves the browser.

## What this buys you

1. **Nothing to store means nothing to worry about.** No server route, no font management, no rate limiting, no customer names/addresses/amounts flowing through a backend.
2. **A promise you can keep.** "Your data stays in this browser" is true *by design*, not by policy — there is nowhere else for it to go.
3. **Cheap reuse.** The same pattern (plain HTML + a bit of JS + localStorage + print CSS) powered three tools (invoice generator, time-card calculator, hourly-rate calculator); each took an afternoon.

## Trade-offs to accept

- **You cannot control the browser's own page header/footer** (date and URL in the margins). Most browsers have a checkbox to hide them; acceptable for an invoice, not for pixel-exact brand output.
- The user must click through the print dialog once per download — no silent server-side file delivery.
- Complex layout (tables across pages, custom fonts with fallbacks) needs testing per browser.

## Decision rule

If the document is *already* HTML and the audience can click "Save as PDF", skip the PDF library. Add a real renderer (server-side or canvas-based) only when you need unattended generation, exact typography control, or non-HTML sources.

## Diagram

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {"id": "g1", "type": "rectangle", "x": 40, "y": 40, "width": 180, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#c4e0f2", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Form (HTML)\nlocalStorage persistence", "fontSize": 14, "fontFamily": 1}},
    {"id": "g2", "type": "rectangle", "x": 300, "y": 40, "width": 180, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#d9ccff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "On-page preview\n(normal HTML invoice)", "fontSize": 14, "fontFamily": 1}},
    {"id": "g3", "type": "rectangle", "x": 560, "y": 40, "width": 200, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#f9e0a3", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "window.print()\n@media print hides chrome", "fontSize": 14, "fontFamily": 1}},
    {"id": "g4", "type": "rectangle", "x": 300, "y": 200, "width": 180, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#cdeac0", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Print dialog\nuser picks 'Save as PDF'", "fontSize": 14, "fontFamily": 1}},
    {"id": "a1", "type": "arrow", "x": 220, "y": 75, "width": 80, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]]},
    {"id": "a2", "type": "arrow", "x": 480, "y": 75, "width": 80, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]]},
    {"id": "a3", "type": "arrow", "x": 660, "y": 110, "width": 180, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-180, 90]]}
  ]
}
```

## References

- [I almost added a PDF library. A print stylesheet was enough. — DEV.to](https://dev.to/sheaf/i-almost-added-a-pdf-library-a-print-stylesheet-was-enough-5eha) (primary source)
- [Free invoice generator demo (Sheaf)](https://sheaf.guestleaf.app/tools/invoice-generator)
