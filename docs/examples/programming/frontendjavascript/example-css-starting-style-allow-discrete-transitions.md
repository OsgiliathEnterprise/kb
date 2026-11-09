---
title: 'Animating display:none in Pure CSS: @starting-style + transition-behavior
  allow-discrete Production Patterns'
diataxis: Example
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/cascadedev/animate-display-none-in-pure-css-modern-starting-style-allow-discrete-explained-54j0
date: 2026-11-08
keywords:
- knowledge-base
- frontend-javascript
- programming
- examples
---
# Animating display:none in Pure CSS: @starting-style + transition-behavior allow-discrete Production Patterns

For over a decade, transitioning an element out of `display: none` required JavaScript reflow hacks (`requestAnimationFrame`, `void element.offsetWidth`). Two Baseline features end that — and they solve **two different halves** of the problem:

1. **`@starting-style`** — supplies the missing *before-change* snapshot (frame 0) when an element goes from `display: none` → displayed, or mounts into the DOM. Without it the browser cannot interpolate between "not in the render tree" and "visible", so it snaps.
2. **`transition-behavior: allow-discrete`** — delays flipping *to* `display: none` (and out of the top layer) until exit transitions finish, so the fade-out is actually seen.

## Support status (verified against web-platform-dx / caniuse)

| Feature | Chrome/Edge | Safari | Firefox | Status |
| --- | --- | --- | --- | --- |
| `@starting-style` | 117+ | **17.5+** | 129+ | Newly Available since 2024-08-06; expected Widely Available 2027-02-06 |
| `allow-discrete` | 117+ | **17.4+** | 129+ | same |

(Note: the source article claims "Baseline 2024 Widely Available" — that overstates it. Baseline *Newly Available* is 2024; *Widely Available* (all supported browsers past the 30-month window) is projected early 2027. ~4.9% of page loads already use `@starting-style`.) Fallback guard:

```css
@supports (transition-behavior: allow-discrete) {
  /* enhanced transitions; base styles degrade to instant show/hide */
}
```

## Pattern 1 — Modal / dropdown (`display: none` ↔ `flex`)

```css
.modal {
  display: flex;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease,
    display 0.35s allow-discrete;      /* discrete prop must be listed AND allowed */

  @starting-style {                    /* frame-0 snapshot when switching from display:none */
    opacity: 0;
    transform: translateY(-12px);
  }
}

.modal.is-closed {
  display: none;
  opacity: 0;
  transform: translateY(-12px);
}
```

## Pattern 2 — Native `<dialog>` and `::backdrop` (zero JS wrappers)

Top-layer entry/exit needs `overlay` transitioned alongside `display`:

```css
dialog {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    overlay 0.3s allow-discrete,
    display 0.3s allow-discrete;

  &::backdrop {
    background-color: rgba(0, 0, 0, 0.65);
    transition: background-color 0.3s ease, display 0.3s allow-discrete;
  }
}

@starting-style {
  dialog[open] {
    opacity: 0;
    transform: scale(0.92);

    &::backdrop { background-color: transparent; }
  }
}
```

## Pattern 3 — Toast appended via JS (`appendChild`) animates on first paint

```css
.toast {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 0.4s ease, transform 0.4s ease;

  @starting-style {           /* applies on DOM mount too, not just display toggles */
    opacity: 0;
    transform: translateX(40px);
  }
}
```

## Gotchas the article glosses over

- `@starting-style` must be **nested in the rule whose transition runs** (or a matching outer rule); declarations there only apply at the before-change snapshot.
- Forcing the *exit* animation means the closing class must keep the element in flow while `display` flips — the `allow-discrete` transition-delay on `display` is what holds it. If the transition doesn't fire, check that `display` (and `overlay` for top layer) is in the `transition` property list; discrete properties don't animate by default.
- Asymmetric in/out is legal: `@starting-style` controls entry only; exit styling lives in the closed-state class — e.g. scale in from 0.9 while sliding down 20px on close.
- Pair with `content-visibility`/`prefers-reduced-motion` in production: `@media (prefers-reduced-motion: reduce) { .modal { transition: none } }`.

## References

- **DEV.to: Animate display: none in Pure CSS (@starting-style & allow-discrete)**: https://dev.to/cascadedev/animate-display-none-in-pure-css-modern-starting-style-allow-discrete-explained-54j0
- **web.dev — Now in Baseline: animating entry effects**: https://web.dev/blog/baseline-entry-animations
- **web.dev — New to the web platform in August 2024 (support versions)**: https://web.dev/blog/web-platform-08-2024
- **MDN @starting-style spec anchor (CSS Transitions Level 2)**: https://web-platform-dx.github.io/web-features-explorer/features/starting-style/
- Companion code vault: https://github.com/muneebali500/cascadedev-code-vault/tree/main/01-CSS/02-starting-style
