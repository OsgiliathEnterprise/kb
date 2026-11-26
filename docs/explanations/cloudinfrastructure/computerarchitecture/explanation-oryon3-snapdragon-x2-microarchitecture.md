---
title: 'Oryon 3 Microarchitecture: How Qualcomm Reached 5 GHz and 9-Wide Issue in
  Snapdragon X2 Elite'
diataxis: Explanation
domain: cloud-infrastructure
topic: computer-architecture
source: HackerNews (Chips and Cheese)
source_url: https://chipsandcheese.com/p/qualcomms-oryon-3-reaches-the-top
date: '2026-11-26'
keywords:
- knowledge-base
- computer-architecture
- cloud-infrastructure
- explanations
---
# Oryon 3 Microarchitecture: How Qualcomm Reached 5 GHz and 9-Wide Issue

Deep-dive analysis (Chips and Cheese, Chester Lam) of Qualcomm's third-generation in-house
Oryon core as deployed in the **Snapdragon X2 Elite / X2 Elite Extreme**. Qualcomm uses an
*inverted hybrid* strategy: "prime" P-Cores (the strong Oryon 3) outnumber "performance"
E-Cores 2:1, the opposite of Intel's big-little mix. Oryon 3 descends from Oryon 1 (the
phone-only Oryon 2 was a very minor tweak) and competes with AMD Zen 5, Intel Lion Cove, and
Arm Cortex X925 (Nvidia N1X laptops).

## Headline numbers

| Property | Oryon 1 | Oryon 3 |
| --- | --- | --- |
| Clock (max) | 4.3 GHz | **5 GHz** (+16%) |
| Core width | 8 µops/cycle | **9 µops/cycle** (+1 decode slot) |
| ROB capacity | ~680 µops (spec >650) | **~675 µops (spec >650)** — backend largely unchanged |
| L1D | — | **96 KB 6-way, 3-cycle latency** (X925 needs 4 cycles on 64 KB) |
| L2 per P-core cluster | 12 MB (4 cores) | **16 MB (6 cores)** — 2.66 MB/core |
| L1 I$ | 192 KB 6-way, coherent | same, with **13-cycle branch mispredict penalty kept** |
| L1 DTLB | 224 entry 7-way | **256 entry 8-way**; L2 TLB 8K entries |
| Zero-bubble taken branches | within 8 KB footprint | **within 2048-branch footprint** (likely fully decoupled 2048-entry BTB) |
| Instruction stream from L2 | ~2 NOP/cycle | **~4 NOP/cycle** (matches Zen 5 / Lion Cove) |
| Indirect target array | 2048 targets | 2048 targets (2-cycle predictor; 256 targets per branch OK) |
| Return stack | 50 entries, cliff on overflow | 50 entries, **graceful degradation** (like Zen 5's 52) |

Qualcomm added **SVE2 and SME** support, which drove a new **120-entry predicate register
file** (16-bit registers, hooked to all four vector pipes and four load/store pipes);
`WHILE*` predicate-generation ops crack into two µops at 1/cycle through the integer pipes.

## Notable design choices

- **Speed-over-capacity two-level cache, no L3.** 16 MB of CPU-side LLC is small vs Zen 5's 32 MB or Arrow Lake's 36 MB, but Oryon's L2 hits in **20–23 cycles** vs ~46 cycles for a 32 MB Zen 5 L3 — and the 3-cycle 96 KB L1D compensates. Lion Cove is the opposite philosophy: four cache levels.
- **No multi-taken-branch capability** (one taken branch/cycle) while Zen 5, Lion Cove and modern Arm cores do two — plausibly a deliberate timing trade for the 5 GHz target.
- **Store forwarding is robust:** fast forwarding for *all* overlapping load/store cases, including partial overlap (combining in-flight store data + L1D data). 6-cycle dependent store→load (integer), 8 (vector). No zero-cycle case like Zen 5/Lion Cove, but it avoids their 14–19 cycle partial-overlap penalties; Cortex X925 is worst here (12–13 cycles partial).
- **Gather (SVE LD1W):** 1–2 elements/cycle generally, 14-cycle dependent latency (vs Zen 5 AVX2 gather's 19), with an optimization hitting 4/cycle for repeated gathers to the same address — so gathers can use all four LSU pipes.
- **Rename/allocate tricks:** eliminates up to 2 reg-to-reg MOVs/cycle and up to 2 add-immediates/cycle (immediates ≤255) — unchanged from the narrow little core, which slightly limits the 9-wide design in pathological dependent-MOV chains.
- 128-bit vector width is the main competitive weakness vs Zen 5 for vector-heavy workloads.
- Prefetching: evidence of a correlated-miss-caching (CMC) style L1D pointer prefetcher.

## Takeaway

Oryon 3 shows that a *narrow set of targeted frontend upgrades* (a 9th decode slot, a
decoupled 2048-entry BTB, wider L2 instruction fetch) plus a clock climb can beat a full
redesign — the backend was left nearly untouched because Oryon 1's out-of-order machinery
was already ahead of its time. The big remaining gaps vs x86 leaders are multi-taken
branches, 128-bit vectors, and LLC capacity.

## Diagram

See `oryon3-block-diagram.excalidraw` for the frontend → backend → memory structure.

## References

- [Chips and Cheese: Qualcomm's Oryon 3 Reaches the Top](https://chipsandcheese.com/p/qualcomms-oryon-3-reaches-the-top)
- [Related: Oryon little core analysis](https://chipsandcheese.com/p/performance-oryon-qualcomms-little)
- [Related: Oryon 1 original analysis](https://chipsandcheese.com/p/qualcomms-oryon-core-a-long-time-in-the-making)
