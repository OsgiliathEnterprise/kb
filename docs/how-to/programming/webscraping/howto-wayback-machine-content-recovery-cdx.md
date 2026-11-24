---
title: 'Recovering Text and Images from the Wayback Machine: id_ Snapshots and the
  CDX API'
diataxis: How-to Guide
domain: programming
topic: web-scraping
source: DEV.to Tech News
source_url: https://dev.to/waybackpress/getting-the-text-and-images-back-off-the-wayback-machine-and-what-it-wont-give-you-3pff
date: 2026-11-24
keywords:
- knowledge-base
- web-scraping
- programming
- how-to
---
# Recovering Text and Images from the Wayback Machine: id_ Snapshots and the CDX API

The one mental model that explains everything about Wayback recovery: **the archive stores URLs,
not sites**. A crawler visited URLs at intervals and saved "what it could carry," each stamped with
a date. A homepage may have hundreds of captures; an unlinked post may have zero. Text that was in
the crawled HTML is usually recoverable; an image the crawler never requested simply does not
exist in the archive, no matter how many times you reload.

## Recovering a single page's text

1. **Search by URL, not words.** The Archive's site search finds *homepages* by descriptive
   words; there is no full-text search across archived pages. If you remember a sentence but not
   the address, you cannot search your way to it — start from the URL.
2. **Read the calendar colors** to pick a capture:
   - **Blue** = normal page (HTTP 2xx) — what you want
   - **Green** = redirect, **Orange** = client error (404), **Red** = server error
3. **Strip the Archive toolbar with `id_`.** Insert `id_` after the snapshot timestamp:

   ```
   web.archive.org/web/<timestamp>id_/<original-url>
   ```

   This serves the raw capture without the injected toolbar and scripts — the cleanest HTML copy
   to lift text from.

## Recovering images (where people get stuck)

Images are **separate captures** from the page that embeds them. A page can be archived perfectly
while its images were never fetched: the `<img>` tag is in the HTML but the file behind it is not
in the Archive.

What works:

- Give each image's **original URL** to web.archive.org directly and check for its own blue dot.
  If it has a capture, download it from **its own** `id_` snapshot.
- Images referenced by absolute URL to the dead origin will never load — repoint them at the
  archived copies that exist.
- Common reasons a capture is incomplete: robots.txt rules, JavaScript-rendered assets, orphan
  pages the crawler never linked to.

## Bulk recovery with the CDX index

For more than a handful of pages, use the **CDX Server API**, which lists every capture of a
domain — one request returns a row per URL with timestamp and status code:

```
http://web.archive.org/cdx/search/cdx?url=example.com*&output=json&filter=statuscode:200
```

Scripted export pattern: filter to `statuscode:200`, iterate the latest capture per URL, fetch
each via its `id_` snapshot URL. A ready-made implementation of exactly this pattern
(dependency-free Python, MIT, HTML export only) is `pip install wayback-html-export`
→ `wayback-html-export example.com`, which keeps the latest good capture of each URL and writes a
`manifest.json` with every URL and its capture date.

## When manual recovery isn't worth it

If the archive holds the text but images/layout are scattered across incomplete captures (the
common case for older sites), hand-rebuilding becomes slow and fiddly — that's the economic break
point between DIY and a paid restore service. Try the manual route first: for a small site with
good captures it is usually sufficient.

## Decision checklist

- [ ] Every page URL listed via CDX (`statuscode:200` filter)
- [ ] Text taken from `id_` raw snapshots, not toolbar-wrapped pages
- [ ] Each image URL checked for its **own** capture; repoint `<img>` tags to archived copies
- [ ] Latest good capture per URL kept; capture dates recorded in a manifest
- [ ] Accept gaps where robots.txt/JS/orphans made capture impossible

## References

- Original article: [Getting the text and images back off the Wayback Machine](https://dev.to/waybackpress/getting-the-text-and-images-back-off-the-wayback-machine-and-what-it-wont-give-you-3pff) (DEV.to)
- CDX Server API source: [internetarchive/wayback wayback-cdx-server on GitHub](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)
- Bulk exporter: [wayback-html-export on PyPI](https://pypi.org/project/wayback-html-export/)
