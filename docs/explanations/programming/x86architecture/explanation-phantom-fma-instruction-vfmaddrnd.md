---
title: Who Is vfmaddrnd231pd? The Phantom FMA Rounding Instruction in Intel's Manual
diataxis: Explanation
domain: programming
topic: x86-architecture
source: HackerNews
source_url: https://purplesyringa.moe/blog/who-is-vfmaddrnd231pd/
date: 2026-10-13
keywords:
- knowledge-base
- x86-architecture
- programming
- explanations
---
# Who Is vfmaddrnd231pd? The Phantom FMA Rounding Instruction in Intel's Manual

## Overview

[This investigation](https://purplesyringa.moe/blog/who-is-vfmaddrnd231pd/) (which hit the Hacker News front page) walks through a corner of the Intel Software Development Manual (SDM): `vfmaddrnd231pd`, a fused multiply-add instruction over packed double-precision values with **per-instruction rounding control**, documented in full detail in the 2024 SDM edition but apparently **never shipped on any CPU** — and deleted again from the 2026 edition.

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
      "width": 230,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "SDM 2024 edition\nfull vfmaddrnd231pd entry\nimmediate byte controls\nrounding / DAZ / FTZ / exceptions", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 330,
      "y": 120,
      "width": 240,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Check 1: GNU as rejects the mnemonic\nCheck 2: no intrinsics (not even ICC)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 330,
      "y": 220,
      "width": 240,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Check 3: opcode VEX.DDS.128.66.0F3A.W1\nB8 /r /ib — stray \"DDS\" notation\nCheck 4: executes as #UD on Haswell", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 630,
      "y": 160,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "SDM 2026 edition\nentry gone entirely\n(only the pd/231 variant was\never documented — no ps/sd/ss/132/213)", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 270,
        "y": 190,
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
        "x": 270,
        "y": 260,
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
        "x": 570,
        "y": 210,
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

## What the Instruction Would Have Done

The `rnd` in the mnemonic is what sets it apart from the ordinary FMA family (`vfmadd231pd`, `vfmadd132pd`, `vfmadd213pd`). Per the SDM, the immediate byte packs bit fields controlling **rounding mode, DAZ (denormals-are-zero), FTZ (flush-to-zero), and exception suppression** — on a per-instruction basis.

Why that matters: ordinary x86 floating-point code inherits its rounding mode from a **global** control register, and changing it is comparatively slow. A per-use rounding mode baked into an immediate would avoid that cost. Since FMA can emulate plain addition, subtraction, and multiplication, one such instruction would effectively give *any* floating-point arithmetic controllable rounding **without AVX-512** — making rounding-dependent algorithms dramatically faster on the large installed base of CPUs that never gained AVX-512.

## The Evidence: Every Practical Check Fails

1. **GNU assembler doesn't recognize the mnemonic.**
2. **The intrinsics the SDM names — `_mm_fmaddround_pd` and `_mm256_fmaddround_pd` — are absent not only from Clang but from Intel's own compiler (ICC).**
3. **The encoding is stranger than the rest of the manual.** Assembling by hand from the opcode list gives `VEX.DDS.128.66.0F3A.W1 B8 /r /ib`. `DDS` is the only occurrence of that notation anywhere in the SDM; a cited Stack Overflow answer says it was a documentation-only artifact dropped from later SDM versions — but its presence here is itself suspicious.
4. **Executing the instruction on a Haswell (which implements the FMA set) raises `#UD` — undefined instruction.**

## Two Further Oddities

- **A single variant.** The SDM documents only `vfmaddrnd231pd` — not the usual matrix of operand widths (`ps`/`pd`/`sd`/`ss`) combined with operand orders (`132`/`213`/`231`) that real FMA instructions have. A phantom instruction with its own pseudocode tables is one thing; a phantom instruction that is also the *only* member of its family is another.
- **It disappeared between editions.** The entry is present in the 2024 SDM and **absent from the 2026 edition**, with no changelog note. A reader of the 2024 manual has no way to know the instruction never shipped; a reader of the 2026 edition has no way to know it was ever promised.

## The Working Hypothesis

This doesn't look like a documentation typo — the entry has unique tables and pseudocode that resemble no other instruction's write-up. The best explanation offered: **Intel planned the `vfmaddrnd*` family, found a problem with it late in development, removed it from the silicon, and didn't clean the manual up for years.** The author notes there's no way to confirm this and asks anyone with Intel contacts for the real story. Follow-up coverage ([deniz.in](https://deniz.in/vfmaddrnd231pd-intel-documented-an-fma-rounding-instruction-that-never-shipped), [lavx.hu](https://news.lavx.hu/article/intel-s-manual-described-an-instruction-no-cpu-ever-executed)) corroborates the findings without adding new facts.

## Why It Matters

1. **The SDM is not gospel.** For low-level developers, the Intel SDM is normally treated as the definitive statement of what x86 silicon does. A multi-year ghost entry — complete with unique pseudocode, named intrinsics, and an unusual encoding notation — shows the manual can drift from what processors actually accept, and that documentation-derived behavior still has to be **validated against real hardware**.
2. **A lost capability with a concrete cost.** Per-instruction rounding without AVX-512 would have been meaningful for code whose correctness or speed depends on controlling rounding, across machines that never gained AVX-512.
3. **Silent removals are their own hazard.** Documentation entries can vanish between revisions without notice, breaking code or assumptions built on the earlier edition — a subtle failure mode for toolchains that auto-generate from the manual.

## Open Questions

- **Intel's actual story** — whether the family was cut for a functional issue, a schedule slip, or something else — remains unconfirmed.
- **Other ghost entries.** If one phantom instruction survived with full documentation, other manual/hardware mismatches may exist; systematic differential testing of the instruction reference against real CPUs (beyond the well-trodden paths) is the natural next step.
- **Amendment process.** How Intel tracks and communicates SDM removals (or whether it does at all) is unclear from the evidence.

## References

- [Who is vfmaddrnd231pd? — purplesyringa (the original investigation)](https://purplesyringa.moe/blog/who-is-vfmaddrnd231pd/)
- [vfmaddrnd231pd: Intel documented an FMA rounding instruction that never shipped — deniz.in (follow-up)](https://deniz.in/vfmaddrnd231pd-intel-documented-an-fma-rounding-instruction-that-never-shipped)
- [Intel's manual described an instruction no CPU ever executed — lavx.hu (follow-up)](https://news.lavx.hu/article/intel-s-manual-described-an-instruction-no-cpu-ever-executed)
- [Hacker News discussion](https://news.ycombinator.com/item?id=50063138)
- [FMA instruction set — Wikipedia (family overview)](https://en.wikipedia.org/wiki/FMA_instruction_set)
- [Intel 64 and IA-32 Architectures SDM (current manual)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
