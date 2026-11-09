---
title: 'JIT-Compiled Bitmap Text Rendering on Microcontrollers: Raph Levien''s RP2350
  Technique'
diataxis: Explanation
domain: programming
topic: rust
source: HackerNews
source_url: https://linebender.org/blog/jit-bitmap-text/
date: 2026-11-09
keywords:
- knowledge-base
- rust
- programming
- explanations
---
# JIT-Compiled Bitmap Text Rendering on Microcontrollers: Raph Levien's RP2350 Technique

For `vic-2350` (an 80s home-computer re-envisioning on an RP2350 Cortex-M33 board), Raph Levien needed proportional, kerned bitmap text fast enough to **race the beam** — filling the video buffer one scanline at a time under a ~**6 cycles/pixel** budget. Rust can't meet the budget; the renderer is written in `symbolasm`, his own high-performance Cortex-M33 assembly language, and the trick that makes text cheap is a **JIT that generates purpose-built machine code per string**.

## Why bitmap fonts, why JIT

- Bitmap fonts are crisp at low resolution and efficient; antialiasing is "blurry mush" at these sizes. But proportional spacing + kerning on an RP2350 is normally too slow (most projects use fixed character cells).
- Only 520 kB SRAM total: a full framebuffer sacrifices resolution/bit-depth/RAM for the app. Racing the beam (DVI out via the HSTX peripheral) buys visual richness and low latency — at the cost of a hard per-scanline compute budget.
- Pre-JIT attempts in `pico-dvi-rs` struggled to render a full screen: for proportional text, all the shift arithmetic and 32-bit-word-boundary branching must happen at render time. **The JIT hoists that work to string-expansion time**: each glyph becomes straight-line code with constants baked in.

## Rendering pipeline

1. App builds a **double-buffered display list** of display objects (vtable + bounding rect + payload); allocation is fine because *building* isn't timing-critical (two copies live, so memory efficiency still matters).
2. Indices are sorted by ascending `y0`; the renderer maintains an **active list** of objects intersecting the current scanline (insert `y0 == y`, delete `y1 == y`).
3. `start`/`end` hooks on insert/delete allocate scratch from a fast deterministic bitmap allocator.
4. Text object = string (1 byte/char) + font pointer + fg/bg colors. In `start`, the **JIT expands the string into code**; `render` runs it into a 1 bpp line buffer, then a second pass expands to RGB565 at a sustained **1.75 cycles/pixel**.

## The packed font

All glyph ink lives in one wide bitmap shared across glyphs:

- No glyph straddles a 32-pixel chunk boundary → **one 32-bit `ldr` per row per glyph**.
- The packer detects overlaps — glyphs contained in others need no separate ink (`l` is the left side of `U`; `0` is `()` with the gap removed). This shrank the font bitmap **1140 → 960 bytes**. Side bearings aren't stored as ink, only in metadata.
- Per-glyph metadata packs four fields into **one 32-bit word**: ink x-offset + width in the bitmap, left side bearing, advance.
- The bitmap must live in SRAM — flash access would stall during video-rate rendering.

## The generated code

Register roles: `r0` = packed font row, `r1` = 1 bpp output line, `r2` = output accumulator, `r3` = extracted glyph bits, `r4` = 32-bit load. Simplest case adds one glyph to the accumulator:

```asm
ldr  r4, [r0, #(x_offset / 32 * 4)]
ubfx r3, r4, #(x_offset % 32), #(width)
orr  r2, r3, lsl #(x % 32)
```

Two micro-optimizations worth stealing:

- **Delay-slot shuffling:** the result-use delay between `ldr` and `ubfx` is filled by reordering glyph *i*'s last instruction after glyph *i+1*'s `ldr` — cutting the inner step from 4 to 3 cycles.
- **Table-driven instruction synthesis:** the `ubfx` and `orr` encodings are built by indexing precomputed instruction tables (`*(ubfx_table + bit_offset * 4)`, then `+= width &lt;&lt; 16`) instead of bit-fiddling the encoding at JIT time.

Compiled inner loop: **23 cycles per glyph iteration** (symbolasm's cycle analyzer flags `H` = 32-bit encoding from hi-register use, `K 0/2` = branch-predicted-taken penalty).

## Performance

- ~21k cycles to JIT a full screen of text + ~42k to run it ≈ **2.6% of one RP2350 core's throughput**; RGB565 expansion is ~3× the 1 bpp cost.
- Fixed-width text doesn't need any of this — everything is static, a plain loop suffices. The JIT pays off exactly when layout is data-dependent (proportional + kerning).
- Prior art: on-the-fly code generation for bitblt on the Blit terminal (~1982, ~2,500 chars/s — this is ~3 orders of magnitude faster); US Patent 637,7261 (1996) compiled glyphs to machine code but leaned on a cache for RAM efficiency.
- Speculative extension to real vector fonts: store per-kerning-pair *vectors* (bits + integer amount) and sum dot products — dot products are cheap, OpenType index-chasing is not.
- AI disclosure: Rust JIT core hand-written, translated/optimized to symbolasm with Claude; blog hand-written.

## See also

- [jit-bitmap-text-pipeline.excalidraw](jit-bitmap-text-pipeline.svg) — display list → active list → JIT → 1bpp → RGB565 pipeline and font packing notes.

## References

- [JIT bitmap text rendering for microcontrollers — Raph Levien, Linebender](https://linebender.org/blog/jit-bitmap-text/)
- [vic-2350 (JIT text source: text.sy)](https://github.com/raphlinus/vic-2350/blob/62f2fae7e672b9a01011cdc320b031cda29fb5c8/text.sy)
- [symbolasm — high-performance Cortex-M33 assembly language](https://github.com/raphlinus/symbolasm)
- [Pike, Bitmap Graphics (SIGGRAPH '84) — bitblt code generation prior art](https://pdos.csail.mit.edu/~rsc/pike84bitblt.pdf)
