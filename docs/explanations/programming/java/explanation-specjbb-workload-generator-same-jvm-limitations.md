---
title: Why Running a Workload Generator in the Same JVM as the System Under Test Skews
  Tail Latency
diataxis: Explanation
domain: programming
topic: java
source: inside java
source_url: https://inside.java/2026-09-25/limitations-of-running-a-workload-generator-in-the-same-jvm/
date: 2026-09-25
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Why Running a Workload Generator in the Same JVM as the System Under Test Skews Tail Latency

Jonas Norlinder (Oracle) uses SPECjbb2015's flexibility to quantify what happens when the workload generator shares a JVM with the backend: **GC pauses of the whole application stop request scheduling, and no amount of coordinated-omission correction can recreate traffic that never got sent.**

## The core problem: coordinated omission you cannot correct

A blocking workload generator issues request N+1 only after receiving response N. Three timestamps matter per request: *scheduled* submit time, *actual* submit time, response time. Recording the scheduled time fixes skew from slow responses — but if the **generator itself is suspended by a GC pause**, it simply never schedules requests during that window. The backend queue receives less traffic than reality would have delivered, and tail-latency measurements come out artificially good for exactly the pauses you care about.

## SPECjbb2015 modes

| Mode | Separate JVMs | Serialized traffic | Network stack | Compliant |
| --- | --- | --- | --- | --- |
| Composite | ❌ (same JVM) | ❌ | ❌ | ✅ |
| Composite-Net | ❌ (same JVM) | ✅ | ✅ | ❌ |
| MultiJVM | ✅ | ✅ | ❌ | ✅ |
| Distributed | ✅ | ✅ | ✅ | ✅ |

Only SPECjbb2015 can run generator and backend in the same JVM *or* separate them — which is what makes this controlled comparison possible.

## Experimental setup (non-compliant, latency-focused)

- Composite-Net vs Distributed (pointed at localhost), so communication cost and network stack are equal
- SPECjbb2015 v1.04, OpenJDK 27, `-Xlog:gc*,safepoint`, Linux 6.8.0, transparent huge pages disabled for all collectors
- JFR event recording all request times (minimal overhead/observer effect)
- Injection rate 6000 rps, ≥240 s steady state, **10 JVM invocations per cell**
- Ryzen 9 5900X (24 threads), 128 GB; `-Xms`/`-Xmx` + `AlwaysPreTouch`; internal threading flags pinned
- Memory deliberately asymmetric: Composite-Net gets half the cores and 16 GB total; Distributed gets 22 GB — so latency differences cannot be attributed to starvation

## Findings

- **p99 gap of roughly 2–3×** between Composite-Net and Distributed for collectors with non-trivial GC pauses (G1's default pause target is 200 ms).
- **ZGC shows no discrepancy** — its sub-millisecond pauses never block the generator long enough to matter.
- Absolute values differ hugely: e.g. Serial at 6 GB heap, **1750 ms vs 278 ms** p99; a 34 ms vs 100 ms difference is already an SLA-level gap.
- Plotting scheduled submit time against response time makes the mechanism visible: during a backend GC pause in Composite mode, *no requests are being scheduled at all* — the entire observed difference is the inability to schedule, not slower responses.

## Practical takeaway

If you care about tail latency of a GC'd system, **run the workload generator in its own JVM** (MultiJVM or Distributed). The switch is cheap, it removes an uncorrectable measurement bias, and absolute response times correlate better with real end-user systems.

## References

- [Inside Java — The Limitations of Running a Workload Generator In the Same JVM as the System-Under-Test](https://inside.java/2026-09-25/limitations-of-running-a-workload-generator-in-the-same-jvm/)
- [Jonas Norlinder's original post (full figures)](https://norlinder.nu/posts/The-Limitations-of-Running-a-Workload-Generator-In-the-Same-JVM-as-the-System-Under-Test-f2b798209d4ddda10f738f94578af197/)
- [SPECjbb2015 design document](https://www.spec.org/jbb2015/docs/designdocument.pdf)
