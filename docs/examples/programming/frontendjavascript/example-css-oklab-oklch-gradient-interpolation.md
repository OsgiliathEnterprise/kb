---
title: 'CSS Gradient Color Interpolation: The ''in oklab'' / ''in oklch'' Fix for
  Muddy Midpoints'
diataxis: Example
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/gotoolsonline/why-your-css-gradients-look-muddy-in-the-middle-and-the-one-word-fix-4phj
date: 2026-11-20
keywords:
- knowledge-base
- frontend-javascript
- programming
- examples
---
# CSS Gradient Color Interpolation: The 'in oklab' / 'in oklch' Fix for Muddy Midpoints

`linear-gradient(90deg, blue, yellow)` turns a **dull grey in the middle** — not because the colors are wrong, but because browsers interpolate gradient colors in **sRGB by default**, and the straight RGB line between two hues often passes through a desaturated zone. The one-word fix: interpolate in a perceptual color space instead.

## The fix

```css
.muddy  { background: linear-gradient(90deg, blue, yellow); }
.clean  { background: linear-gradient(in oklab 90deg, blue, yellow); }
.vivid  { background: linear-gradient(in oklch 90deg, blue, yellow); }
```

- **`oklab`** — perceptually even lightness; the midpoint looks like a real halfway color.
- **`oklch`** — travels around the hue wheel, giving brighter, rainbow-like transitions. Choose the direction with `shorter hue` / `longer hue`:

```css
.rainbow { background: linear-gradient(in oklch longer hue 90deg, red, red); }
```

## Always keep a sRGB fallback

Color-space interpolation is supported in current Chrome, Edge, Firefox, and Safari, but declare the plain gradient **first** so older browsers still render something:

```css
.card {
  background: linear-gradient(90deg, blue, yellow);        /* fallback */
  background: linear-gradient(in oklab 90deg, blue, yellow); /* modern */
}
```

The second declaration wins in browsers that can parse it; older browsers ignore it and keep the first.

## Two adjacent techniques

1. **Pin the midpoint manually** instead of fighting the blend — insert an explicit middle stop where the naive midpoint would have gone grey:
   ```css
   linear-gradient(90deg, blue, #6aa 50%, yellow)
   ```
2. **`conic-gradient()`** for pie charts and color wheels — stop syntax `color 0 25%` defines spans:
   ```css
   background: conic-gradient(red 0 25%, gold 0 60%, teal 0);
   ```

## Why this works (one paragraph)

sRGB coordinates are not perceptually uniform: equal steps in RGB are not equal steps in perceived color, and the chord between two saturated colors can cut near the grey axis. OKLab/OKLCH *are* designed for perceptual uniformity — interpolating linearly in OKLab keeps lightness even and stays saturated, so the midpoint of blue→yellow reads as the green you expect rather than grey. Same reasoning applies to `color-mix(in oklab, ...)`, which takes the identical `in <color-space>` syntax.

## References

- [Why your CSS gradients look muddy in the middle (and the one-word fix) — DEV.to](https://dev.to/gotoolsonline/why-your-css-gradients-look-muddy-in-the-middle-and-the-one-word-fix-4phj)
- [MDN: CSS `<gradient>` — interpolation color space](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient)
