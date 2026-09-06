---
title: Performance Improvements in JDK 26
diataxis: Explanation
domain: programming
topic: java
source: Inside Java
source_url: https://inside.java/2026-06-09/jdk-26-performance-improvements/
date: 2026-09-06
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Performance Improvements in JDK 26

JDK 26 is the latest feature release of the Java platform with more than **2500 issues fixed**, over a thousand of them enhancements. This note summarizes the notable performance work across four areas: **JDK Libraries, Garbage Collectors, Compiler, and Runtime** (source: Ana-Maria Mihalceanu & Per-Ake Minborg, Inside Java).

## JDK Libraries

- **Lazy Constants API preview (`java.lang.LazyConstant`)** — an object holding a single unmodifiable value initialized on demand. After initialization the JVM can treat the value as constant (constant folding), like `final` fields, without eager constructor/class-initializer work. At-most-once initialization and thread safety are preserved; if threads race, one wins and publishes safely. Under the hood it relies on JVM support for "stable" fields — repeated accesses optimize aggressively provided the `LazyConstant` itself lives in a `final` field.
- **Faster `MemorySegment::getString` (JDK-8362893)** — string extraction from off-heap memory now reduces intermediate allocation and copying; early benchmarks show lower latency across sizes, with particularly large gains for short strings. Makes `getString` viable on hot paths converting native/off-heap data to Java strings (less per-call latency, less allocation pressure, indirectly less GC activity).
- **Record `hashCode()` speedups** — automatically generated record hash codes are now as fast as hand-written implementations; matters because records are commonly used as Map keys / Set elements.
- **Crypto algorithm improvements** — targeted work on AES, ML-DSA, and Elliptic Curve P-256: less unnecessary key-setup work, improved low-level arithmetic, CPU-specific intrinsics (JDK-8371820, JDK-8371450, JDK-8371259, JDK-8365581).
- **`GZIPInputStream` single-stream speedup (JDK-8374644)** — faster when reading a single compressed stream from a byte array or socket.
- **`Charset` migrated to the lazy constant approach (JDK-8359119)**, and **`Method::equals` short-circuit (JDK-8371319)** — returns true immediately for the same instance, noticeable in dynamic proxies where equality checks happen during method dispatch.

## Garbage Collectors

### JEP 522: G1 throughput via a second card table

G1's write barrier historically synchronized application threads with background card-table optimizer threads. JDK 26 introduces a **dual card table**:

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "t1", "type": "rectangle", "x": 40, "y": 60, "width": 230, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Active card table\n(updated by app threads,\nNO synchronization)", "fontSize": 14, "fontFamily": 1}}, {"id": "t2", "type": "rectangle", "x": 360, "y": 60, "width": 230, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#ffec99", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Optimizer card table\n(background threads scan,\ninitially empty)", "fontSize": 14, "fontFamily": 1}}, {"id": "a1", "type": "arrow", "x": 270, "y": 95, "width": 90, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [90, 0]]}, {"id": "a1_lbl", "type": "text", "x": 275, "y": 70, "width": 80, "height": 20, "text": {"content": "atomic swap"}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}, {"id": "a2", "type": "arrow", "x": 475, "y": 95, "width": -90, "height": 0, "strokeColor": "#868e96", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-90, 0]]}, {"id": "a2_lbl", "type": "text", "x": 300, "y": 115, "width": 160, "height": 20, "text": {"content": "when scan would exceed\npause-time target"}, "fontSize": 12, "fontFamily": 1, "strokeColor": "#868e96", "backgroundColor": "transparent"}, {"id": "n1", "type": "text", "x": 40, "y": 175, "width": 560, "height": 60, "text": {"content": "Write barriers shrink from ~50 to ~12 instructions on x64.\nCost: extra card table ~= 0.2% of heap (~2MB native per GB).\nResult: 5-15% throughput gain in reference-heavy workloads,\nup to ~5% when reference updates are light; slight pause reduction."}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```

- App threads always update the **active** table without synchronization — write barriers become simpler and faster (x64: ~50 → ~12 instructions).
- Optimizer threads work independently on the second table; when G1 predicts scanning the active table would exceed the pause-time target, it **atomically swaps** the tables.
- Measured results: **5–15% throughput gains in reference-heavy workloads**, up to ~5% even with light reference updates; slight pause reduction; memory cost of an extra card table ≈ 0.2% of heap (~2 MB native per GB).

### JEP 516: Ahead-of-Time object caching works with any GC (including ZGC)

The HotSpot AOT cache previously could not be used with all collectors because GCs represent object references differently (compressed vs uncompressed pointers, region/large-object placement rules — G1 vs ZGC). JDK 26 adds an optional **GC-agnostic object format**: the JVM can memory-map cached objects directly into the heap for fast startup/warmup without forcing a trade-off against low-latency GCs. The JDK ships two baseline AOT caches (one per format) so the JVM can choose between mapping and streaming even when an application provides no cache of its own; after training, a heuristic picks which format to generate.

## Runtime

- **Default initial heap is now `MinHeapSize` (JDK-8371986)** — without an explicit `-Xms`, the JVM no longer applies a default `InitialRAMPercentage`; it starts at the minimum possible heap and grows as needed. Less heap metadata initialized up front → faster startup, most visible for applications on default JVM configuration.
- **Virtual threads can yield during class initialization** — waiting virtual threads are preemptible in common class-init paths, reducing carrier-thread blocking/starvation under bursts of class loading or initialization.

## Compiler (JIT)

- **C2 handles methods with very large parameter lists** — such hot methods now compile with C2 instead of staying on C1/interpreter paths.
- **Improved loop-vectorization cost model** — better decisions about when SIMD-style execution actually pays off, accounting for the extra data shuffling/packing work vectorization can introduce.

## Practical implications

| Change | Who benefits | Action needed |
| --- | --- | --- |
| G1 dual card table (JEP 522) | Reference-heavy apps on G1 | None — default behavior; watch for ~0.2% heap overhead |
| AOT cache + ZGC (JEP 516) | Latency-sensitive apps wanting fast startup *and* low-latency GC | Enable/use the AOT cache; no GC change required |
| `MinHeapSize` default initial heap | Any app without explicit `-Xms` | None — verify memory growth behavior in staging if you relied on pre-allocated headroom |
| Lazy Constants API preview | Libraries with expensive one-time initialization | Opt-in via preview flag (`--enable-preview`) |

## Related notes

- [ZGC: A Decade of Redefining Java Performance](explanation-zgc-decade-of-low-latency-gc.md) — background on ZGC's generational design, which JEP 516 now pairs with the AOT cache.
- [Exploiting GPU Tensor Cores from Java using Babylon and HAT](../../../examples/programming/java/example-babylon-hat-gpu-tensor-cores-from-java.md)

## References

- [Performance Improvements in JDK 26 (Inside Java)](https://inside.java/2026-06-09/jdk-26-performance-improvements/)
- [JDK 26 tag archive (Inside Java)](https://inside.java/tag/jdk-26/)
