---
title: How to Eradicate Slow TTFB with Streaming SSR in Next.js (React Suspense +
  App Router)
diataxis: How-to Guide
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/iprajapatiparesh/eradicating-slow-ttfb-streaming-ssr-in-nextjs-22dm
date: 2026-09-18
keywords:
- knowledge-base
- frontend-javascript
- programming
- how-to
---
# How to Eradicate Slow TTFB with Streaming SSR in Next.js (React Suspense + App Router)

Traditional SSR is **all-or-nothing**: the server sends zero HTML until *every* data fetch completes. If a dashboard's header takes 50 ms but its revenue chart takes 3 s, the user stares at a blank screen for 3 s — TTFB and FCP are destroyed even though 90% of the page was ready instantly. Streaming SSR breaks this by flushing HTML in chunks over `Transfer-Encoding: chunked`, using React `<Suspense>` boundaries as flush points.

## Goal

Decouple **TTFB from your slowest query**: TTFB becomes "time to render the static shell" (layout + fast data), while slow sections stream into the same open HTTP connection later, replacing skeleton fallbacks without a full re-hydration pass.

## Prerequisites

- Next.js App Router (`app/` directory) with React Server Components enabled.
- A page where at least one section is significantly slower than the rest (the classic dashboard case).

## Procedure

### Phase 1 — Isolate slow data into async Server Components

Each slow fetch becomes its own **async RSC**. Because it's a server component, it blocks *its own* render only; with Suspense it will not block the page.

```tsx
// app/components/RevenueChart.tsx
import { db } from '@/lib/db';

export default async function RevenueChart() {
  // Slow aggregation (3s in this example) — suspends, doesn't block the page
  const revenueData = await db.query('SELECT sum(amount) FROM massive_ledger');
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h3>Annual Revenue Aggregation</h3>
      <div>${revenueData.total.toLocaleString()}</div>
    </div>
  );
}
```

### Phase 2 — Build the streaming page shell with Suspense boundaries

Fetch fast data directly in the page; wrap each slow component in its own `<Suspense>` boundary with a polished fallback. Next.js flushes everything above/around the boundaries immediately, then streams each resolved boundary into the open connection.

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import RevenueChart from '@/app/components/RevenueChart';
import FastProfileWidget from '@/app/components/FastProfileWidget';
import RevenueSkeleton from '@/app/components/RevenueSkeleton';

export default async function DashboardPage() {
  const userProfile = await fetchFastProfileData(); // ~50ms, flushed first
  return (
    <main>
      <header><h1>Enterprise Overview</h1></header>
      <FastProfileWidget user={userProfile} />
      {/* Suspense boundary: skeleton now, chart HTML streamed later */}
      <Suspense fallback={<RevenueSkeleton />}>
        <RevenueChart />
      </Suspense>
    </main>
  );
}
```

### Phase 3 — Match skeleton geometry to prevent CLS

The fallback must match the final component's **dimensions exactly**. A 100 px skeleton replaced by a 400 px chart causes Cumulative Layout Shift. Reserve the same height/width in the skeleton:

```tsx
// app/components/RevenueSkeleton.tsx
export default function RevenueSkeleton() {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
        {/* matching the exact geometry of the real component */}
      </div>
    </div>
  );
}
```

## Why this works (the mechanics)

- **Chunked transfer**: the server opens one HTTP response and keeps it open; each resolved boundary appends a chunk containing finished HTML that replaces the skeleton in-place.
- **Parallel fetching**: independent Suspense boundaries run their queries concurrently on the Node.js server — three widgets of 2 s / 3 s / 4 s resolve in ~4 s total, not 9 s.
- **No hydration overhead for streamed content**: the streamed HTML is inserted directly; React hydrates incrementally rather than re-running a full blocking pass.

## Pitfalls (cross-referenced with official docs and field reports)

1. **Awaiting at layout/page top kills streaming.** If you `await` slow data above all boundaries, nothing streams — push the await *into* the component inside the boundary.
2. **Don't wrap fast work.** A fetch that reliably finishes in &lt;~50 ms gains more from boundary overhead than it saves; measure first.
3. **LCP placement matters**: if your LCP element sits inside a Suspense fallback, you've actively delayed it — keep LCP content above the fold and outside boundaries.
4. **Below-the-fold sections** rarely benefit from Suspense (the user won't see them for hundreds of ms anyway); lazy-load non-critical widgets instead.
5. **Reverse proxies buffer chunks**: nginx defaults will swallow streaming; `proxy_buffering off; proxy_cache off;` is required to actually observe chunked delivery.
6. **Errors after the shell flush can no longer change the HTTP status code** — pair boundaries with segment-level `error.tsx`.
7. **Streaming breaks `<head>` (SEO/social previews)** — HTML is linear: once the shell (with `<head>`) flushes, late metadata can't be rewound. See the streaming-SEO section below.

## The streaming `<head>` problem and bot-aware streaming (Next.js 15/16)

Streaming SSR trades TTFB against `<head>` completeness. Frameworks pick one of four strategies: **Block** (wait for all data), **First-Flush** (head locked after first chunk, late data dropped), **Patch** (late-streamed `<script>` mutates `document.head` client-side), or **Block + Stream** (block for bots via User-Agent, stream for users).

Production gotchas (from a 2026 cross-framework study):

- **Next.js 15 regression**: `generateMetadata()` became non-blocking by default → broken social-preview cards on Twitter/Facebook/Slack, because those crawlers **don't execute JS** and drop the connection before late-streamed OG tags arrive. Fix: extend `htmlLimitedBots` with missing UA patterns.
- **Next.js 16**: stabilizes **Partial Pre-Rendering (PPR)** and ships **bot-aware streaming** (rated best overall): users get streamed HTML with metadata injected via `<script>` and hoisted to `<head>` by React 19's native metadata hoisting; detected bots (Googlebot, Bingbot, Twitter/Facebook/LinkedIn/Slack/Discord in the default `htmlLimitedBots` list) get a blocking, complete `<head>`. Residual risk: niche crawlers not on the list.
```tsx
// app/products/[id]/page.tsx
export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await fetch(`/api/products/${id}`).then(r => r.json())
  return { title: product.name, openGraph: { images: [product.image] } }
}
// Users see the page instantly; bots wait for this to resolve.
```
- **Rule of thumb**: keep `<head>` data out of the streaming path entirely, or use bot-aware rendering. **Interop 2026** is standardizing this with `<link rel="expect" href="#target" blocking="render">` — the browser withholds paint until the target element parses, removing the need for framework patching hacks (Chrome/Edge stable since v124; Safari/Firefox in development).
- **Verify in a real network trace**, not just localhost — CDNs and proxies buffer chunks and can silently disable streaming end-to-end.

## Verification

- DevTools Network tab: confirm chunks arrive separately (shell first, then boundary payloads).
- `curl --no-buffer <route>` and watch where chunks land; a single chunk means an upstream await is blocking.
- Compare TTFB/FCP/CLS before and after with Lighthouse + real-user monitoring.

## Diagram

See [nextjs-streaming-ssr-suspense.excalidraw](nextjs-streaming-ssr-suspense.svg) for the shell-first, boundaries-later flow.

## References

- [Eradicating Slow TTFB: Streaming SSR in Next.js (dev.to, 2026-09-18)](https://dev.to/iprajapatiparesh/eradicating-slow-ttfb-streaming-ssr-in-nextjs-22dm)
- [Next.js docs: Streaming](https://nextjs.org/docs/app/guides/streaming)
- [Next.js docs: Loading UI and streaming (App Router)](https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming)
- [Server-Side Streaming SEO in 2026: A Cross-Framework Study (Unhead, 2026-03-05)](https://unhead.unjs.io/learn/research/streaming-head-performance)
