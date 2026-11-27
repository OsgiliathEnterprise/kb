---
title: 'CSS Gradient Color Interpolation: The ''in oklab'' / ''in oklch'' Fix for
  Muddy Midpoints'
diataxis: Example
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/gotoolsonline/why-your-css-gradients-look-muddy-in-the-middle-and-the-one-word-fix-4phj
date: 2026-11-20 (enriched by KB Zookeeper)
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

## Which spaces you can name (`<color-interpolation-method>` syntax)

Per MDN, the `in …` clause accepts (CSS Color 4):

- **Rectangular spaces:** `srgb`, `srgb-linear`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `lab`, `oklab`, `xyz`, `xyz-d50`, `xyz-d65`
- **Polar spaces** (with optional hue method `shorter hue` | `longer hue` | `increasing hue` | `decreasing hue`, default `shorter hue`): `hsl`, `hwb`, `lch`, `oklch`
- A `<dashed-ident>` referring to a custom `@color-profile` rule

The same syntax works identically in `color-mix()`, `linear-gradient()`, `radial-gradient()`, and `conic-gradient()`.

## Spec shift: Oklab is becoming the *default*

The sRGB-muddiness described above is the *legacy* behavior. The W3C CSSWG resolved to change the **default** interpolation of `<color>` values (gradients, `color-mix()`) from gamma-encoded sRGB to **Oklab** — "interpolating colors in Oklab never produces worse results" was the decisive argument in the working-group discussion (csswg-drafts #7948). MDN now documents the default interpolation space as Oklab. Practical takeaway: eventually the `in oklab` hint becomes redundant and the sRGB-fallback-first pattern only matters for older engines; today, still declare both.

## Browser support (color functions and `in <space>` interpolation)

| Browser | First version with oklab/oklch |
|---|---|
| Chrome / Edge | 111 |
| Firefox | 113 |
| Safari | 15.4 |

Oklab/OKLCH colors are Baseline "widely available" (caniuse). One quirk to know: for `longer hue`/`shorter hue` in polar gradients, Safari historically followed a strictly numeric interpolation for edge cases (csswg-drafts #7750) — if a rainbow gradient renders differently across engines, pin the hue method explicitly.

## References

- [Why your CSS gradients look muddy in the middle (and the one-word fix) — DEV.to](https://dev.to/gotoolsonline/why-your-css-gradients-look-muddy-in-the-middle-and-the-one-word-fix-4phj)
- [MDN: `<color-interpolation-method>`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color-interpolation-method)
- [MDN: CSS `<gradient>` — interpolation color space](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient)
- [CSSWG draft discussion: default gradient interpolation in Oklab (issue #7948)](https://github.com/w3c/csswg-drafts/issues/7948)
- [OKLCH in CSS: why we moved from RGB and HSL — Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [caniuse: css-oklch](https://caniuse.com/css-oklch)
