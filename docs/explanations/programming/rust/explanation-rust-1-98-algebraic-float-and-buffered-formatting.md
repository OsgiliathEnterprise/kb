---
title: 'Rust 1.98: Algebraic Floating-Point Methods and Buffered Integer Formatting'
diataxis: Explanation
domain: programming
topic: rust
source: Developpez
source_url: https://rust.developpez.com/actu/386430/La-version-1-98-de-Rust-introduit-des-methodes-algebriques-pour-les-nombres-a-virgule-flottante-le-formatage-des-entiers-avec-mise-en-memoire-tampon-et-ameliore-la-documentation-de-ManuallyDrop/
date: 2026-08-26
keywords:
- knowledge-base
- rust
- programming
- explanations
---
# Rust 1.98: Algebraic Floating-Point Methods and Buffered Integer Formatting

Rust 1.98.0 (released 2026-08-20) ships two headline library features plus a
documentation fix. Update with `rustup update stable`.

## Algebraic floating-point methods

`f32` and `f64` gain `algebraic_add`, `algebraic_sub`, `algebraic_mul`,
`algebraic_div`, and `algebraic_rem`. They let the compiler apply optimizations
based on the algebraic properties of real numbers — properties that strictly do
not hold for floating point (e.g. addition is not associative). The exact
optimization set is unspecified; it is analogous to `-ffast-math` in other
languages.

```rust
// a + b + c + d must be evaluated left-associatively: ((a+b)+c)+d
// but with algebraic_add the compiler may regroup:
let s = a.algebraic_add(b).algebraic_add(c).algebraic_add(d);
// compiler is free to compute (a+b) + (c+d) in parallel,
// and can often vectorize the loop more aggressively.
```

Key semantics: these methods are **non-deterministic** (the compiler may choose
different optimizations), but they **never** introduce undefined behavior.

## Buffered integer formatting

Every primitive integer type gains `format_into(&mut NumBuffer<Self>) -> &str`,
where `NumBuffer<T>` is an opaque buffer sized for the decimal format of any
`T`. The returned `&str` borrows from the buffer. This bypasses most of the
dynamic dispatch of buffered `write!` formatting.

```rust
use core::fmt::NumBuffer;

let mut buf = NumBuffer::<i64>::new();
let s: &str = 42_i64.format_into(&mut buf); // no FormatArgs indirection
```

The [itoa-benchmark](https://github.com/dtolnay/itoa-benchmark) repo shows
`format_into` performs on par with `itoa` itself — a viable standard-library
replacement for that dependency.

## `ManuallyDrop` / `Box` UB fix made stable in docs

Before 1.96.0 this code was undefined behavior (moving a dropped `Box` is UB,
and `ManuallyDrop` propagated it):

```rust
let mut x = ManuallyDrop::new(Box::new(1));
unsafe { ManuallyDrop::drop(&mut x) };
let x = x; // was UB before 1.96
```

1.96.0 fixed the behavior; 1.98.0 updates the `ManuallyDrop` docs to guarantee
it stays non-UB. See the [ManuallyDrop docs](https://doc.rust-lang.org/stable/std/mem/struct.ManuallyDrop.html) and [RFC 3336](https://rust-lang.github.io/rfcs/3336-maybe-dangling.html).

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "f32 / f64 arithmetic\n(+ - * / %)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 300,
      "y": 160,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "algebraic_add / sub / mul / div / rem\n(compiler may reorder & vectorize)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 600,
      "y": 160,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "results: non-deterministic,\nbut never undefined behavior", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 40,
      "y": 320,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f2d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "any int type", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b5",
      "type": "rectangle",
      "x": 300,
      "y": 320,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "format_into(&mut NumBuffer<T>)\nno dynamic dispatch", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b6",
      "type": "rectangle",
      "x": 600,
      "y": 320,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "&str borrowed from buffer\n(perf on par with itoa)", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 240,
        "y": 205,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 540,
        "y": 205,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 240,
        "y": 365,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a4",
        "type": "arrow",
        "x": 540,
        "y": 365,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Takeaways

- Reach for `algebraic_*` in hot numeric loops where strict IEEE
  left-associative evaluation order is not a correctness requirement.
- Consider dropping the `itoa`/`ryu` dependencies in favor of `format_into`.
- The `ManuallyDrop<Box<T>>` + `drop` + move pattern is now documented as safe
  going forward.

## References

- [Developpez: Rust 1.98 release coverage](https://rust.developpez.com/actu/386430/La-version-1-98-de-Rust-introduit-des-methodes-algebriques-pour-les-nombres-a-virgule-flottante-le-formatage-des-entiers-avec-mise-en-memoire-tampon-et-ameliore-la-documentation-de-ManuallyDrop/)
- [Official Rust blog: Announcing Rust 1.98.0](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/)
- [Algebraic operators API change proposal (libs-team#532)](https://github.com/rust-lang/libs-team/issues/532)
- [itoa-benchmark](https://github.com/dtolnay/itoa-benchmark)
