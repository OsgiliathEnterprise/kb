---
title: 'ZGC: A Decade of Redefining Java Performance'
diataxis: Explanation
domain: programming
topic: java
source: Inside Java
source_url: https://inside.java/2026-06-30/zgc-performance-decade/
date: 2026-09-05
keywords:
- knowledge-base
- java
- programming
- explanations
---
# ZGC: A Decade of Redefining Java Performance

ZGC (the "Z" Garbage Collector) has evolved over the past decade from an experimental feature in JDK 11 into a production-ready concurrent collector powering latency-critical services worldwide. This note summarizes the retrospective talk by Stefan Johansson (Oracle, Java Platform Group) at JavaOne 2026, covering ZGC's history, internal mechanisms, performance in recent JDKs, and future plans.

## Why ZGC exists

Ten years ago, one of Java's biggest performance problems was long GC pause times: "mostly concurrent" collectors like G1 and CMS still did substantial work inside stop-the-world pauses. ZGC's guiding principle is **concurrency** — all heavy GC tasks (marking, relocation, class unloading) run alongside application threads, leaving only tiny synchronization pauses so that application threads and GC threads agree on the current phase.

The initial goal was pause times below 10 ms; today's refined goal is **always below 1 millisecond**, with remaining pauses existing purely for synchronization (phase agreement during marking or object relocation).

## Milestones across the decade

| JDK | Milestone |
| --- | --- |
| 11 | ZGC released as an experimental feature (`-XX:+UnlockExperimentalVMOptions -XX:+UseZGC`) |
| 12 | Concurrent class unloading — no more stop-the-world during class loading/unloading |
| 15 | Production-ready (no longer experimental) |
| 16 | Concurrent thread stack scanning |
| 17 | Pauses reduced to synchronization-only; non-generational mode |
| 21 | Generational ZGC becomes the default out of the box (`-XX:+ZGenerational`) |
| 25/26 | Best-in-class worst-case pauses; generational throughput gains; automatic heap sizing on the roadmap |

## How it achieves low latency

- **Concurrent everything**: marking, object relocation (copying), and class unloading all happen concurrently with application threads.
- **Colored pointers / load barriers**: ZGC uses pointer tagging so that application threads can detect stale references cheaply at load time instead of requiring write barriers for every reference store — this is what keeps the collector concurrent without stalling the app.
- **Generational collection (JDK 21+)**: a young generation lets ZGC handle much higher allocation rates, avoid allocation stalls on smaller heaps, and use less CPU than non-generational mode. This was roughly two years of focused work and is what made ZGC suitable for far more workloads — it now scales from a few hundred megabytes up to terabyte-sized heaps.
- **Pause semantics**: pauses are only used to synchronize phases (e.g., "we are relocating objects now"), typically in the low hundreds of microseconds even at large heap sizes.

## Performance picture (SPECjbb 2015, fixed load)

- JDK 11 ZGC: average pause ~1 ms, worst pauses just under 5 ms — versus G1's default pause target of 200 ms and observed worst-case pauses around 250 ms at the time.
- JDK 17/21 (non-generational): worst-case pauses in the low hundreds of microseconds; further reduced in JDK 25 with generational mode.
- Throughput: significant boost from JDK 11 → JDK 17, a big jump again at JDK 25 (partly GC improvements, partly JIT and platform work). Enabling `-XX:+ZGenerational` on older releases recovers much of the gain.

## When to use it

If you care about short, deterministic response times — trading platforms, real-time APIs, anything where a 100 ms pause is unacceptable — ZGC is the default recommendation in modern JDKs. The main requirement is **heap headroom**: ZGC needs enough free space to finish concurrent cycles before allocation catches up; with sufficient room it works well for essentially all workloads.

## What's next: automatic heap sizing

The remaining manual knob is `-Xmx`, and picking an optimal heap size is genuinely hard (it depends on workload, memory pressure, CPU). The roadmap feature under discussion is **automatic heap sizing**: the JVM dynamically adjusts heap allocation across multiple instances based on system memory and CPU pressure, removing manual heap configuration entirely.

## Key takeaways

1. Java is a strong choice for low-latency workloads; if you need short deterministic response times, use ZGC.
2. Generational mode (default since JDK 21) is the biggest recent improvement — it raises throughput and lowers CPU cost without hurting pause times.
3. Give ZGC heap headroom; stalls happen when concurrent cycles can't keep up with allocation.
4. Watch for automatic heap sizing to eliminate the last major tuning knob.

## Diagram: ZGC evolution timeline

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "zgc-timeline-box-1",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 150,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 101,
      "versionNonce": 101,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "zgc-text-1",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "zgc-timeline-box-2",
      "type": "rectangle",
      "x": 230,
      "y": 80,
      "width": 150,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 102,
      "versionNonce": 102,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "zgc-text-2",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "zgc-timeline-box-3",
      "type": "rectangle",
      "x": 420,
      "y": 80,
      "width": 150,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 103,
      "versionNonce": 103,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "zgc-text-3",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "zgc-timeline-box-4",
      "type": "rectangle",
      "x": 610,
      "y": 80,
      "width": 150,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 104,
      "versionNonce": 104,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "zgc-text-4",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "zgc-timeline-box-5",
      "type": "rectangle",
      "x": 800,
      "y": 80,
      "width": 170,
      "height": 70,
      "angle": 0,
      "strokeColor": "#2f9e44",
      "backgroundColor": "#b2f2bb",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "dashed",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 105,
      "versionNonce": 105,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "zgc-text-5",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "zgc-arrow-1",
      "type": "arrow",
      "x": 192,
      "y": 115,
      "width": 36,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 106,
      "versionNonce": 106,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 36,
          "y": 0
        }
      ]
    },
    {
      "id": "zgc-arrow-2",
      "type": "arrow",
      "x": 382,
      "y": 115,
      "width": 36,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 107,
      "versionNonce": 107,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 36,
          "y": 0
        }
      ]
    },
    {
      "id": "zgc-arrow-3",
      "type": "arrow",
      "x": 572,
      "y": 115,
      "width": 36,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 108,
      "versionNonce": 108,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 36,
          "y": 0
        }
      ]
    },
    {
      "id": "zgc-arrow-4",
      "type": "arrow",
      "x": 762,
      "y": 115,
      "width": 36,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "dashed",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 109,
      "versionNonce": 109,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 36,
          "y": 0
        }
      ]
    },
    {
      "id": "zgc-text-1",
      "type": "text",
      "x": 55,
      "y": 92,
      "width": 120,
      "height": 46,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 110,
      "versionNonce": 110,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "JDK 11-12\nexperimental,\nconcurrent class unloading",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "JDK 11-12\nexperimental,\nconcurrent class unloading",
      "lineHeight": 1.25
    },
    {
      "id": "zgc-text-2",
      "type": "text",
      "x": 245,
      "y": 92,
      "width": 120,
      "height": 46,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 111,
      "versionNonce": 111,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "JDK 15-16\nproduction ready,\nconcurrent stack scanning",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "JDK 15-16\nproduction ready,\nconcurrent stack scanning",
      "lineHeight": 1.25
    },
    {
      "id": "zgc-text-3",
      "type": "text",
      "x": 435,
      "y": 92,
      "width": 120,
      "height": 46,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 112,
      "versionNonce": 112,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "JDK 17-21\nsync-only pauses,\ngenerational default (21)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "JDK 17-21\nsync-only pauses,\ngenerational default (21)",
      "lineHeight": 1.25
    },
    {
      "id": "zgc-text-4",
      "type": "text",
      "x": 625,
      "y": 92,
      "width": 120,
      "height": 46,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 113,
      "versionNonce": 113,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "JDK 25-26\nsub-ms worst-case pauses,\nTB-scale heaps",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "JDK 25-26\nsub-ms worst-case pauses,\nTB-scale heaps",
      "lineHeight": 1.25
    },
    {
      "id": "zgc-text-5",
      "type": "text",
      "x": 815,
      "y": 92,
      "width": 140,
      "height": 46,
      "angle": 0,
      "strokeColor": "#2f9e44",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 114,
      "versionNonce": 114,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "Roadmap\nautomatic heap sizing\n(no manual -Xmx)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Roadmap\nautomatic heap sizing\n(no manual -Xmx)",
      "lineHeight": 1.25
    },
    {
      "id": "zgc-title-text",
      "type": "text",
      "x": 40,
      "y": 20,
      "width": 300,
      "height": 25,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 115,
      "versionNonce": 115,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "ZGC evolution: JDK 11 (2018) to JDK 26",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "containerId": null,
      "originalText": "ZGC evolution: JDK 11 (2018) to JDK 26",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

## References

- [ZGC: A Decade of Redefining Java Performance (Inside Java, Stefan Johansson)](https://inside.java/2026-06-30/zgc-performance-decade/) — original talk summary and article
- [JavaOne 2026 ZGC session video](https://www.youtube.com/watch?v=Of0fvtIRwzY)
- [ZGC - Paving the GC On-Ramp (Inside Java, Erik Österlund)](https://inside.java/2025-07-10/javaone-zgc/) — companion talk on ZGC configuration pitfalls
