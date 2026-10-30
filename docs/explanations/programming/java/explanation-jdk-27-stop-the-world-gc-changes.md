---
title: 'JDK 27: Stop-The-World GC Changes — G1 Becomes the Default Everywhere'
diataxis: Explanation
domain: programming
topic: java
source: Inside Java
source_url: https://inside.java/2026-10-30/jdk27-gc-changes/
date: 2026-10-30
keywords:
- knowledge-base
- java
- programming
- explanations
---
# JDK 27: Stop-The-World GC Changes — G1 Becomes the Default Everywhere

Thomas Schatzl (OpenJDK GC team) walked through the ~350 resolved changes in the GC subcomponent for JDK 27. Rough split: **~50% refactoring/cleanups, ~35% bug fixes and robustness, the remainder new or materially revised behavior**. The last part is what this note covers.

## The headline: JEP 523 — G1 is the default collector in ALL environments

G1 is now the default garbage collector when none is specified on the command line — **no exceptions, in server and non-server environments alike** (unless the distribution doesn't ship G1). The rationale: G1's throughput, footprint and latency profile have been closing in on Serial GC for the workloads where Serial was still preferred, and the previous behavior — picking a collector based on "arcane environmental conditions" — was more of a burden to reason about than an advantage.

- **No change needed** for most apps: if you don't set `-XX:+Use...GC`, you now get G1 in every environment.
- **Escape hatch:** `-XX:+UseSerialGC` still gives you pure, unchanged Serial GC — use it if you observe notable differences for your profile. G1 is "not the best everywhere, but certainly the best to start off with."

## G1 behavioral changes

### Heap sizing no longer fights itself: `MinHeapFreeRatio`/`MaxHeapFreeRatio` default to 0/100

The most impactful G1 fix besides the default change. G1 **no longer resizes the heap after a Full GC** based on the arbitrary `-XX:MinHeapFreeRatio`/`-XX:MaxHeapFreeRatio` percentages: their defaults went from **40/70 to 0/100** (JDK-8238686), which disables that particular heuristic while keeping the flags' functionality intact for anyone who sets them explicitly.

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "r1", "type": "rectangle", "x": 40, "y": 60, "width": 250, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "JDK 26: FreeRatio 40/70\nshrinks heap after Full GC\nbased on arbitrary %", "fontSize": 13, "fontFamily": 1}}, {"id": "r2", "type": "rectangle", "x": 40, "y": 210, "width": 250, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "JDK 27: defaults 0/100\nheuristic disabled\nno post-Full-GC shrink", "fontSize": 13, "fontFamily": 1}}, {"id": "r3", "type": "rectangle", "x": 420, "y": 135, "width": 250, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#ffec99", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "GC-CPU-usage sizing heuristic\n(kept)\nexpands heap when GC takes\ntoo much CPU", "fontSize": 13, "fontFamily": 1}}, {"id": "a1", "type": "arrow", "x": 290, "y": 105, "width": 130, "height": 55, "strokeColor": "#e8590c", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [130, 55]], "text": {"content": "used to FIGHT the other\nheuristic: shrink, then\nimmediately undo (ping-pong)", "fontSize": 12, "fontFamily": 1}}, {"id": "a2", "type": "arrow", "x": 290, "y": 255, "width": 130, "height": -55, "strokeColor": "#2f9e44", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [130, -55]], "text": {"content": "now the CPU-based heuristic\nruns unopposed", "fontSize": 12, "fontFamily": 1}}, {"id": "n1", "type": "text", "x": 40, "y": 330, "width": 620, "height": 40, "text": {"content": "Old defaults made the two sizing heuristics undo each other's heap changes\nright after a full heap GC — unnecessary churn, performance issues.", "fontSize": 13, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```

The original 40/70 defaults made this heuristic **fight the GC-CPU-usage-based heuristic**: a full heap GC would shrink the heap, and the other heuristic would almost immediately undo it — unnecessary Java-heap-size modifications causing performance issues.

### Other G1 fixes

- **Adaptive start of concurrent marking** is now more resistant to adverse conditions that previously caused unnecessary *continuous* concurrent work (JDK-8379846, JDK-8381006).
- **Humongous objects that could actually be reclaimed** were inadvertently held live by weak references (`java.lang.ref.Reference` instances) — fixed (JDK-8378331, JDK-8378336).
- **Observable-behavior notes for instrumentation users:**
  - G1 *Cleanup* pauses no longer update `MemoryPoolMXBean.getCollectionUsage()`, because they don't change the Java heap (JDK-8386332).
  - Collections that could not find enough space to copy to are now **counted in GC CPU usage** (JDK-8373894) — improves heap-sizing decisions.

## Parallel GC

- **Adaptive tenuring threshold can now decrease** (JDK-8380590). The threshold determines how many young collections an object may survive; it previously *only increased*, so a persistently high threshold left older objects occupying most of the survivor space, forcing younger objects to be promoted prematurely. Now the threshold can go down, promoting longer-lived objects sooner while preserving objects likely to die soon in young gen.
- **Heap expansion finally works under repeated large allocations** (JDK-8377561): Parallel GC now correctly grows the Java heap when thousands of Full GCs were triggered even though there was enough headroom.

## Serial GC

No notable Serial-specific changes — except that it **is no longer the default collector in any case**.

## All collectors

- **TLAB sizing** now better handles applications creating many short-lived, lightly allocating threads — avoids oversizing TLABs, which otherwise wastes space and increases collection count (JDK-8381834).
- **String deduplication logging and JFR events improved** (JDK-8372348): logs "new unknown" strings and gives more meaningful aggregate byte counts.

## Cross-cutting refactoring (the "boring" half that matters long-term)

- Cross-thread shared variables in the STW collectors moved from the `volatile` + `AtomicAccess` idiom to explicit **`Atomic<T>`** (JDK-8367013).
- G1 state-machine cleanups, including a very old item (JDK-8080226).
- Infrastructure work for **JEP 401: Value Objects (Preview)** — object iterators and eager reclaim adapted.

## What's next

Focus remains on **Automatic Heap Sizing**: improving control over memory management so G1 can respond more intelligently to external conditions and user intent. (Companion work: JEP 546 adaptive heap sizing for ZGC in JDK 28 — see related note.)

## Practical implications

| Change | Who's affected | Action |
| --- | --- | --- |
| G1 default in all environments (JEP 523) | Any app without an explicit `-XX:+Use...GC`, especially non-server/client profiles that previously got Serial | Re-benchmark client-profile apps (applets-era, embedded, single-core VMs); add `-XX:+UseSerialGC` only where measured differences justify it |
| `MinHeapFreeRatio`/`MaxHeapFreeRatio` → 0/100 (JDK-8238686) | Apps that relied on the old post-Full-GC shrink behavior, or set these flags explicitly | Explicit settings are preserved; unset apps now only use CPU-usage-based sizing — watch heap growth on staging |
| Tenuring threshold can decrease (JDK-8380590) | Parallel GC workloads with mixed object lifetimes | Likely fewer premature promotions; re-check survivor occupancy |
| Failed-copy collections counted in GC CPU (JDK-8373894) | Heap sizing via CPU heuristics | Sizing decisions now include failed collections — expect slightly more responsive expansion |
| Cleanup pauses no longer in `getCollectionUsage()` (JDK-8386332) | Dashboards/alerts parsing MXBean collection usage | Verify monitoring assumptions (e.g., "collections per minute" counters) |

## Related notes

- [Performance Improvements in JDK 26](explanation-jdk-26-performance-improvements.md) — the previous release's GC work (JEP 522 dual card table, AOT cache with ZGC), which JDK 27 builds on.
- [JEP 546: Adaptive Heap Sizing for ZGC (JDK 28)](explanation-jep-546-zgc-adaptive-heap-sizing.md) — the automatic-heap-sizing direction this note's "What's next" points at.
- [ZGC: A Decade of Redefining Java Performance](explanation-zgc-decade-of-low-latency-gc.md)

## References

- [JDK 27 G1/Parallel/Serial GC changes (Inside Java)](https://inside.java/2026-10-30/jdk27-gc-changes/)
- [Full post by Thomas Schatzl](https://tschatzl.github.io/2026/08/10/jdk27-g1-serial-parallel-gc-changes.html)
- [JEP 523: Make G1 the Default Garbage Collector in All Environments](https://openjdk.org/jeps/523)
- [Resolved JDK 27 GC subcomponent issues (JBS)](https://bugs.openjdk.org/issues/?jql=project%20%3D%20JDK%20AND%20status%20%3D%20Resolved%20AND%20fixVersion%20%3D%20%2227%22%20AND%20component%20%3D%20hotspot%20AND%20Subcomponent%20%3D%20gc)
- [Java 27 GA with G1 by default (Phoronix)](https://www.phoronix.com/news/OpenJDK-27-Java-27)
- [The Arrival of Java 27 (Oracle Blogs)](https://blogs.oracle.com/java/the-arrival-of-java-27)
- [Java 27 — JEP 523: G1 becomes the default everywhere (Ron Veen, Tech Blog)](https://ronveen.com/posts/java-27-part-1-jep523-g1-becomes-the-default-everywhere/) — practitioner walk-through of why "it depends" goes away; links to the JEP 522 double-buffering work that made G1-default feasible.
