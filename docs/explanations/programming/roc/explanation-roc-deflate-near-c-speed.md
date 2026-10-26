---
title: How Close Can Pure Functional Get to C? (roc-deflate vs libdeflate)
diataxis: Explanation
domain: programming
topic: roc
source: HackerNews
source_url: https://rtfeldman.com/fp-vs-c
date: 2026-10-24
keywords:
- knowledge-base
- roc
- programming
- explanations
---
# How Close Can Pure Functional Get to C? (roc-deflate vs libdeflate)

The short answer from a head-to-head benchmark: a pure functional language can get **within ~3–9% of a hand-tuned C implementation** of a performance-critical algorithm — without SIMD, without unsafe code, and without being a theorem prover.

## Background: the LEAN result that set the bar

A [Lean 4 DEFLATE library](https://kim-em.github.io/blog/2026-7-24-why-lean-is-faster-than-rust/) (`lean-zip`) outperformed Rust's `miniz_oxide` (a package with over a billion downloads on crates.io): at its fastest setting it was **15% quicker with output 8.8% smaller** at equivalent compression levels. But it lost to the "end boss" of DEFLATE performance: [libdeflate](https://github.com/ebiggers/libdeflate), written in C with architecture-specific SIMD that Lean cannot express.

That set the question for [Roc](https://roc-lang.org/) — a functional language whose tagline is "Fast, Friendly, Functional" (fast *comes first*), still weeks from its first numbered release (0.1.0): how close can `roc-deflate` get to libdeflate?

## The benchmark setup

- **Subject**: [roc-deflate](https://github.com/niclas-ahden/roc-deflate), a DEFLATE package by Niclas Ahden (used in paid production work), after a round of performance optimization by Rob Feldman (Roc co-creator).
- **Scope**: non-streaming APIs only (streaming not yet implemented in roc-deflate).
- **Corpus**: the classic [Silesia corpus](https://en.wikipedia.org/wiki/Silesia_corpus); outputs verified identical to libdeflate.
- **Method**: 144 benchmark cases (compression levels L1–L12 × 12 files), median across 15 runs per case, on two machines: 2021 M1 MacBook Pro and AMD Ryzen 9 3900X (Ubuntu).
- **Reproducibility**: a [pinned benchmark script](https://gist.github.com/rtfeldman/7b6830809149867b79761ffb8e0456c3) (pins Roc compiler revision and roc-deflate version). Note from the author: the script was AI-generated and not vetted for security.

## The result: under 10% slower

`roc-deflate` was slower than libdeflate in **all 144 cases**, but by little:

| Machine | Median slowdown |
| --- | --- |
| AMD Ryzen 9 3900X (x64) | **8.9%** |
| 2021 M1 MacBook Pro (arm64) | **2.6%** |

Sample points (L1 compression, MB/s, median of 15 runs): samba 344.00 (C) vs 309.79 (Roc); nci 601.03 vs 529.49; x-ray 145.93 vs 134.66.

## The four optimization levers that got it there

### 1. Avoid unnecessary sharing (opportunistic mutation)

Roc can mutate values *in place* when it can prove the value is unique ("[opportunistic mutation](https://www.roc-lang.org/docs/main/langref/expressions/#opportunistic-mutation)"). The performance rule: **keep values unique so they stay eligible for in-place mutation** — unnecessary sharing destroys that.

### 2. Hoist bounds checks

Roc has no opt-out from bounds checks (unlike C, Zig, Rust), but the compiler can delete checks it can prove always pass. The trick: put one check *before* the loop that makes the in-loop checks provably redundant:

```roc
if collection.len() <= highest_index_used {
    return 0
}
# loop body: interior checks are now optimizer-deletable
```

The check looks redundant, but failures become unreachable after the early return, so the costlier per-iteration checks vanish.

### 3. Build lookup tables at compile time

[Roc's compile-time evaluation](https://www.roc-lang.org/docs/main/langref/compile-time/) can assemble lookup tables at compile time when nothing depends on runtime inputs. Because the table length is known at compile time, an exhaustive pattern match like `Ok(entry) = lookup_table.get(5)` is known-valid by the compiler — no runtime bounds check.

### 4. Consider wrapping arithmetic

In Roc, `a + b` desugars to `a.plus(b)`. For a `U64`, `plus` includes an overflow check; [`plus_wrap`](https://www.roc-lang.org/docs/main/Num/#U64.plus_wrap) does not. CPUs do wrapping integer arithmetic in one instruction (see [danluu.com/integer-overflow](https://danluu.com/integer-overflow)), so when the compiler *can't* prove overflow is impossible, `plus_wrap` buys a speedup. When it *can* prove it, both compile identically.

## What's left

- Room for improvement on **x64** specifically, and in the Roc compiler's optimization pipeline.
- Streaming API support in roc-deflate.
- Roc 0.1.0 (eight years in the making) is the next milestone; the author is focusing on it until release.

**Key takeaway**: pure functional + a performance-minded compiler can close the gap to tuned C to single-digit percentages on a memory-bound compression kernel — and the remaining gap is mostly architecture-specific SIMD, which is the one thing a pure language can't touch.

## Diagram

[explanation-roc-deflate-near-c-speed.excalidraw](explanation-roc-deflate-near-c-speed.svg)

## References

- [How close can pure FP get to C? — Rob Feldman (Roc)](https://rtfeldman.com/fp-vs-c)
- [Why Lean is Faster Than Rust (lean-zip DEFLATE results)](https://kim-em.github.io/blog/2026-7-24-why-lean-is-faster-than-rust/)
- [libdeflate (ebiggers)](https://github.com/ebiggers/libdeflate)
- [roc-deflate (niclas-ahden)](https://github.com/niclas-ahden/roc-deflate)
- [Roc language](https://roc-lang.org/) — [opportunistic mutation docs](https://www.roc-lang.org/docs/main/langref/expressions/#opportunistic-mutation), [compile-time docs](https://www.roc-lang.org/docs/main/langref/compile-time/)
- [Pinned benchmark script](https://gist.github.com/rtfeldman/7b6830809149867b79761ffb8e0456c3)
