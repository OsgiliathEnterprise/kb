---
title: 'Advice for the Next 100 Rust GUIs: What Changed Since 2022 (Linebender)'
diataxis: Explanation
domain: programming
topic: rust
source: HackerNews
source_url: https://linebender.org/blog/next-100-guis/
date: 2026-11-22
keywords:
- knowledge-base
- rust
- programming
- explanations
---
# Advice for the Next 100 Rust GUIs: What Changed Since 2022 (Linebender)

Raph Levien's November 2026 follow-up to *Advice for the next dozen Rust GUIs* (2022). Since then **~20 new Rust GUI toolkits** have been announced, with interest accelerating because of AI. The note captures the architecture-relevant claims for anyone choosing or building a Rust UI stack.

## Is Rust still the right bet for UI?

- Motivation unchanged: shipping GUI apps (especially cross-platform/Electron) suffer poor performance; platform toolkits have stagnated; RAM cost makes bloat real on mobile.
- **Zed's GPUI** is the flagship proof Rust UI ships — and GPUI is now driving **AI-powered rewrites (notably Discord)**. But Levien cautions GPUI is tuned for the Zed/editor use case: its 2D renderer lacks full gradient support, blending, and filters expected of a Vello/Skia-class renderer.
- The old adoption blocker (Rust is harder than TS/Kotlin/Swift, dual Rust+UI skills are rare) is **melting away with AI**: evidence (danluu's token-cost analysis) that LLM cost of writing Rust is not significantly higher than other languages, and Rust's type system helps maintainability in large codebases. Prediction: Rust is becoming *the* language for AI rewrites, with "a small explosion" of UI-layer strategies.

## Native is complicated — especially mobile

- Desktop: Windows has no coherent native choice; macOS fragments between AppKit and SwiftUI (which has known performance issues).
- Mobile is where native toolkits keep investing — **Liquid Glass on iOS** is nearly free with UIKit/SwiftUI but cross-platform toolkits "won't quite seem right"; gesture recognition, scroll dynamics, and IME parity remain unsolved for cross-platform.
- The viable mobile path: **native toolkit for UI, Rust for business logic** — the architecture Shopify chose (abandoning React Native), 1Password, and Discord's mobile "Phoenix" plan (with GPUI on desktop).
- Progress on full-Rust mobile UI: the `android-view` editor demo shows real IME functionality (swipe typing, space-bar cursor rolling, semantic-chunk deletion, CJK composition regions) plus basic AccessKit accessibility.

## Solved vs unsolved infrastructure

| Area | Status |
| --- | --- |
| Text layout | **Solved**: Parley (investment from Google, Canva, Dioxus/Cognition) used by most new toolkits; Cosmic Text as anti-monoculture alternative |
| Accessibility | **Solved infrastructure**: AccessKit used by most toolkits; gaps remain in *good* integrations, rich-text editing a11y, and perf when a11y is on (egui rebuilds/diffs a tree every animation frame, undercutting immediate mode) |
| System compositor | **Still unsolved**: video must play in hardware-accelerated layers or low-end devices can't hit frame rates. `subduction` is progress; the ideal is a CALayer-like high-level interface with platform polyfills (SurfaceFlinger layers on Android, GPU shaders for complex compositing) |

## Immediate vs retained mode

Immediate mode = less code, simpler, great for game dev tools — "good at the first 90%, but makes the second 90% harder." To be production-ready it must establish **stable widget identities** (for the a11y tree) and reliably **cache expensive artifacts like text layouts** — simple immediate mode tends to cut corners on text layout and re-renders everything every frame instead of exploiting compositor layers. This is why Levien is unimpressed by egui-style choices for productivity/design apps (while crediting egui as a really good immediate-mode implementation that solved a11y).

## Design/execution separation and specs

- Emerging LLM-assisted engineering theme: **clearly scoped modules with solid specs** — within a module with clear objectives (performance, robustness against adverse inputs), an LLM performs well.
- Future direction: **separate design from execution**. The CS core of a toolkit is an incremental computation engine; the interface between design and execution needs a good spec.
- Strategy: **adapt web standards, don't follow them slavishly**. WPT tests are the real magic (correctness across multiple high-quality implementations — explains Electron's popularity). Downsides: DOM is slow/memory-hungry (lighter tree + bulk mutation interface is better for apps); full CSS resolution/layout is expensive (a curated efficient subset; Levien's Xilem experiments implement selectors as an incremental-evaluation state machine at the cost of sibling selectors). The Web lacks a spec for **virtualized lists** — a core feature needing a data-model interface that preserves incrementality.
- **Blitz** (modular browser engine) is positioned as the cornerstone of hybrid approaches — e.g. start with Stylo as CSS engine, replace with a leaner one if practical.
- Module split exemplar: **Xilem/Masonry** — Xilem's reactive layer is independent of the widgets it controls (DOM and Masonry instantiations both exist); Masonry is independent of the reactive layer and the language above it. **SwiftUI is the counterexample**: widget implementation + reactivity framework + language mashed together, with Swift runtime reflection inside the execution engine.
- Optimization levers given a UI design (code, data, or DSL): **precompute static parts** separately from dynamic; **optimize layer usage** for system compositor or GPU polyfill (layers avoid re-rendering unchanged regions but cost RAM, and layer allocation goes through the OS — SwiftUI `.drawingGroup()` and Flutter `RepaintBoundary` are explicit-hint precedents). See also *A Critique of GPUI* (zortax) for the performance deep dive — GUI toolkit performance discrepancies are tolerated although system-language implementations are expected to be comparable.

## The advice itself

1. **Be bold** — now is the time; Rust UI can deliver vastly higher performance than the status quo.
2. **Build on solid foundations** (Parley, AccessKit, Vello-class renderers — don't rebuild solved problems).
3. **Use well-defined specs when available.**
4. **Work well with open source** — work with upstream, but don't spam them with slop PRs.

Related in this KB: [Rust GUI State Models and the Incrementalization Question](explanation-rust-gui-state-models-incrementalization.md) covers the reactivity-model taxonomy this post builds on.

## References

- [Linebender — Advice for the next 100 Rust GUIs](https://linebender.org/blog/next-100-guis/)
- [Original 2022 advice post (Raph Levien)](https://raphlinus.github.io/rust/gui/2022/07/15/next-dozen-guis.html)
- [Rust GUI survey 2026](https://blog.wybxc.cc/blog/rust-gui-survey-2026/)
- [A Critique of GPUI](https://blog.zortax.de/posts/a-critique-of-gpui)
- [subduction — system compositor library](https://github.com/forest-rs/subduction)
- [android-view — native Android views from Rust](https://github.com/rust-mobile/android-view)
