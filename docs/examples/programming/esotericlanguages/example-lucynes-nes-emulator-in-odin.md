---
title: 'lucyNES: A NES Emulator in Odin — Allocation Strategy and Bitfield Registers'
diataxis: Example
domain: programming
topic: esoteric-languages
source: lucypero.com via HackerNews
source_url: https://lucypero.com/lucynes.html
date: 2026-11-15
keywords:
- knowledge-base
- esoteric-languages
- programming
- examples
---
# lucyNES: A NES Emulator in Odin — Allocation Strategy and Bitfield Registers

[lucyNES](https://github.com/lucypero/lucynes) is a NES emulator written in [Odin](https://odin-lang.org/) over ~7 months of spare time (June 2024 – Jan 2025). It runs Battletoads and hundreds of other games correctly, and demonstrates why Odin's C-like, no-GC, bitfield-equipped design fits emulator development unusually well.

## What "working emulator" actually costs

The "NES emulator = weekend project" claim is only true to ~80–90%: getting Donkey Kong up is fast, the last 10% is accuracy. Two hard parts:

- **CPU/PPU timing.** The 6502 CPU and the PPU (graphics chip) run in parallel and communicate; the emulation must model that interleaving accurately or games that depend on precise NES behavior simply won't run.
- **Mappers.** Cartridges are circuitry, not just data — each mapper type (NROM, MMC1, UXROM, CNROM, MMC3, GxROM, AxROM in lucyNES) adds memory banking and behavior. A few mappers cover most games; poorly implemented mappers are the top cause of games failing to boot.

## Odin pattern 1: three-allocator memory strategy

With no automatic memory management, the project uses three allocators matched to object lifetimes:

| Allocator | Lifetime | Use |
|---|---|---|
| Frame temporary allocator | Cleared **every frame** | Scratch/per-frame data |
| Global heap allocator | Program lifetime | Long-lived structures |
| NES arena allocator | One emulator session | Everything NES-state-related |

Clearing the frame allocator per frame replaces per-object free bookkeeping for transient data — a standard arena pattern made concrete.

## Odin pattern 2: raw unions + bit fields for hardware registers

Hardware registers are memory-mapped bitfields — exactly what Odin's `#raw_union` + `bit_field` express. The PPU control register ($2000):

```odin
PpuCtrl :: struct #raw_union {
    // VPHB SINN
    using flags: bit_field u8 {
        n: u8 | 2,
        i: u8 | 1,
        s: u8 | 1, // sprite pattern table address for 8x8 sprites (0: $0000, 1: $1000)
        b: u8 | 1, // bg pattern table address (0: $0000, 1: $1000)
        h: u8 | 1, // sprite size (0: 8x8, 1: 8x16)
        p: u8 | 1,
        v: u8 | 1, // vblank NMI enable
    },
    reg: u8,
}
```

`using flags` embeds the bitfield so named bits and the raw `reg: u8` alias the same byte — read whole-register writes from the CPU while still testing individual bits.

## Odin gotcha: no automatic integer promotion

Unlike C, Odin **never promotes** integer operands to wider types in arithmetic. Coming from C, this silently truncated intermediate results and produced several emulator bugs. Cast explicitly when mixing widths in bit math.

## Odin pattern 3: serializing save states with CBOR

Save states serialize Odin structs with a CBOR library. Odd types (like the `#raw_union` bitfield struct above) aren't serializable out of the box — you must write custom serialization handling per type. (A suspected library bug turned out to be this; see [odin-lang/Odin#4661](https://github.com/odin-lang/Odin/issues/4661).)

## Features and known gaps

Debugger view, menu UI, save states, controller support, CRT shader toggle, partial sound. Missing: DMC audio channel (most games sound wrong), and some mapper implementations are still buggy.

## Reference resources for NES emulation

- [Nesdev Wiki](https://www.nesdev.org/wiki/Nesdev_Wiki) — the hardware bible
- [nesdev Discord](https://discord.com/invite/JSG4kuF8EK)
- [Javidx9's NES series](https://www.youtube.com/watch?v=F8kx56OZQhg) — good starting point, code has mistakes
- [Austin Morlan's PPU rendering overview](https://austinmorlan.com/posts/nes_rendering_overview/#pattern-table)
- [nes-test-roms](https://github.com/christopherpow/nes-test-roms) — test ROMs that pin down specific hardware behaviors; the single biggest accelerator for accuracy work

## References

- [A NES emulator written in Odin — lucypero.com](https://lucypero.com/lucynes.html) (original source)
- [lucypero/lucynes on GitHub](https://github.com/lucypero/lucynes)

Related: [[explanation-pop2-stack-language-for-uxn]]
