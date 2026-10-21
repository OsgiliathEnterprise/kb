---
title: 'Offline PDF OCR on Android with Zero INTERNET Permission: Structural Offline
  Guarantees, Asset Delivery, and PDF Text Layers'
diataxis: Explanation
domain: programming
topic: android
source: DEV.to Tech News
source_url: https://dev.to/securepdfeditor_7a1b7f42c/how-we-built-pdf-ocr-with-zero-internet-permission-on-android-3ikm
date: 2026-10-21
keywords:
- knowledge-base
- android
- programming
- explanations
---
# Offline PDF OCR on Android with Zero INTERNET Permission: Structural Offline Guarantees, Asset Delivery, and PDF Text Layers

Architecture deep-dive from the VaultPDF team (`com.securepdfeditor.pro` v2.0.1): an Android PDF editor where scanned PDFs become searchable and rebuildable into editable documents, **entirely on device, with no INTERNET permission at all**.

## "No INTERNET permission" is an artifact property, not a promise

Most "offline" claims are *behavioral* (the app says it doesn't upload). A *structural* claim means the app manifest cannot grant the permission. The manifest strips it at merge time:

```xml
<uses-permission android:name="android.permission.INTERNET" tools:node="remove" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" tools:node="remove" />
```

Every release bundle is checked with `aapt2 dump permissions`, and **the release is blocked if `INTERNET` reappears through a transitive dependency**. Users can verify without trusting the vendor: Settings → Apps → VaultPDF → Permissions shows no network entry.

This turns OCR into a *delivery* problem before it is a recognition problem.

## Getting 254 MB of models onto a device that never downloads

Cloud APIs, runtime language packs, and "download model on first launch" are all dead on arrival. The solution: **Play Asset Delivery** — Google Play performs the transfer, the app itself still has zero network capability. They ship exactly one **install-time** pack (`ocr_models`, ~254 MB):

| Asset | Size | Role |
| --- | --- | --- |
| `layout.onnx` | 214 MB | PP-DocLayoutV2 page layout analysis |
| `rec.onnx` | 21.2 MB | PP-OCRv6 text recognition |
| `rec_korean.onnx` | 13.5 MB | Korean recognition |
| `det.onnx` | 9.9 MB | text detection |
| `table.onnx` | 7.8 MB | SLANet+ table structure |

Install-time means models are present at first launch: no "OCR is still downloading" state, no first-run network dependency.

Key distinction: **0-INTERNET does not mean the device never touches the network** — it means the *app* has no network capability and distribution is delegated to Play. That's the honest version of the claim.

## Why not ML Kit

ML Kit answers "what text is in this image?" A PDF editor needs more: layout classes (body, title, table, figure, formula, header, footer), table structure (rows/columns/cells), reading order for multi-column pages, PDF object reconstruction (invisible text layers, editable text objects, table grids), and CJK-safe search/copy/editing. ML Kit solves a smaller problem than the one a PDF editor has.

## Searchable vs editable: two different outputs

The recognition result is not the product — the product question is **how the text gets written back into the PDF**:

- **Searchable mode (default):** original scan untouched. Text objects added with `renderMode=3` — invisible but searchable and copyable (same idea as Acrobat's "Searchable Image").
- **Editable mode:** a *new* document generated from visible text objects, table lines, and cell text. The original file is never mutated in place.

Their early failure was drawing visible OCR text on top of a page that still contained the scan, so both texts printed over each other. The fix was **semantic separation**, not coordinate tuning:

- searchable = original image + invisible text
- editable = new document + visible reconstructed text
- the two live as separate documents; the user switches between them

That also removes the worst failure mode of editable OCR: **a bad rebuild can never destroy the original scan.**

## OCR changes what redaction has to mean

Before OCR, a scanned page is pixels. After OCR, it may contain a hidden text layer. Drawing a black rectangle over the pixels leaves the text underneath still searchable and copyable. Real redaction must remove **both** the visible content and the text layer — the suite includes a test for it (`searchablePdfWriter_ocrTextIsRemovedByErase`).

## The CJK bug that taught them the most: Kangxi radical substitution

Their custom `libpdfium.so` ToUnicode CMap behavior stored some ideographs that share shapes with Kangxi radicals as radical codepoints:

- `高 (U+9AD8)` came back as `⾼ (U+2FBC)`
- `白` as `⽩`
- `力` as `⼒`

One root cause surfaced as three separate product bugs. Lesson: when building on a PDF library's text-extraction path, diff extracted codepoints against expected Unicode, not just against "looks right."

## References

- [How We Built PDF OCR with Zero INTERNET Permission on Android (DEV.to)](https://dev.to/securepdfeditor_7a1b7f42c/how-we-built-pdf-ocr-with-zero-internet-permission-on-android-3ikm)
- [Google Play Asset Delivery](https://developer.android.com/guide/playcore/asset-delivery)
