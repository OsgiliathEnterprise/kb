---
title: 'JIT Compiling Code in 5μs: Copy-and-Patch Stencils in Rust'
diataxis: Explanation
domain: Programming
topic: Rust
source: HackerNews
source_url: https://malisper.me/jit-compiling-code-in-5-us/
date: 2026-08-23
keywords:
- knowledge-base
- Rust
- Programming
- explanations
---
# JIT Compiling Code in 5μs: Copy-and-Patch Stencils in Rust

## Overview

A practical walkthrough (from the author of **pgrust**, an in-Rust Postgres) showing how to write a *fast* JIT compiler by directly targeting assembly — the kind that compiles code in ~5μs, fast enough to JIT-compile **every** SQL query rather than a subset. The author's central claim: historically fast JITs were a "black art" requiring hand-written assembly, which is why no production database ships its own JIT (they all fall back to LLVM or codegen-to-C/C++, both slow). **AI-assisted assembly writing collapses that barrier**, making hand-targeted JITs suddenly practical.

The article is taught through a **toy regular-expression engine** that supports only literal strings and `*` repetition, then JIT-compiled so a *general* engine matches the performance of a *hand-written* matcher.

## Why JIT at all

- JIT = generate compiled code at runtime. Done well it gives **2–5x** wins (sometimes more).
- Payoff when you learn something at runtime that drastically changes behavior: language interpreters, schema-less data parsing, and — the author's case — SQL queries known only at runtime.

## Step 1 — Model the regex as an AST

Three node types: a literal string, a repetition (`*`), and a concatenation of two nodes.

```rust
enum Node {
    Literal(&'static str),
    Concatenation(Box<Node>, Box<Node>),
    Repetition(Box<Node>),
}
```

An **interpreter** (`match_node`) walks the AST with backtracking via a `next` closure. It's under 20 lines but runs **10–20x slower** than a hand-written matcher for `b(an)*` — that gap is what the JIT closes.

## Step 2 — The copy-and-patch approach

Rather than emit assembly by reasoning about encodings, use **stencils** (also called templates): pre-made blocks of machine code for each operation. To compile an operation you take the associated stencil and make small tweaks (patch immediates, patch branch targets), then concatenate several filled stencils into a runtime program. This is the same "copy-and-patch" idea used by [gudzpoz/patchouly](https://github.com/gudzpoz/patchouly) and even a [CPython copy-and-patch JIT PR](https://github.com/python/cpython/pull/113465).

## Step 3 — Register conventions (ARM64)

- `x0` — current position in the string; also the return value
- `x1` — top of the backtracking stack
- `x2` — bottom of the stack (detecting "empty")
- `x9` — scratch / temporary

Inputs passed in: `x0` = pointer to start of the string, `x1` = pointer to the backtracking stack. Design choices that keep the generated code small:

- **Backtracking stack** holds the (resume-address, string-position) to try when a path dead-ends.
- The input string is **NUL-terminated**, so a character comparison fails at end-of-string for free — no length comparisons needed.

## Step 4 — The generated ARM64 (for `b(an)*`)

```asm
; prologue: bottom of stack = top of stack
mov   x2, x1
; CHAR 'b'
ldrb  w9, [x0]
cmp   w9, #0x62        ; is it 'b'?
b.ne  0x5c             ; no -> fallback block
add   x0, x0, #1       ; yes -> advance
; repetition (an)*: push (loop-exit, pos) for backtracking
movz  x9, #0x004c
movk  x9, #0x0000, lsl #16
movk  x9, #0x0001, lsl #32
movk  x9, #0x0000, lsl #48
stp   x9, x0, [x1], #16   ; push (exit, pos)
; body: 'a' then 'n', then jump back to loop top
; ... (ldrb/cmp/add for 'a' and 'n', then b 0x14)
; after loop: at NUL? -> success else fallback
; fallback: any frames left? pop (addr,pos), jump
```

## Step 5 — Make it executable

Package the assembled bytes into a callable function: allocate executable memory (RWX) and `mmap`, copy the stencils in, and call it like any Rust function; `Drop` releases it with `libc::munmap`.

```rust
impl Drop for Jit {
    fn drop(&mut self) {
        unsafe {
            libc::munmap(self.buf as *mut libc::c_void, self.nbytes);
        }
    }
}
```

## Results

JIT ≈ hand-written; both far beat the interpreter:

| Input length | Interpreter | JIT | Handwritten | JIT speedup | Handwritten speedup |
| --- | --- | --- | --- | --- | --- |
| 9 | 45 ns | 3.8 ns | 3.8 ns | 11.7x | 11.9x |
| 33 | 103 ns | 7.9 ns | 10.5 ns | 13.0x | 9.8x |
| 129 | 597 ns | 30 ns | 32 ns | 19.7x | 18.6x |
| 513 | 1,955 ns | 126 ns | 120 ns | 15.5x | 16.2x |
| 2,049 | 8,301 ns | 470 ns | 393 ns | 17.7x | 21.1x |

## Diagram: the copy-and-patch pipeline

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "ast",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "regex AST\nLiteral | Repetition\n| Concatenation", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "stencils",
      "type": "rectangle",
      "x": 320, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "stencils\npre-made ARM64 blocks\nper operation", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "emitter",
      "type": "rectangle",
      "x": 600, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "emitter\nfill + patch stencils\nconcatenate", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "mem",
      "type": "rectangle",
      "x": 600, "y": 200,
      "width": 200, "height": 90,
      "strokeColor": "#c0345c",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "RWX memory (mmap)\nlibc::munmap on Drop\ncallable fn, ~5us", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "arrow-ast-stencils",
      "type": "arrow",
      "x": 240, "y": 85,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-stencils-emitter",
      "type": "arrow",
      "x": 520, "y": 85,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-emitter-mem",
      "type": "arrow",
      "x": 700, "y": 130,
      "width": 0, "height": 70,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    }
  ]
}
```

## The thesis

The "code was never the hard part" meme holds in some domains but not this one: for a long time **writing the assembly *was* the hard part**, which is why JITs are rare. LLMs lower that barrier, so software that was historically too hard to build (like a database with its own fast JIT) becomes achievable. That is the bet behind pgrust.

## Caveats

- The toy engine supports only literals + `*`; no alternation, lookbehind, or a parser (the AST is given).
- Benchmarks are macOS ARM64; absolute ns figures are hardware-specific.
- The "AI makes it easier" claim is the author's framing; the concrete, reproducible content is the copy-and-patch + stencils + executable-memory technique.

## References

- [JIT Compiling Code in 5μs (malisper.me, original)](https://malisper.me/jit-compiling-code-in-5-us/)
- [pgrust (GitHub)](https://github.com/malisper/pgrust)
- [gudzpoz/patchouly — copy-and-patch JIT in Rust (GitHub)](https://github.com/gudzpoz/patchouly)
- [CPython copy-and-patch JIT PR #113465 (GitHub)](https://github.com/python/cpython/pull/113465)
- [PostgreSQL LLVM JIT for expressions (pgsql-hackers)](https://www.postgresql.org/message-id/CADviLuNjQTh99o6E0LTi0Ykks%2DnaW8SXHmgn%2Dq4OaP4%2BaaBXKXa0pA4%40mail.gmail.com)
