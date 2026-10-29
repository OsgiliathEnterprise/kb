---
title: 'Why Social Link Previews Break: Open Graph and Twitter Card Pitfalls'
diataxis: Explanation
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/mog/i-built-a-free-tool-to-check-open-graph-tags-across-a-whole-site-nnp
date: 2026-10-29
keywords:
- knowledge-base
- frontend-javascript
- programming
- explanations
---
# Why Social Link Previews Break: Open Graph and Twitter Card Pitfalls

## Why this matters now

X (formerly Twitter) retired its Card Validator. The old `cards-dev.twitter.com/validator` link now redirects to the X login page, and submitting a URL there just responds: **"Card preview has moved to Tweet Composer."** There is no longer a quick, login-free way to see how a link will render before you post it — which makes it harder to catch broken previews before they spread.

## The core tags

Most sites control their link previews with a handful of tags:

```html
<meta property="og:title" content="My Blog Post">
<meta property="og:description" content="A description of the post">
<meta property="og:image" content="https://example.com/preview.png">

<meta name="twitter:card" content="summary_large_image">
```

The setup looks straightforward, but each platform handles the metadata differently — so the gotchas are platform-specific.

## Platform-specific gotchas

| Pitfall | What happens |
| --- | --- |
| **Relative `og:image` URL** | `/preview.png` works in your browser but breaks on every platform — scrapers need an absolute URL. It has to be a full `https://` URL. |
| **Image too heavy for WhatsApp** | X accepts images up to **5 MB**, but WhatsApp drops anything over **600 KB** and shows a preview with no image. A card that passes X can still look broken on WhatsApp. |
| **No large image on Discord** | Discord only shows the big image when `twitter:card` is `summary_large_image`, even though it otherwise reads your Open Graph tags. |
| **Stale cached preview after a fix** | Platforms cache previews. After fixing a card, share the URL with `?v=2` appended to force a fresh fetch. |

None of these are hard to fix individually once you know about them.

## The problem multiplies at scale

The hard part is catching them all. Checking one URL is quick, but the problems that matter tend to **repeat across a site**:

- a template that never sets `og:image`,
- blog posts that all share the homepage's image,
- headlines that get cut off on every product page.

The practical approach is therefore to **bulk-check every page's Open Graph and X tags and compare them**, looking for: broken or missing images, pages sharing the same image or description, and titles that get truncated. (One concrete option is the author's bulk checker at ogimage.info — first 10 pages free — but any tool or script that crawls the site and diffs the tags per page works; the metadata facts above are what you're validating.)

## Per-platform limits (2026 cross-check)

A 2026 per-platform cheat-sheet cross-check confirms and extends the article's numbers:

| Platform | Recommended image | Max file size | Cache / gotchas |
|---|---|---|---|
| Facebook | 1200×630 (1.91:1) | 8 MB | minimum 200×200; warning below 600×315 |
| LinkedIn | 1200×627 (1.91:1) | 5 MB | **7-day cache** — use Post Inspector to force a re-scrape |
| X (large image) | 1200×675 (16:9) | 5 MB | crops 1200×630 top/bottom to 16:9; max 4096×4096 |
| Slack | 1200×630 | 5 MB | 24-hour cache; image response must carry a valid `Content-Type` |
| Discord | 1280×640 (2:1) | 8 MB | **defaults to an 80×80 thumbnail** — only `twitter:card=summary_large_image` reliably triggers the large embed; older desktop clients reject WebP |
| iMessage | 1200×630 | 5 MB | square-crops on the lock screen — keep key content centered |
| WhatsApp | 1200×630 | ~300 KB **soft cap** | images above the cap are silently downgraded or skipped; `og:image` must be absolute **HTTPS** (HTTP is silently ignored) |
| Telegram | 1200×630 | 5 MB | honors `og:image:width`/`og:image:height` for layout before download |

Notes on the article's own numbers:

- The **600 KB WhatsApp hard-drop** reported by the article's measurements is consistent with the ~300 KB *soft* cap in the 2026 platform guides: treat anything above ~300 KB as at-risk, and 600 KB as the point where it reliably breaks.
- **Universal default:** one 1200×630 PNG (1.91:1) under 1 MB, key content in the **center 66%** (every platform crops the edges differently). X is the exception that prefers 1200×675 (16:9).
- **Formats:** PNG for anything with text, JPEG for photos; **skip WebP and AVIF** — some Slack and Discord clients reject WebP, and AVIF is not widely supported by unfurlers yet.
- **Discord's thumbnail trap** is the single most common "my OG image is wrong" report: ship `twitter:card=summary_large_image` (even though the tag is named for a different platform), and edit/repost the link to bust Discord's CDN cache.

## References

- [I built a free tool to check Open Graph tags across a whole site (DEV.to)](https://dev.to/mog/i-built-a-free-tool-to-check-open-graph-tags-across-a-whole-site-nnp) — the source article (X validator retirement, per-platform limits, caching behavior)
- [Open Graph protocol (ogp.me)](https://ogp.me/) — the official tag reference
- [env.dev: OpenGraph Image Sizes 2026 — per-platform cheat sheet](https://env.dev/guides/opengraph-image-sizes)
