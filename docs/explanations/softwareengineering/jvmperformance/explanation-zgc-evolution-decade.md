---
title: 'ZGC Evolution: A Decade of Performance Improvements (JDK 11–26+)'
diataxis: Explanation
domain: Software-Engineering
topic: JVM-Performance
source: ''
source_url: https://inside.java/2026/06/30/zgc-performance-decade/
date: 2026-07-04
keywords:
- knowledge-base
- JVM-Performance
- Software-Engineering
- explanations
---
# ZGC Evolution: A Decade of Performance Improvements (JDK 11–26+)

## Overview

ZGC (Z Garbage Collector) is a low-latency, concurrent garbage collector introduced in OpenJDK. Over the past decade (JDK 11 through JDK 26+), it has evolved from an experimental non-generational collector into a fully generational, production-ready collector capable of sub-millisecond pause times on heaps exceeding 4 TB. This note traces the major architectural changes, performance milestones, and configuration evolution.

---

## Timeline of Major JDK Versions and ZGC Improvements

### JDK 11 (September 2018) — Experimental Introduction

**JEP 333: Z Garbage Collector (Experimental)**

- First production-like release of ZGC
- Target: Pause times `<1ms` for heaps from 8 MB to 16 TB
- Architecture: **Non-generational**, **moving** collector using **colored pointers** and **load barriers**
- Required experimental flags:

```bash
java -XX:+UnlockExperimentalVMOptions -XX:+UseZGC -Xmx8g MyApp
```

- Key metrics from initial benchmarks:
  - 8 GB heap, full GC: `<1ms` pause
  - Allocation throughput: ~2 GB/s on reference hardware (Intel Xeon E5-2699 v3)
  - 32 GB heap, full GC: still `<2ms` pause

- **Architectural innovation**: Colored pointers encode object location metadata in unused address bits (requires 48-bit virtual address space on x64). This eliminates the need for separate forwarding tables used by G1/Shenandoah.

### JDK 12 (March 2019) — Production-Ready (Non-Generational)

**JEP 347: Z Garbage Collector**

- Moved out of experimental status
- Single flag now sufficient:

```bash
java -XX:+UseZGC -Xmx32g MyApp
```

- Added support for **compressed ordinary object pointers (CompressedOops)**, critical for heap sizes ≤32 GB
- Improved allocation performance through better thread-local allocation buffers

### JDK 13 (September 2019) — Page-Based Memory Management

**JEP 348: Page Local Allocation in the Z Garbage Collector**

- Introduced **page-based memory management** — a fundamental architectural change
- Before JDK 13: Objects allocated directly from the heap with global synchronization
- After JDK 13: Each GC thread maintains its own page cache; allocations are page-local, reducing contention
- Allocation throughput improved by **2–3×** in multi-threaded workloads
- New internal structure: `ZPage` objects track memory pages and their state (free, available, used)

```
Page lifecycle: FREE → AVAILABLE → USED → (reclaimed during GC)
```

### JDK 14 (March 2020) — Generational Support (Experimental)

**JEP 354: Generational Z Garbage Collector (Experimental)**

- Introduced generational hypothesis into ZGC: most objects die young
- Added young generation and old generation
- Flag to enable:

```bash
java -XX:+UseZGC -XX:+ZGenerational -Xmx16g MyApp
```

- Young generation collections became significantly cheaper — only scanning young regions
- Old generation collections remained fully concurrent
- Initial benchmarks showed **2–4× reduction** in young GC pause times vs. non-generational ZGC

### JDK 15 (September 2020) — NUMA Awareness

**JEP 356: NUMA Awareness in the Z Garbage Collector**

- Added NUMA (Non-Uniform Memory Access) awareness for large systems
- ZGC now allocates pages on the same NUMA node as the allocating thread
- Critical for servers with multiple NUMA nodes (e.g., dual-socket systems with 256+ GB RAM)
- Benchmark improvement: **10–20% reduction** in allocation latency on NUMA systems
- Configuration:

```bash
# NUMA awareness is automatic when detected; can verify with:
java -XX:+UseZGC -XX:+PrintFlagsFinal | grep -i numa
```

### JDK 16 (March 2021) — Reduced Fragmentation

- Reduced heap fragmentation during compaction
- Improved allocation rate for long-running applications
- Better handling of large object allocations
- Internal: Improved page merging algorithm reduces the number of fragmented page slots

### JDK 17 (September 2021) — LTS with Generational Refinements

- **Long-Term Support (LTS) release** — first LTS with generational ZGC available
- Generational ZGC continued to mature
- Young generation collection frequency increased but with lower per-collection cost
- Better promotion rate heuristics — objects promoted to old gen only after surviving multiple young GCs
- Enhanced GC logging:

```bash
java -XX:+UseZGC -XX:+ZGenerational \
     -Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10m \
     MyApp
```

### JDK 18 (March 2022) — Further Generational Improvements

- Reduced young-gen collection overhead
- Improved concurrent marking efficiency
- Better handling of reference processing (Weak, Soft, Phantom references)
- Young generation sizing became more adaptive

### JDK 19 (September 2022) — Continued Generational Maturity

- Generational ZGC became the **default** when `-XX:+UseZGC` is set (no longer needs `-XX:+ZGenerational`)
- `-XX:+ZGenerational` flag deprecated
- Old generation compaction became more efficient
- Better memory accounting for TLABs (Thread-Local Allocation Buffers)

### JDK 20 (March 2023) — Generational Overhead Reduction

- Reduced generational overhead from young generation boundary tracking
- Improved performance for applications with high allocation rates
- Better handling of humongous (very large) objects

### JDK 21 (September 2023) — LTS, Generational Production-Ready

**Major milestone: Generational ZGC is production-ready**

- Generational mode is now the only mode — the distinction between "generational" and "non-generational" ZGC was effectively eliminated
- First LTS release with production-ready generational ZGC
- Enhanced observability via JDK Mission Control and JFR (Java Flight Recorder)
- ZGC events now include generational metadata (young vs. old collection type)

```bash
# JDK 21+: Just use ZGC — it is generational by default
java -XX:+UseZGC -Xmx64g MyApp

# Verify with JFR:
jcmd <pid> JFR.start name=zgc_profile settings=profile duration=60s
jcmd <pid> JFR.dump name=zgc_profile file=zgc.jfr
```

### JDK 22 (March 2024) — Continued Optimizations

- Further tuning of young generation sizing
- Reduced allocation stall times
- Better concurrent marking for old generation

### JDK 23 (September 2024) — Refinements

- Improved TLAB sizing for generational collections
- Reduced pause time variance (tail latency improvements)
- Better integration with JDK Mission Control

### JDK 24 (March 2025) — Non-Generational Removed

**JEP 460: Remove Support for Non-Generational Mode in ZGC**

- The non-generational ZGC mode was **completely removed**
- All ZGC collections are now generational
- Any remaining `-XX:-ZGenerational` flag is ignored
- Internal code cleanup: removed ~15,000 lines of non-generational code paths
- Simplified ZGC internals, reducing maintenance burden and potential bugs

### JDK 25 (September 2025) — G1 Becomes Universal Default

**JEP 523: G1 as Default GC in All Environments**

- G1 became the default GC everywhere (including constrained environments)
- ZGC remains opt-in via `-XX:+UseZGC`
- ZGC continued to improve: better young-gen collection efficiency, reduced marking overhead
- ZGC's sub-millisecond pause target became more consistent across heap sizes

### JDK 26 (March 2026) — Latest Improvements

- Further generational ZGC optimizations
- Improved handling of weak reference processing (see related note on weak reference pipeline)
- Better allocation throughput in high-contention scenarios
- Continued reduction in tail-latency (p99, p99.9 pause times)

---

## Architecture: How ZGC Works

### Core Mechanism: Colored Pointers

ZGC's distinguishing feature is **colored pointers** — encoding object metadata directly in the pointer value using unused address bits:

```
x64 pointer (64 bits):
┌──────────────────────────────────────────────────┐
│ 48 bits: Object address                          │
├──────────────────────────────────────────────────┤
│ 6 bits:  Page state (free, available, used, etc) │
├──────────────────────────────────────────────────┤
│ 4 bits:  Relocation state (forwarded, etc)       │
├──────────────────────────────────────────────────┤
│ 2 bits:  Reserved / future use                   │
├──────────────────────────────────────────────────┤
│ 4 bits:  Unused (reserved for future expansion)  │
└──────────────────────────────────────────────────┘
```

This eliminates the need for:
- Forwarding pointers (used by G1 and Shenandoah)
- Read-write barriers for every reference access
- Separate remembered sets for tracking cross-region references

### Load Barriers

Since object metadata is in the pointer itself, ZGC uses **load barriers** (not write barriers) to resolve object locations:

```
Application reads reference → Load barrier intercepts →
  If object was relocated → Return new location →
  If object not relocated → Return original location
```

Load barriers are transparent to application code — the JVM inserts them automatically during JIT compilation.

### Generational Architecture (JDK 24+)

```
Heap Layout (Generational ZGC):

┌─────────────────────────────────────────────────────┐
│  OLD GENERATION                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐      │
│  │ Page     │ Page     │ Page     │ Page     │      │
│  │ (large)  │ (large)  │ (large)  │ (large)  │      │
│  └──────────┴──────────┴──────────┴──────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  YOUNG GENERATION                            │    │
│  │  ┌──────┬──────┬──────┬──────┬──────┬──────┐ │    │
│  │  │Page  │Page  │Page  │Page  │Page  │Page  │ │    │
│  │  └──────┴──────┴──────┴──────┴──────┴──────┘ │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

Young GC: Scans only young generation pages (~microseconds)
Old GC:  Concurrent mark + relocate entire heap (~sub-millisecond)
```

---

## Performance Benchmarks (Key Milestones)

### Pause Time Evolution

| JDK Version | Heap Size | Young GC Pause | Old GC Pause | Notes |
|-------------|-----------|----------------|--------------|-------|
| JDK 11 | 8 GB | N/A (~1ms) | `<1ms` | Non-generational, single GC type |
| JDK 13 | 8 GB | N/A (~0.5ms) | `<0.8ms` | Page-based allocation |
| JDK 14 | 8 GB | `<0.2ms` | `<1ms` | Generational (experimental) |
| JDK 17 | 32 GB | `<0.15ms` | `<0.5ms` | LTS, generational mature |
| JDK 21 | 64 GB | `<0.1ms` | `<0.4ms` | LTS, generational production |
| JDK 24 | 256 GB | `<0.1ms` | `<0.3ms` | Non-generational removed |
| JDK 26 | 1 TB | `<0.1ms` | `<0.5ms` | Latest optimizations |

### Allocation Throughput

| JDK Version | Throughput (GB/s) | Improvement vs. Previous |
|-------------|-------------------|--------------------------|
| JDK 11 | ~2.0 | Baseline |
| JDK 13 | ~5.5 | +175% (page-based allocation) |
| JDK 15 | ~6.0 | +9% (NUMA awareness) |
| JDK 17 | ~7.5 | +25% (generational tuning) |
| JDK 21 | ~9.0 | +20% (generational production) |
| JDK 26 | ~11.0+ | +22% (latest optimizations) |

*Note: Benchmark figures are approximate, based on reference hardware (Intel Xeon, 32 cores, 512 GB RAM). Actual results vary by workload and hardware.*

---

## Configuration Options

### Basic Usage

```bash
# Enable ZGC (generational by default in JDK 24+)
java -XX:+UseZGC -Xmx16g MyApp

# With GC logging (JDK 9+ unified logging)
java -XX:+UseZGC -Xmx16g \
     -Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=3,filesize=10m \
     MyApp

# With detailed ZGC-specific events
java -XX:+UseZGC -Xmx16g \
     -Xlog:gc+heap=trace:file=gc-detailed.log \
     MyApp
```

### Key ZGC-Specific Flags

| Flag | Default | Description |
|------|---------|-------------|
| `-XX:+UseZGC` | off | Enable ZGC |
| `-XX:ZAllocationSpikeTolerance` | 3.0 | Factor for handling allocation spikes |
| `-XX:ZCollectionInterval` | 0 (auto) | Minimum time between collections (seconds) |
| `-XX:ZCollectionLoad` | 10 (%) | Target CPU load during collection |
| `-XX:ZDumpHeapOnError` | false | Dump heap on OOM |
| `-XX:ZGenerational` | N/A (removed in JDK 24) | Deprecated — generational is the only mode |
| `-XX:ZMaxAllocatedBytes` | 0 (auto) | Max bytes allocated before collection triggers |
| `-XX:ZPagesMin` | varies | Minimum number of free pages |
| `-XX:ZPagesMax` | varies | Maximum number of free pages |
| `-XX:ZProactiveness` | 33 (%) | How proactively ZGC runs collections |
| `-XX:ZSideEffectProbability` | varies | Probability of load barrier side effects |
| `-XX:ZUncommit` | true | Return unused memory to OS |
| `-XX:ZUncommitDelay` | 10 (seconds) | Delay before returning memory to OS |
| `-XX:ZVerbose` | false | Verbose ZGC logging |

### Tuning for Low Latency

```bash
java -XX:+UseZGC -Xmx64g \
     -XX:ZCollectionLoad=20 \
     -XX:ZProactiveness=50 \
     -XX:ZAllocationSpikeTolerance=2.0 \
     MyApp
```

- `ZCollectionLoad=20`: Allow ZGC to use 20% of CPU for collection work (higher = more concurrent work, shorter pauses)
- `ZProactiveness=50`: More proactive collections (prevents heap from filling up)
- `ZAllocationSpikeTolerance=2.0`: Tighter tolerance for allocation spikes

### Tuning for Throughput

```bash
java -XX:+UseZGC -Xmx64g \
     -XX:ZCollectionLoad=5 \
     -XX:ZProactiveness=15 \
     -XX:ZCollectionInterval=5 \
     MyApp
```

- `ZCollectionLoad=5`: Minimize CPU used for GC (more CPU for application)
- `ZProactiveness=15`: Less frequent collections
- `ZCollectionInterval=5`: At least 5 seconds between collections

---

## ZGC vs. G1 vs. Shenandoah: Comparison

### Architectural Differences

| Dimension | G1 | ZGC | Shenandoah |
|-----------|----|-----|------------|
| **Design goal** | Predictable pauses, balanced throughput | Sub-millisecond pauses regardless of heap size | Sub-millisecond pauses regardless of heap size |
| **Barrier type** | Read-write barriers | **Load barriers** (colored pointers) | **Read-write barriers** (tricolor marking) |
| **Object relocation** | Stop-the-world evacuation | Concurrent relocation (transparent via colored pointers) | Concurrent relocation (transparent via write barriers) |
| **Generational** | Yes (JDK 25 finalized) | Yes (only mode since JDK 24) | Yes (since JDK 21) |
| **Default GC** | Yes (JDK 25+, JEP 523) | Opt-in | Opt-in |
| **Platform support** | All platforms | x64, AArch64, RISC-V (limited) | x64, AArch64 |
| **Memory overhead** | Moderate (~5% for regions) | Low (~2% for page structures) | Moderate (~5% for metadata) |
| **Heap size range** | 1 GB – 64 GB (optimal) | 8 MB – 16 TB | 1 GB – 1 TB+ |
| **Pause time target** | 200ms (configurable via `-XX:MaxGCPauseMillis`) | `<1ms` | `<1ms` |
| **Typical young GC pause** | 1–20ms | 0.05–0.2ms | 0.1–0.5ms |
| **Typical old GC pause** | 50–500ms | 0.2–0.8ms | 0.3–1.0ms |
| **Allocation throughput** | High | Very high (improved significantly since JDK 13) | High |
| **Maturity** | Highest (since JDK 9, default since JDK 11) | High (production since JDK 12, generational since JDK 21) | High (production since JDK 15) |

### When to Choose Each Collector

| Scenario | Recommended GC | Reason |
|----------|---------------|--------|
| General-purpose, moderate heap (`<32` GB) | **G1** | Balanced, well-tested, default |
| Large heap (>32 GB), low latency requirement | **ZGC** | Sub-ms pauses scale to multi-TB heaps |
| Large heap, low latency, RHEL ecosystem | **Shenandoah** | Red Hat's collector, well-integrated in RHEL |
| Maximum throughput, latency not critical | **Parallel GC** | Highest allocation throughput |
| Small application, minimal overhead | **Serial GC** (constrained envs) / G1 | Lowest memory overhead |
| Real-time systems, deterministic pauses | **ZGC** | Most consistent sub-millisecond pauses |
| AArch64 deployments | **ZGC** or **G1** | Both have strong ARM support |

### Key Architectural Trade-offs

**ZGC's colored pointers vs. Shenandoah's barriers:**
- ZGC: Metadata in pointer → load barrier only → less overhead per access but requires sufficient address space bits
- Shenandoah: Separate metadata → read-write barriers → more overhead but works on more platforms

**G1's region-based approach vs. ZGC's page-based approach:**
- G1: Fixed-size regions (default 2048 KB) → simple, predictable, but can waste space
- ZGC: Variable-size pages → more flexible, less internal fragmentation

---

## Diagnostic Commands

### Checking ZGC Status

```bash
# Verify ZGC is active
java -XX:+UseZGC -XX:+PrintCommandLineFlags -version
# Output includes: -XX:+UseZGC

# Check ZGC-specific flags
java -XX:+UseZGC -XX:+PrintFlagsFinal | grep -i "^.*z"

# Monitor ZGC in real-time with jcmd
jcmd <pid> GC.heap_info
jcmd <pid> GC.run  # Force a GC cycle (for testing)

# JFR profiling with ZGC events
jcmd <pid> JFR.start name=zgc_analysis settings=profile duration=120s
jcmd <pid> JFR.check  # Verify recording
jcmd <pid> JFR.stop name=zgc_analysis
jcmd <pid> JFR.dump name=zgc_analysis file=zgc-profile.jfr
```

### Reading ZGC Logs

```bash
# Enable unified GC logging
java -XX:+UseZGC -Xlog:gc*:file=gc.log MyApp

# Key log entries to look for:
# [GC (young) ...] — Young generation collection
# [GC (old) ...] — Old generation collection
# [GC pause (young) ...] — Detailed young GC pause info
# [GC heap ...] — Heap usage statistics
```

### JDK Mission Control (JMC)

ZGC exposes rich metrics via JMX and JFR:
- Pause time distribution (p50, p95, p99, p99.9)
- Young vs. old generation collection frequency
- Allocation rate (bytes/sec)
- Page utilization
- NUMA node distribution (on NUMA systems)

---

## Key Takeaways

1. **ZGC has matured dramatically**: From experimental in JDK 11 to production-ready generational in JDK 21, with non-generational mode fully removed in JDK 24.

2. **Page-based allocation (JDK 13)** was the biggest single performance improvement, increasing throughput by 2–3×.

3. **Generational ZGC** reduces young-GC pause times to 0.05–0.2ms — essentially invisible to most applications.

4. **Colored pointers** remain ZGC's architectural differentiator — no forwarding tables, no remembered sets, transparent relocation.

5. **G1 remains the default** (JDK 25+) and is the right choice for most workloads. ZGC is the tool for **large heaps with strict latency requirements**.

6. **Configuration is simple**: `-XX:+UseZGC` is usually sufficient; tune `ZCollectionLoad` and `ZProactiveness` only for specialized workloads.

7. **Platform support is growing**: x64 and AArch64 are well-supported; RISC-V support is emerging.

---

## Cross-References

- [G1 Default GC (JEP 523)](../G1-Default-GC/jep-523-g1-default-gc-all-environments.md) — G1 becoming universal default
- [ZGC Weak Reference Optimization](../ZGC-Weak-References/zgc-weak-reference-optimization.md) — Weak reference pipeline improvements
- [JDK 26 Performance Improvements](../JDK-26-Improvements/jdk-26-performance-improvements.md) — Broader JDK 26 performance changes
- [JVM Performance Tuning Fundamentals](explanation-jvm-performance-tuning-fundamentals.md) — General JVM tuning principles

## References

- [OpenJDK ZGC Wiki](https://wiki.openjdk.org/spaces/zgc/pages/34668579/Main)
- [JEP 333: Z Garbage Collector (Experimental)](https://openjdk.org/jeps/333)
- [JEP 347: Z Garbage Collector](https://openjdk.org/jeps/347)
- [JEP 348: Page Local Allocation in ZGC](https://openjdk.org/jeps/348)
- [JEP 354: Generational ZGC (Experimental)](https://openjdk.org/jeps/354)
- [JEP 356: NUMA Awareness in ZGC](https://openjdk.org/jeps/356)
- [JEP 460: Remove Non-Generational ZGC](https://openjdk.org/jeps/460)
- [JEP 523: G1 as Default GC](https://openjdk.org/jeps/523)
- [Oracle ZGC Documentation](https://docs.oracle.com/en/java/javase/21/gctuning/z-garbage-collector.html)
- [Inside Java: ZGC Performance — A Decade of Improvements](https://inside.java/2026/06/30/zgc-performance-decade/)
- [JavaCodeGeeks: JVM GC Decision in 2026](https://www.javacodegeeks.com/2026/04/the-jvm-garbage-collector-decision-in-2026-g1-vs-zgc-vs-shenandoah-for-real-workloads.html)
