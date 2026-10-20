---
title: 'JEP 546: Adaptive Heap Sizing for ZGC (JDK 28)'
diataxis: Explanation
domain: programming
topic: java
source: The Java Magazine (inside.java)
source_url: https://inside.java/2026/10/19/jep546-target-jdk28/
date: 2026-10-20
keywords:
- knowledge-base
- java
- programming
- explanations
---
# JEP 546: Adaptive Heap Sizing for ZGC (JDK 28)

JEP 546 (owner Erik Österlund, status *Targeted* for JDK 28, component hotspot/gc, issue JDK-8377305) makes ZGC
manage its own heap size. Instead of you choosing `-Xmx` and `-XX:SoftMaxHeapSize` by hand, you run:

```bash
java -XX:+UseZGC -XX:+ZAdaptiveHeapSizing [ -XX:ZGCIntensity=N ] ...
```

and ZGC continuously trades memory for GC CPU usage until it reaches the target you imply. Combined with the
startup/warmup work of JEP 545, the JEP's claim is that setting `-Xmx` or `-XX:SoftMaxHeapSize` "will be neither
necessary nor desirable."

## Why manual heap sizing is hard

ZGC is a *tracing* collector: a collection cycle's CPU cost scales with the number and size of *live* objects,
**not** with heap size. GC starts when the heap is nearly full, so — all else equal — a larger heap means *less
frequent* collection and less GC CPU over time, while a smaller heap means more. GC CPU usage varies inversely
with heap size.

That gives two failure modes for a hand-picked `-Xmx`:

- **Too small** → more frequent GC, degraded performance, possible out-of-memory.
- **Too large** → the OS runs out of physical memory, starts swapping, or kills processes.

The existing escape hatch, the *soft maximum heap size* (`-Xmx5G -XX:SoftMaxHeapSize=2G`), lets ZGC keep the heap
below a low target but expand under allocation pressure. But choosing the soft maximum is no easier than choosing
the hard maximum, and a bad soft maximum has the same failure modes. Measuring the right values requires running
the app under representative workloads at several `-Xmx` values — an experiment that is rarely done right, must be
redone on every app/JVM update, and does not port across hardware.

## What the policy does

With adaptive heap sizing enabled, ZGC:

1. **Defaults the maximum heap to ~100% of physical memory minus a small reserve** (the HotSpot default today is
   25% of physical memory — e.g. a 128 GB host gives a 32 GB heap).
2. **Adaptively expands and contracts the heap** to hold GC CPU usage at the target level:
   - if GC CPU usage rises above the target → expand the heap at the end of the next GC cycle (CPU usage falls,
     throughput improves);
   - if GC CPU usage drops below the target → contract the heap (CPU usage rises, throughput declines).
   - Adjustments are *smoothed over time* to avoid disruptive swings (following Tavakolisomeh et al.,
     *Heap Size Adjustment with CPU Control*).
3. **Rebalances the young/old generations** (ZGC is generational): if a series of minor collections pushes GC CPU
   usage above target, ZGC expands the heap immediately.
4. **Acts as a good neighbor** by monitoring the JVM's share of the *host's* memory and CPU:
   - large memory share + small CPU share → contract the heap (trade memory for CPU, free memory for others);
   - small memory share + large CPU share → expand the heap (trade CPU for memory).
   - Being a good neighbor *takes priority over* the target intensity: ZGC biases the target up or down as needed,
     so several adaptive JVMs on one host settle into a fair division of resources.

### Tuning: `ZGCIntensity`

`-XX:ZGCIntensity=N` (positive integer, **default 5**) sets the *target intensity* of GC work:

- lower values → ZGC collects less often, uses less CPU, but keeps a larger heap;
- higher values → ZGC collects more often, uses more CPU, keeps a smaller heap.

```bash
# a bit less CPU, a bit more memory than default:
java -XX:+UseZGC -XX:+ZAdaptiveHeapSizing -XX:ZGCIntensity=4 ...
```

Intensity is deliberately an *abstract* measure — the mapping to actual CPU usage is intentionally unspecified so it
can change across releases, which also makes the setting portable across hardware.

## Case study: one 16 GB container, four JVMs

A 16 GB container runs a SPECjbb2015 instance (5,000 req/s), then an H2 in-memory database benchmark alongside it,
then two more SPECjbb2015 instances — monitored for 42 minutes:

| Phase | What runs | What ZGC does |
|---|---|---|
| 0–12 min | SPECjbb2015 alone | heap expands slowly until a good size is found; CPU not excessive |
| 12–24 min | + H2 database | H2 bursts to a large heap; SPECjbb **immediately contracts** so the database can take a larger memory share; SPECjbb keeps 5,000 req/s but with higher GC CPU (worse latency/throughput) |
| 24 min | H2 exits | SPECjbb **rapidly expands** back into the freed memory; latency and throughput recover |
| 30 min+ | + 2 more SPECjbb2015 | within ~2 minutes the three JVMs **evenly divide** the container's memory, each at 5,000 req/s |

The point: no per-JVM `-Xmx`, no tuning, yet all co-tenants run well — the adaptive policy *is* the good-neighbor
soft-maximum behavior, done automatically.

## Risks and alternatives

- **Risk**: with the feature enabled, the default maximum heap jumps from 25% of physical memory to ~100% minus a
  small reserve, so ZGC may use far more memory than past releases and starve other processes. (Even the old
  default carried that risk when several default JVMs ran in parallel.)
- **Rejected alternative**: a *target memory residency* knob (ratio of live data to heap, as some other language
  GCs offer). For a given residency, GC CPU usage can vary dramatically, measuring live data is hard in generational
  GCs, and GC CPU is what users actually monitor.

## Related notes

- [ZGC's decade of low-latency GC](explanation-zgc-decade-of-low-latency-gc.md) — the collector design this builds on (JEP 377)
- [ZGC weak reference processing](explanation-zgc-weak-reference-processing.md)
- [JDK 26 performance improvements](explanation-jdk-26-performance-improvements.md)

## References

- [JEP 546: Adaptive Heap Sizing for ZGC](https://openjdk.org/jeps/546) (targeted for JDK 28)
- [JEP 545: Faster Startup and Warmup with ZGC](https://openjdk.org/jeps/545) — the companion startup/warmup work
- [JEP 377: The Z Garbage Collector](https://openjdk.org/jeps/377)
- [The Java Magazine: JEP 546 targeted at JDK 28](https://inside.java/2026/10/19/jep546-target-jdk28/)
- [ZGC soft max heap size background](https://malloc.se/blog/zgc-softmaxheapsize)

## Diagram
```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "kb-pipeline",
  "elements": [
    {
      "type": "text",
      "id": "t-1",
      "x": 80,
      "y": 30,
      "width": 420,
      "height": 30,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-2",
      "version": 1,
      "versionNonce": "v-3",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "JEP 546: ZGC Adaptive Heap Sizing",
      "fontSize": 24,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 19,
      "containerId": null,
      "originalText": "JEP 546: ZGC Adaptive Heap Sizing",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "z-a",
      "x": 320,
      "y": 120,
      "width": 360,
      "height": 60,
      "angle": 0,
      "strokeColor": "#2b5a8c",
      "backgroundColor": "#cfe0f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-1",
      "version": 1,
      "versionNonce": "v-2",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "z-a-t",
      "x": 340,
      "y": 140,
      "width": 208,
      "height": 20,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-3",
      "version": 1,
      "versionNonce": "v-4",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Workload + ZGC cycles",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Workload + ZGC cycles",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "z-b",
      "x": 320,
      "y": 230,
      "width": 360,
      "height": 60,
      "angle": 0,
      "strokeColor": "#8c5a2b",
      "backgroundColor": "#f0e0cf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-5",
      "version": 1,
      "versionNonce": "v-6",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "z-b-t",
      "x": 340,
      "y": 250,
      "width": 381,
      "height": 18,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-7",
      "version": 1,
      "versionNonce": "v-8",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Measure GC CPU vs target (ZGCIntensity=5)",
      "fontSize": 15,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Measure GC CPU vs target (ZGCIntensity=5)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "z-c",
      "x": 60,
      "y": 350,
      "width": 280,
      "height": 70,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-9",
      "version": 1,
      "versionNonce": "v-10",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "z-c-t",
      "x": 75,
      "y": 365,
      "width": 572,
      "height": 35,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-11",
      "version": 1,
      "versionNonce": "v-12",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "CPU above target\n-> expand heap at end of next GC cycle (smoothed)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "CPU above target\n-> expand heap at end of next GC cycle (smoothed)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "z-d",
      "x": 600,
      "y": 350,
      "width": 280,
      "height": 70,
      "angle": 0,
      "strokeColor": "#7a2b7a",
      "backgroundColor": "#f0d8f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-13",
      "version": 1,
      "versionNonce": "v-14",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "z-d-t",
      "x": 615,
      "y": 365,
      "width": 381,
      "height": 35,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-15",
      "version": 1,
      "versionNonce": "v-16",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "CPU below target\n-> contract heap (smoothed)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "CPU below target\n-> contract heap (smoothed)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "z-e",
      "x": 320,
      "y": 470,
      "width": 360,
      "height": 70,
      "angle": 0,
      "strokeColor": "#5a2b7a",
      "backgroundColor": "#e8d8f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-17",
      "version": 1,
      "versionNonce": "v-18",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "z-e-t",
      "x": 335,
      "y": 485,
      "width": 564,
      "height": 35,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-19",
      "version": 1,
      "versionNonce": "v-20",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Good neighbor: host memory/CPU share\n(takes priority over target)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "Good neighbor: host memory/CPU share\n(takes priority over target)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "z-arr1",
      "x": 500,
      "y": 180,
      "width": 1,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-21",
      "version": 1,
      "versionNonce": "v-22",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          0,
          50
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "z-arr2",
      "x": 400,
      "y": 290,
      "width": 200,
      "height": 60,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-23",
      "version": 1,
      "versionNonce": "v-24",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -200,
          60
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "z-arr3",
      "x": 600,
      "y": 290,
      "width": 140,
      "height": 60,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-25",
      "version": 1,
      "versionNonce": "v-26",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          140,
          60
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "z-arr4",
      "x": 500,
      "y": 330,
      "width": 1,
      "height": 20,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-27",
      "version": 1,
      "versionNonce": "v-28",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          0,
          20
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "z-arr5",
      "x": 500,
      "y": 390,
      "width": 1,
      "height": 80,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-29",
      "version": 1,
      "versionNonce": "v-30",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          0,
          80
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "z-note",
      "x": 280,
      "y": 570,
      "width": 607,
      "height": 17,
      "angle": 0,
      "strokeColor": "#555555",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-31",
      "version": 1,
      "versionNonce": "v-32",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "JDK 28: java -XX:+UseZGC -XX:+ZAdaptiveHeapSizing [-XX:ZGCIntensity=N]",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "JDK 28: java -XX:+UseZGC -XX:+ZAdaptiveHeapSizing [-XX:ZGCIntensity=N]",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```
