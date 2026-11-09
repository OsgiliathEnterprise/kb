---
title: 'PDF Compression Under the Hood: Flate Streams, CCITT Group 4, Object Streams,
  and Why Some Files Won''t Shrink'
diataxis: Explanation
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/usamafarooq/how-pdf-compression-works-under-the-hood-517j
date: 2026-11-08
keywords:
- knowledge-base
- frontend-javascript
- programming
- explanations
---
# PDF Compression Under the Hood: Flate Streams, CCITT Group 4, Object Streams, and Why Some Files Won't Shrink

A PDF is not one block of data — it is a **collection of numbered objects** (pages, fonts, images, each its own object) stitched together by a cross-reference table at the end of the file. Page text isn't stored as words but as a tiny drawing program ("use this font, place these glyphs here"). Because the pieces are separate, a compressor can apply **a different, matched method per piece** — which explains the central mystery of PDF sizes: why one file shrinks 80% and another barely moves.

## The three levers of PDF compression

1. **Compress each object's data with a matched algorithm** (the big win — see per-content-type table below).
2. **Delete invisible weight**: hidden layers, unused fonts, dead object versions, stale metadata. Every edit-and-save in many editors leaves the old version of each changed object in the file — a PDF edited ten times can carry ten versions of a page. This is why a freshly exported PDF is far smaller than the same doc after months of edits.
3. **Rewrite the structure tighter**: pack small objects so per-object overhead disappears.

## Per-content-type codecs

| Content | Filter / method | Lossy? | Notes |
| --- | --- | --- | --- |
| Text & vector drawing | **FlateDecode** = zlib/deflate (same engine as ZIP, public domain) | Lossless | Two passes: LZ77-style back-references for repeated phrases (PDF text is full of repeated words and drawing commands), then Huffman-style shortest codes for frequent symbols. Does most of the heavy lifting for non-image parts |
| Photos | **DCTDecode** = JPEG | Lossy at creation | Throws away detail the eye barely notices; re-compressing later only helps via *re-encode at lower quality / downsample / convert format* — where the big savings and the quality risk both live |
| Scanned B&W pages | **CCITT Group 4** | Lossless | Fax-line coding, extremely effective on sharp black-and-white lines |
| Line art / screenshots | Flate or another lossless method | Lossless | Keeps edges crisp |
| Small indirect objects + xref | **Object streams** (PDF 1.5+) | Lossless | Pre-1.5, every object was plain text with its own header — huge overhead across thousands of tiny objects. 1.5 packs small objects into one compressed stream and lets the xref table itself compress. Modern writers do this by default — one reason a modern-tool re-save beats an old-tool save before any image work |

## Why some PDFs won't shrink (and the right move instead)

- **Mostly text/vector** → deflate handles it; a lossless cleanup pass (Flate + drop unused fonts and dead objects) is usually enough, and cannot degrade anything visible.
- **Mostly photos/scans** → JPEG/CCITT already removed the redundancy; another lossless pass saves kilobytes and can even grow the file. The only lever that matters is image **downsampling** (150 DPI is plenty for screen) at medium-high JPEG quality.
- **Heavily edited** → the win is dead-object garbage collection, not compression strength.
- **Never run two high-strength lossy passes** — each throws away a little more image detail and the damage accumulates. Compress a copy, keep the original, check page by page (watch photos, gradients for banding, small text inside images).

## Diagnostic frame of reference

When a "compress my PDF" feature underdelivers, classify the file first: extract per-object filters (most PDF libraries expose each stream's `Filter` — FlateDecode/DCTDecode/CCITTFaxDecode) and size contributions. If DCTDecode streams dominate, a re-implemented deflate pass is wasted effort; ship resample/quality controls instead. This is the same reasoning behind browser-side PDF handling in this vault ([[Browser-Only PDF Processing with CSP Enforcement]]).

## References

- **DEV.to: How PDF Compression Works Under the Hood**: https://dev.to/usamafarooq/how-pdf-compression-works-under-the-hood-517j
- **Adobe PDF Reference (FlateDecode, filter registry)**: https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/
- **zlib/deflate (RFC 1950/1951)**: https://www.ietf.org/rfc/rfc1951.txt
