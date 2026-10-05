---
title: Making Arena.ofConfined() Even Cheaper in JDK 28 — Pooled Native-Memory Arenas
diataxis: Explanation
domain: programming
topic: java
source: inside java
source_url: https://inside.java/2026/10/05/confined-pools/
date: 2026-10-05
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Making Arena.ofConfined() Even Cheaper in JDK 28 — Pooled Native-Memory Arenas

Starting with **JDK 28**, the Foreign Function and Memory (FFM) API serves small allocations from **reusable native-memory pools** when applications use `Arena.ofConfined()` — a transparent optimization that requires *no source code changes* while substantially reducing the cost of common FFM usage patterns. This is an explanation of how pooling works, why it's safe, and who benefits (JDK-8385697, OpenJDK PR #31365).

## Why small native allocations are the target

Confined arenas are routinely used as temporary scratch space around a single native call:

```java
try (Arena arena = Arena.ofConfined()) {
    MemorySegment result = arena.allocate(ValueLayout.JAVA_INT);
    nativeFunction.invokeExact(result); // writes result into the segment
    return result.get(ValueLayout.JAVA_INT, 0);
}
```

This pattern gives deterministic lifetime + strong thread confinement. Before JDK 28, even a tiny allocation could involve the regular native allocator **plus** registration of an associated cleanup action — bookkeeping that can cost *more* than actually touching the allocated memory (e.g. handling `errno` from a syscall).

Source and runtime analyses confirmed the pattern is dominated by tiny sizes: in one instrumented test-suite run, some confined arenas allocated **no native memory at all**, and more than 99.99% of those that did used **less than 64 bytes**. The distribution strongly favored a small, lazy pool.

## How pooling works

- Each **platform thread** lazily maintains a small cache of native-memory pools — by default **four pools of 64 bytes each** (sizes configurable to 8/16/32/64; set the power-of-two size to zero to disable pooling entirely).
- A confined arena does **not** acquire a pool at creation. Acquisition is deferred until its first allocation that can benefit from pooling — so arenas that never allocate native memory create no pool.
- Once acquired, the pool belongs **exclusively** to that arena; suitable allocations are carved sequentially from it:

```
64-byte pool
0          8         16    20                          63
+----------+----------+-----+-------------------- ... --+
| pointer  |   long   | int | remaining capacity  ...   |
+----------+----------+-----+-------------------- ...--+
```

- If an allocation doesn't fit, or needs alignment the pool can't guarantee, it falls back to the regular path — pooling is purely **opportunistic**.
- On close, the used portion of the pool is cleared and returned to the thread cache; if the cache is full, the pool is released to the native allocator. Because each arena owns its pool exclusively, **nested confined arenas stay isolated** (up to four nested arenas supported).

## Virtual threads: borrow from the carrier

Creating a native-memory cache in every virtual thread would destroy their small footprint. Instead, a virtual thread **temporarily acquires a pool from its current carrier thread**. The virtual thread is pinned only during that short handoff; the pool is then detached from the carrier cache and owned by the arena, so the virtual thread can migrate safely while the arena stays open. On close, the pool returns to the (possibly different) carrier it's mounted on. This avoids adding a native-memory cache to potentially millions of virtual threads while preserving exclusive ownership.

## Preserving safety

Pooling does **not** change `Arena` lifetime or accessibility rules: after an arena closes its scope is dead and its segments inaccessible. Before any pool becomes reusable, the portion used by the previous arena is **zeroed out**, and newly allocated pools are zero-initialized — preserving the API guarantee that native segments contain zeroes and preventing one arena's data from leaking through a later arena. Regular cleanup actions run *before* the pool is cleared/released (a cleanup action may legitimately access the region via a cleanup segment). Cached pools are deterministically released when their platform/carrier thread terminates; pools belonging to open arenas are detached so they're never accidentally freed by carrier termination or virtual-thread migration.

## Observable behavior change: don't assume 1:1 malloc/free

Segment lifetime is unchanged, but the lifetime of the **underlying native allocation** can differ — closing a pooled arena may return memory to the JDK cache instead of immediately calling `free`. Applications and diagnostic tools must not rely on a one-to-one correspondence between arena allocation and native `malloc`/`free` calls.

## Performance (nominal speedups, tiny confined allocations)

| Platform | 5-byte alloc | 20-byte alloc |
| --- | --- | --- |
| Linux AArch64 | 12.3× | 8.6× |
| Linux x64 | 6.8× | 7.8× |
| macOS AArch64 | 18.6× | 16.8× |
| Windows x64 | 16.8× | 18.9× |

On an Apple M4, pooled `alloc_confined` for 5 bytes measured ~1.05 ns/op vs ~15.86 ns/op without pooling; allocations above the default 64-byte pool size stayed near parity (they use the regular path). Virtual threads show smaller but still substantial gains (~3.2×–5.3×) due to extra carrier-handling overhead. As always, microbenchmark speedups don't translate directly into whole-application speedups — the biggest wins are where arena creation + native allocation + cleanup dominate a short native operation.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "j1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Arena.ofConfined()\nfirst small allocation\ntriggers lazy pool acquire", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "j2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "thread cache:\n4 pools x 64 bytes\n(lazy per platform thread)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "j3",
      "type": "rectangle",
      "x": 560,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "carve small allocs\nsequentially from pool;\nbig/misaligned -> regular path", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "j4",
      "type": "rectangle",
      "x": 300,
      "y": 260,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "arena close: zero used part\n-> return to cache (or free)\nvirtual threads borrow from carrier", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "ja1",
        "type": "arrow",
        "x": 240,
        "y": 105,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ],
    [
      {
        "id": "ja2",
        "type": "arrow",
        "x": 500,
        "y": 105,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ],
    [
      {
        "id": "ja3",
        "type": "arrow",
        "x": 400,
        "y": 150,
        "width": 0,
        "height": 110,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [0, 110]]
      }
    ]
  ]
}
```

## Who benefits

- FFM bindings that create a confined arena around each native call.
- Generated jextract-style wrappers.
- Small C values/structures, native handles and pointer out-parameters.
- Short strings / byte arrays passed to native code.
- Latency-sensitive code making frequent, inexpensive native calls.

These benefits apply **only** to confined arenas — not the other arena types (global, automatic, shared). The most useful performance improvements are often the ones that don't force developers onto a new API or rewrite working code: pooled confined arenas keep deterministic lifetime, zero-initialization, and thread confinement intact while running considerably faster underneath.

## References

- [Making Arena.ofConfined() Even Cheaper in JDK 28 — Inside Java (Per-Ake Minborg)](https://inside.java/2026/10/05/confined-pools/)
- [JDK-8385697: Add a Pooled Confined Arena](https://bugs.openjdk.org/browse/JDK-8385697)
- [OpenJDK PR #31365 (benchmark config + raw results)](https://github.com/openjdk/jdk/pull/31365)
- [CSR JDK-8390770](https://bugs.openjdk.org/browse/JDK-8390770)
- [Foreign Function and Memory API documentation (JDK 28 early access)](https://download.java.net/java/early_access/jdk28/docs/api/java.base/java/lang/foreign/package-summary.html)
