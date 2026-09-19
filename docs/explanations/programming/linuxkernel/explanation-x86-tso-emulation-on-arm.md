---
title: The Scourge of x86 Emulation — Emulating the x86-TSO Memory Model on ARM
diataxis: Explanation
domain: programming
topic: linux-kernel
source: HackerNews
source_url: https://fex-emu.com/Scourge-of-emulation/
date: 2026-09-19
keywords:
- knowledge-base
- linux-kernel
- programming
- explanations
---
# The Scourge of x86 Emulation — Emulating the x86-TSO Memory Model on ARM

FEX-Emu's first feature article (2026-09-17) covers an ongoing problem that affects *every* application emulated from x86/x86-64 to Linux usermode on ARM: **emulating the x86 Total Store Ordering memory model (x86-TSO)** on ARM's weak-ordering model. The problems are multi-faceted, and some still can't be fully solved at the architecture level.

## What exactly is x86-TSO?

A memory model defines how loads and stores interact in single- and multi-threaded environments. ARM's relaxed (weak) consistency model and x86's TSO variant are basically the two extremes of the spectrum:
- **ARM** — most relaxed; regular loads/stores aren't strictly coherent across processors by default, letting the CPU optimize aggressively (a store isn't immediately visible to other cores; a load isn't guaranteed to see another core's recent write).
- **x86-TSO** — most strict; when a store occurs it is coherently visible to all other processors, and a load sees all logically-prior stores completed. Stores effectively order the visibility of loads (hence "Total Store Ordering").

Be careful distinguishing **consistency** from **atomicity** — related but not the same, and neither is guaranteed in all cases.

ARM's escape hatch: **load-acquire / store-release** instructions (mapping to C++ `std::atomic`'s `memory_order_acquire`/`release`). These force ordering between that class of instruction under ARM's **"Release Consistency sequentially consistent" (RCsc)** model — load-acquires and store-releases must be observed sequentially without reordering, with "barrier-ordered-before" semantics. This replaced the costly explicit memory-barrier instructions required on older ARMv7-and-earlier hardware.

## The humble beginnings: ARMv8.0-a fallback

On ARMv8.0-a (the minimum spec), FEX emulates x86-TSO by turning **every x86 load into an ARM load-acquire** and **every x86 store into a store-release**. This gives effectively the same semantics as x86 — but is actually *more* strict than necessary, because there was no middle-ground instruction that exactly matched. It's exceedingly costly: these instructions were never designed to become the vast majority of executed instructions.

Microbenchmarks (AmpereOne, Cortex-X4, Oryon-3, Cortex-X925, Apple M1) show three of five CPUs significantly hindered by acquire-loads; AmpereOne's release-stores are strikingly low; M1's acquire/LRCPC loads sit well below baseline. On AmpereOne the legacy path is especially bad — using acquire-release for every load imposes strict limitations (loads can no longer be ordered around each other at all), so millions in flight per second perform poorly.

## The fix: FEAT_LRCPC (mandatory since ARMv8.3)

The **FEAT_LRCPC** extension adds new TSO-load instructions and a new **"Release Consistency processor consistent" (RCpc)** memory model on top of RCsc — designed around exactly the requirements x86 emulation needs. Almost all platforms' LRCPC-loads match their regular loads in performance, so once FEX detects this extension it **stops using acquire-loads entirely** and switches to LRCPC-loads — effectively "solved" memory performance for the common case.

The official FEAT_LRCPC has three versions that each patch up the implementation:
- **FEAT_LRCPC** — basic GPR TSO load instructions
- **FEAT_LRCPC2** — small offset immediate to TSO loads
- **FEAT_LRCPC3** — basic vector and stack-based TSO load & store instructions

Even with all three, edge-case behaviour can't be emulated as cleanly as a hardware TSO toggle.

## Apple's path: a hardware TSO mode bit

Apple Silicon took the most direct route: it **added x86-TSO support directly in hardware**. When the CPU feature is toggled, *regular* ARM load/store instructions change behaviour to match what x86 requires — so FEX doesn't even use LRCPC/acquire instructions on Apple (their LRCPC-loads are aliases of acquire-loads). On M1 with TSO mode enabled, aligned and unaligned accesses basically match (~5% store hit), versus the ~70–90% penalties other platforms see. The thread-wide TSO toggle does have some cost (M1 gets ~76% of regular-store performance when enabled), but it's far more tolerable than the alternatives. FEX detects this feature on Asahi Linux and enables it for a "free" improvement.

## Split-locks, alignment faults, and JIT patchpoints

x86 applications don't care about alignment — they access memory however they please, crossing cacheline boundaries ("split-locks"; even the Linux kernel captures these and slows games down). ARMv8.0 requires **natural alignment** (an 8-byte access must sit at offsets 0, 8, 16…), otherwise the CPU raises an **alignment fault**.

FEX's JIT keeps track of emulated x86 load-stores that could fault and inserts a **patchpoint** (a NOP before/after the instruction). When an alignment fault hits one, FEX captures it, patches the code from a load-acquire/store-release to a *basic* load-store wrapped in a data-memory barrier (DMB), then continues. Unaligned accesses on Cortex-X4/X925/Oryon-3 cost roughly 40–70% of aligned performance due to DMB penalties; Apple's TSO mode sidesteps this entirely because the hardware handles unaligned access directly.

**FEAT_LSE2** (implemented by all tested platforms) loosens alignment requirements for acquire/LRCPC/release accesses *and* read-modify-write atomics — but only within a **16-byte granule**. Any access crossing that granule still faults, and x86 apps do unaligned accesses across the whole cacheline. So it reduces occurrences but doesn't solve anything completely.

## Atomic instructions (ARMv8.1-a)

x86 load/stores *usually* complete atomically even when unaligned; ARM's atomicity guarantees are significantly weaker for unaligned accesses (a "tear" is possible). Naturally-aligned accesses get **"single-copy atomicity"** guarantees, and FEAT_LSE2 extends those to any unaligned access within a 16-byte granule — but x86 has single-copy atomicity across a full cacheline.

Starting with ARMv8.1-a, the ISA gained instructions that map directly onto x86 atomics in FEX's JIT:

| x86 | ARMv8.1-a |
| --- | --- |
| LOCK DEC / INC / ADD / SUB / XADD / ADC / SBB | `ldaddal` |
| LOCK NOT / XOR | `ldeoral` |
| LOCK AND | `ldclral` |
| LOCK OR | `ldsetal` |
| LOCK BTC | `ldclralb` |
| LOCK BTR | `ldeoralb` |

## The unsolved edge case: write-combine (WC) memory

The hardest remaining problem is **uncached / write-combine memory** — e.g. a PCIe GPU on an ARM platform. FEX ships a patch ensuring that while it's running, platforms that support it never hit uncached memory; Asahi users with the hardware TSO bit naturally avoid this in the wild (though putting a PCIe GPU on that platform is another story). There's also a quirk where Radeon GPUs on ARM hide all write-combine memory and present it as write-back. For UMA gaming platforms, drivers are forced onto cached buffers to avoid the WC cliff — so PCIe-GPU ARM boxes stay slower until better architectural support lands.

## Looking ahead

FEX started with ARMv8.0-a as a minimum spec; hardware has improved dramatically since (LRCPC, LSE2, Apple's TSO mode). Not all edge cases are resolved at the architecture level yet, but there's genuine ecosystem commitment to improving the worst cases — vendors solving parts of the problem and moving the needle forward for compatibility.

## Diagram

![[x86-tso-emulation-on-arm.excalidraw]]

## References
- [The scourge of x86 emulation (FEX-Emu, 2026-09-17)](https://fex-emu.com/Scourge-of-emulation/)
- [x86-TSO memory model (Wikipedia)](https://en.wikipedia.org/wiki/Processor_consistency#Similarity_to_SPARC_V8_TSO,_IBM-370,_and_x86-TSO_memory_models)
