---
title: Cutting INP from 480ms to Under 200ms on a Legacy Site (No Rewrite)
diataxis: Explanation
domain: Software-Engineering
topic: Web-Performance
source: ''
source_url: https://dev.to/sgbp/how-we-cut-inp-from-480ms-to-under-200ms-on-a-legacy-site-no-rewrite-2f0e
keywords:
- knowledge-base
- Web-Performance
- Software-Engineering
- explanations
---
# Cutting INP from 480ms to Under 200ms on a Legacy Site (No Rewrite)

## Overview

Interaction to Next Paint (INP) replaced First Input Delay (FID) as a Core Web Vital metric, measuring the **worst** interaction latency rather than the average. This guide covers proven techniques for reducing INP on legacy sites (WordPress, older themes, no framework) without a rewrite.

**Key result**: A Singapore-based clinic/retailer site moved from ~480ms (failing) to &lt;200ms (passing) using three targeted changes.

## Prerequisites

- Access to site JavaScript (can inject via theme or plugin)
- Real-user monitoring capability (web vitals library or analytics endpoint)
- No framework migration required

## Step 1: Measure — Find the Slow Interactions

INP measures the **slowest** interaction, not the average. Guessing what's slow is unreliable.

### Instrument with web-vitals

```javascript
import { onINP } from 'web-vitals';

onINP((metric) => {
  // Ship to your analytics endpoint
  navigator.sendBeacon('/vitals', JSON.stringify({
    value: metric.value,
    target: metric.attribution?.interactionTarget,
  }));
});
```

### What to Look For

The `interactionTarget` reveals which element is slow. Common culprits:
- Menu toggles and navigation drawers
- Filter buttons on product listings
- "Add to cart" buttons
- Form submission triggers
- Accordion/collapsible sections

**Key insight**: Focus on the worst-performing interaction, not the median. A single slow interaction can fail the entire INP score.

## Step 2: Break Up Long Tasks

The most common INP killer: a single event handler doing too much synchronously on the main thread.

### The Problem

```javascript
// BAD: Everything runs synchronously
function handleClick() {
  updateUI();           // Cheap, visible
  calculateTotals();    // Expensive, blocks paint
  trackAnalytics();     // More blocking work
  updateRelatedWidgets(); // Even more work
}
```

### The Fix: Yield to the Main Thread

```javascript
async function handleClick() {
  // 1. Give immediate visual feedback (cheap)
  updateUIImmediately();

  // 2. Yield to the main thread
  await scheduler.yield?.() ?? new Promise(r => setTimeout(r));

  // 3. Do expensive work after the paint
  doExpensiveWork();
}
```

### Alternative: requestIdleCallback

```javascript
function handleClick() {
  updateUIImmediately();

  requestIdleCallback(() => {
    doExpensiveWork();
  }, { timeout: 2000 });
}
```

### When to Use Which

| Technique | Best For |
|-----------|----------|
| `scheduler.yield()` | Modern browsers; fine-grained control |
| `setTimeout(fn, 0)` | Universal fallback; simple |
| `requestIdleCallback()` | Non-urgent background work |
| `requestAnimationFrame()` | Visual updates tied to paint |

## Step 3: Defer Third-Party Scripts

Chat widgets, analytics pixels, and advertising scripts are silent INP killers. They block the main thread during page load and early interactions.

### Load After First Interaction

```javascript
addEventListener('load', () => {
  requestIdleCallback(() => {
    const s = document.createElement('script');
    s.src = 'https://widget.example.com/chat.js';
    document.body.appendChild(s);
  });
});
```

### Prioritization Strategy

| Priority | Scripts | Loading Strategy |
|----------|---------|-----------------|
| Critical | Core app JS | Inline or early |
| Important | Analytics | `defer` attribute |
| Nice-to-have | Chat widgets, ads | `requestIdleCallback` |
| Non-essential | Social buttons | Lazy-load on scroll |

### Additional Deferral Techniques

```html
<!-- Use async for non-critical scripts -->
<script async src="https://analytics.example.com/tracker.js"></script>

<!-- Use defer for scripts that need DOM -->
<script defer src="https://cdn.example.com/app.js"></script>

<!-- Dynamic import for code-split features -->
<button onclick="loadFeature()">Load Feature</button>
<script>
async function loadFeature() {
  const module = await import('/features/advanced.js');
  module.init();
}
</script>
```

## Step 4: Measure Again

After implementing changes, verify improvement:

1. Re-run the `web-vitals` instrumentation
2. Compare INP distributions (p75, p90, p99)
3. Check that the worst interaction is now under 200ms
4. Monitor for regression over time

### INP Rating Thresholds

| Rating | Threshold |
|--------|-----------|
| Good | ≤ 200ms |
| Needs Improvement | 201–500ms |
| Poor | > 500ms |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              INP Optimization Pipeline               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Step 1: Measure                                    │
│  ┌──────────────┐     ┌──────────────┐             │
│  │ web-vitals   │────▶│ Analytics    │             │
│  │ onINP()      │     │ Endpoint     │             │
│  └──────────────┘     └──────┬───────┘             │
│                              │                      │
│  Step 2: Identify            ▼                      │
│  ┌──────────────────────────────────┐              │
│  │ Slowest interactionTarget        │              │
│  │ (menu toggle, filter, cart)      │              │
│  └──────────────────┬───────────────┘              │
│                     │                              │
│  Step 3: Fix       ▼                              │
│  ┌──────────────────────────────────┐              │
│  │ Break long tasks                 │              │
│  │ Yield main thread                │              │
│  │ Defer 3rd-party scripts          │              │
│  └──────────────────┬───────────────┘              │
│                     │                              │
│  Step 4: Verify    ▼                              │
│  ┌──────────────────────────────────┐              │
│  │ INP < 200ms? ✓                   │              │
│  │ Monitor for regression           │              │
│  └──────────────────────────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Common Pitfalls

1. **Optimizing the wrong interaction** — Always measure first; the slowest interaction is rarely the one you'd guess
2. **Over-yielding** — Too many yields make the UI feel janky; balance responsiveness with throughput
3. **Ignoring third-party scripts** — Chat widgets and analytics are often the real bottleneck
4. **Testing only in development** — INP is a real-user metric; lab tests (Lighthouse) may not reflect production

## Best Practices

1. **Enable core dumps proactively** — Configure monitoring before issues arise
2. **Keep baseline metrics** — Record INP before changes for comparison
3. **Use progressive enhancement** — Core functionality should work without heavy scripts
4. **Audit third-party scripts quarterly** — New widgets accumulate over time

## References

- [DEV.to: How we cut INP from 480ms to under 200ms](https://dev.to/sgbp/how-we-cut-inp-from-480ms-to-under-200ms-on-a-legacy-site-no-rewrite-2f0e)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Google: Interaction to Next Paint (INP)](https://web.dev/articles/inp)
- [PageSpeed Insights](https://pagespeed.web.dev/)
