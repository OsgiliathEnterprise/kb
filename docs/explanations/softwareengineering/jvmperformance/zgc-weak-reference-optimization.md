---
title: Simplifying Weak Reference Processing in ZGC
diataxis: Explanation
domain: Software-Engineering
topic: JVM-Performance
source: ''
source_url: https://inside.java/2026/06/11/thesis-simplify-weak-reference-processing-zgc
keywords:
- knowledge-base
- JVM-Performance
- Software-Engineering
- explanations
---
# Simplifying Weak Reference Processing in ZGC

## Overview

Research from Uppsala University (thesis work with Oracle's Stockholm GC team) demonstrates that ZGC's weak reference processing overhead can be reduced by up to **81%** through targeted pipeline modifications, and potentially eliminated entirely via a new `@weak` field annotation mechanism.

## The Problem

### Uniform Treatment of Heterogeneous References

Java's `WeakReference` supports two distinct usage patterns:

1. **With queue** — registered with a `ReferenceQueue` for application-level notification on collection
2. **Without queue** — used as a simple weak pointer (caches, interning maps, listener registrations)

Despite this distinction, ZGC's reference-processing pipeline treats **all** weak references uniformly:

- Every discovered reference is linked into an intrusive per-thread linked list via the hidden `discovered` field
- Transferred to the `ReferenceHandler` thread via the pending list
- Iterated by that thread regardless of whether it will actually be enqueued

This mismatch between the optional callback mechanism and unconditional work has been tracked since JDK-8029205 but never addressed.

### Performance Impact

The per-reference processing cost scales linearly with the number of weak references, making it a bottleneck in workloads that allocate many of them. The intrusive linked list also exhibits **poor cache locality** — each `WeakReference` object is scattered across the heap, requiring a new cache line load per reference.

## Four Optimization Mechanisms

### 1. Skip-Enqueue Separation (`sep`)

**Concept:** Route queue-less weak references to a separate per-worker discovered list during the mark phase, bypassing the pending list entirely.

```java
// Key change in ZReferenceProcessor
if (type == REF_WEAK && !has_reference_queue(ref)) {
    weak_no_queue_list_per_worker.append(ref); // bypasses pending list
} else {
    discovered_list_per_worker.append(ref); // normal enqueue pipeline
}
```

**Benefit:** Queue-less references are processed and cleared by GC threads directly, without involving the `ReferenceHandler` thread.

### 2. Dynamic Array (`dyn`)

**Concept:** Replace the intrusive linked list with a contiguous `ZWeakRefArray` allocated on the C heap.

- References appended during discovery in O(1) amortized time
- Sequential iteration during processing with index-based access (L1/L2 cache friendly)
- Array retains capacity between cycles to avoid reallocations

**Benefit:** Eliminates pointer-chasing overhead and enables pre-loading of field data during discovery.

### 3. Optimised Clear Path (`clear_path`)

**Concept:** Simplify the three-step clear operation for queue-less weak references:

| Standard Path | Optimised Path |
|---|---|
| Load barrier to read referent | **Eliminated** — pre-loaded at discovery time |
| Virtual call for reference type | **Eliminated** — statically known |
| CAS via ZGC barrier | **Plain store** — no atomicity needed |

**Benefit:** These three simplifications interact constructively (see results below).

### 4. Weak Fields (`weak_fields`)

**Concept:** Replace `WeakReference` objects with a field-level `@weak` annotation:

```java
// Instead of:
public class Cache {
    private final WeakReference<Value> entry;
}

// With the @weak annotation:
public class Cache {
    private @weak Value entry;
}
```

The `@weak` annotation is recognized by the class-file parser and stored in `fieldInfo` metadata. At GC time, ZGC's marking closure checks each reference field against its `fieldInfo` entries, eliminating the need for separate `WeakReference` objects entirely.

**Benefit:** Eliminates the heap overhead of `WeakReference` objects — no marking, promotion, or relocation across GC cycles.

## Benchmark Results

| Configuration | Non-Strong Processing Reduction |
|---|---|
| `clear_path` only | 7% |
| `dyn` only | 36% |
| `sep` | Moderate (isolated) |
| `clear_path` + `dyn` | **81%** |

The superadditivity (81% >> 7% + 36%) arises because:
- The dynamic array removes the pointer-chasing bottleneck
- Pre-loaded data lets clear logic run without barrier overhead
- Together they eliminate both the traversal AND the per-reference cost

## JDK 25/26 GC Landscape Context

As of JDK 25 (JEP 523), G1 became the universal default across all environments — including constrained ones that previously fell back to Serial GC. However, ZGC and Shenandoah have both gone fully generational and are production-ready:

| Dimension | G1 | ZGC (generational) | Shenandoah (generational) |
|-----------|----|--------------------|---------------------------|
| Pause behavior | 20–200ms typical, up to 500ms large heaps | 0.1–0.5ms typical, sub-millisecond target | Sub-millisecond pauses |
| Generational | Yes (JDK 25 finalized) | Yes (non-generational removed JDK 24) | Yes (finalized JDK 25) |
| Best for | General-purpose, balanced throughput/latency | Large heaps, low-latency requirements | Low-latency, large heaps |

The weak reference optimization research is particularly relevant because ZGC's generational mode increases the frequency of young-generation collections, amplifying the per-reference processing cost that this thesis addresses.

## Implications for JDK 27+

This research directly informs the generational ZGC work being targeted for JDK 27. The key takeaway is that **weak reference processing is a solvable problem** — the question is whether the JDK team adopts pipeline optimizations (lower risk, immediate benefit) or the more radical `@weak` field annotation (higher risk, requires language change).

## Excalidraw Diagram

```
excalidraw://v1
{
  "type": "drawing",
  "elements": [
    {
      "id": "pipeline",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 600,
      "height": 400,
      "strokeColor": "#333",
      "fillColor": "transparent",
      "label": "ZGC Weak Reference Processing Pipeline"
    },
    {
      "id": "mark",
      "type": "rectangle",
      "x": 150,
      "y": 150,
      "width": 150,
      "height": 60,
      "strokeColor": "#666",
      "fillColor": "#f0f0f0",
      "label": "Mark Phase\nDiscovery"
    },
    {
      "id": "pending",
      "type": "rectangle",
      "x": 350,
      "y": 150,
      "width": 150,
      "height": 60,
      "strokeColor": "#666",
      "fillColor": "#f0f0f0",
      "label": "Pending List\nTransfer"
    },
    {
      "id": "handler",
      "type": "rectangle",
      "x": 550,
      "y": 150,
      "width": 150,
      "height": 60,
      "strokeColor": "#666",
      "fillColor": "#f0f0f0",
      "label": "ReferenceHandler\nProcessing"
    },
    {
      "id": "sep-bypass",
      "type": "arrow",
      "x1": 225,
      "y1": 240,
      "x2": 225,
      "y2": 350,
      "strokeColor": "#e74c3c",
      "label": "sep: bypass\n(no-queue refs)"
    },
    {
      "id": "dyn-array",
      "type": "rectangle",
      "x": 150,
      "y": 350,
      "width": 200,
      "height": 40,
      "strokeColor": "#27ae60",
      "fillColor": "#e8f8f0",
      "label": "dyn: ZWeakRefArray\n(contiguous, cache-friendly)"
    },
    {
      "id": "clear-opt",
      "type": "rectangle",
      "x": 400,
      "y": 350,
      "width": 200,
      "height": 40,
      "strokeColor": "#27ae60",
      "fillColor": "#e8f8f0",
      "label": "clear_path: plain store\n(no CAS, no barrier)"
    }
  ]
}
```

## Cross-References

- [JEP 523: G1 Default GC](../G1-Default-GC/jep-523-g1-default-gc-all-environments.md) — Context on JDK 27 GC changes
- [JVM Crash Analysis with jcmd](../../Debugging/JVM-Crash-Analysis/jcmd-post-mortem-analysis.md) — JVM debugging tools
- [JDK 26 Performance Improvements](../JDK-26-Improvements/jdk-26-performance-improvements.md) — Related performance work

## References

- [Original article: Simplifying Weak Reference Processing in ZGC](https://inside.java/2026/06/11/thesis-simplify-weak-reference-processing-zgc)
- [OpenJDK Issue JDK-8029205](https://bugs.openjdk.org/browse/JDK-8029205) — Weak reference processing overhead
- [ZGC Documentation](https://docs.oracle.com/en/java/javase/21/gctuning/z-garbage-collector.html)
- [JavaCodeGeeks: JVM GC Decision in 2026 — G1 vs ZGC vs Shenandoah](https://www.javacodegeeks.com/2026/04/the-jvm-garbage-collector-decision-in-2026-g1-vs-zgc-vs-shenandoah-for-real-workloads.html)
- [OpenJDK ZGC Wiki](https://wiki.openjdk.org/spaces/zgc/pages/34668579/Main)
