---
title: JDK 26 Performance Improvements Deep Dive
diataxis: Explanation
domain: Software-Engineering
topic: JVM-Performance
source: Inside Java / Oracle
source_url: https://inside.java/2026/06/09/jdk-26-performance-improvements/
date: 2026-06-21
keywords:
- knowledge-base
- JVM-Performance
- Software-Engineering
- explanations
---
# JDK 26 Performance Improvements Deep Dive

## Overview

JDK 26 includes over 2,500 fixes with more than 1,000 enhancements. This note covers the notable performance improvements grouped into four areas: **JDK Libraries**, **Garbage Collectors**, **Compiler**, and **Runtime**.

## JDK Library Improvements

### LazyConstants (Second Preview)

The `LazyConstant` API provides thread-safe, at-most-once lazy initialization with JVM-level optimization potential.

```java
// Replace this pattern:
static volatile Service service;
static Service getService() {
    if (service == null) {
        synchronized (MyClass.class) {
            if (service == null) {
                service = new Service();
            }
        }
    }
    return service;
}

// With this:
static final LazyConstant<Service> SERVICE = LazyConstant.of(Service::new);
static Service service() {
    return SERVICE.get();
}
```

**Key changes from JDK 25 (StableValues)**:
- Renamed from `StableValue`/`StableValues` to `LazyConstant`
- `null` is disallowed as a computed value (simplifies runtime model)
- Factory methods take value-computing functions instead of direct values
- Once initialized, JVM treats the value as constant (constant folding optimizations)

**Performance benefit**: Defers work out of startup while enabling aggressive JVM optimization after initialization.

### Faster MemorySegment::getString

Starting with JDK 26, string extraction from `MemorySegment` reduces intermediate allocation and copying:

- **Before**: Created temporary array internally, not optimized away by JIT
- **After**: Lower latency across all string sizes, especially large improvement for short strings
- **Impact**: Reduced allocation pressure, lower GC activity in workloads with frequent native-to-Java string conversions

### Record hashCode() Optimization

JDK 26 adds missing type profiling in generated record `hashCode()` methods:
- Records are commonly used as Map keys or Set elements
- Optimized record hashing now matches manually written implementations
- Direct impact on throughput for code using records for lookups, grouping, indexing, or deduplication

### Cryptography Performance

Targeted improvements in:
- **AES**: Reduced unnecessary work in key setup
- **ML-DSA**: Improved low-level arithmetic
- **Elliptic Curve P-256**: Added/enhanced CPU-specific intrinsics
- **Reference**: JDK-8371820

### Other Library Enhancements

| Improvement | Impact |
|-------------|--------|
| `GZIPInputStream` for single compressed streams | Faster decompression from byte array/socket |
| `java.lang.reflect.Method::equals` same-instance check | Faster dynamic proxy method dispatch |
| `java.util.concurrent` uses `LazyConstant` | Replaced older initialization patterns |

## Garbage Collection Improvements

### G1 GC: Dual Card Table for Reduced Synchronization

**Problem**: G1 tracks cross-region pointer updates in a card table maintained by write barriers. Frequent reference updates make the card table costly to scan during pauses. Background optimization requires synchronization with application threads, hurting throughput.

**Solution**: Introduces a second card table:

```
┌─────────────────────────────────────────────────────────────┐
│              G1 Dual Card Table Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  App Threads ──▶ Active Card Table (no synchronization)     │
│                  - Write barriers simplified & faster        │
│                  - x64 barriers: ~50 → ~12 instructions     │
│                                                             │
│  Optimizer Threads ──▶ Standby Card Table (independent)     │
│                     - Initially empty                       │
│                     - Works independently                   │
│                                                             │
│  When pause target at risk:                                │
│  Atomic swap of active ↔ standby tables                     │
│                                                             │
│  Memory cost: ~0.2% of heap (~2MB native per 1GB heap)     │
└─────────────────────────────────────────────────────────────┘
```

**Measured improvements**:
- Reference-heavy workloads: 5–15% throughput gains
- Light reference updates: ~5% improvement
- Pause times: Slightly reduced
- Memory overhead: ~2MB per 1GB heap

### AOT Cache Works with Any GC (Including ZGC)

**Before JDK 26**: AOT cache only worked with G1 (GC-specific format)

**After JDK 26**: Two cache formats available:

| Format | Best For | Trade-off |
|--------|----------|-----------|
| **GC-specific (mappable)** | Warm starts, constrained systems | Nearly instant from filesystem cache |
| **GC-agnostic (streamable)** | Cold starts, large heaps (>32GB) | Needs extra CPU core for streaming |

**JVM heuristic for format selection**:
- Choose streamable if: ZGC used, `-XX:+UseAOT` specified, or heap > 32GB
- Choose mappable if: Compressed oops in use (signals constrained system)

### Default Initial Heap Size Now Set to MinHeapSize

**Before**: Default initial heap = 1/64 of system RAM (large on big machines)

**After**: JVM starts with minimum possible heap size (`-Xms`), grows as needed

**Impact**: Faster startup for applications using default JVM configuration, less heap metadata initialized upfront.

## Compiler Improvements

### C2 Compilation of Methods with Large Parameter Lists

**Before**: Methods with many parameters stayed on C1 or interpreter (less optimized)

**After**: C2 JIT compiler handles methods with very large parameter lists

**Impact**: More code paths gain access to C2 optimizations, improving throughput without application changes.

### C2 SuperWord Cost Model Improvement

Enhanced cost modeling for loop vectorization:
- Better decisions about when SIMD-style execution is beneficial
- Accounts for extra work (data shuffling, packing) vs. throughput gains
- Vectorization only applied when net benefit is positive

## Runtime Improvements

### Virtual Threads Unmount During Class Initialization Wait

**Problem**: Multiple virtual threads waiting for class initialization kept attached to carrier threads, reducing available carriers.

**Solution**: Virtual threads can now be preempted during class initialization wait paths.

**Impact**:
- Improved scalability for applications with many virtual threads
- Lower risk of carrier starvation during class loading bursts
- Better throughput during initialization-heavy workloads

## Summary of Key Improvements

```
┌─────────────────────────────────────────────────────────────┐
│              JDK 26 Performance Improvement Summary          │
├──────────────┬──────────────────────────────────────────────┤
│  Area        │  Key Improvement                             │
├──────────────┼──────────────────────────────────────────────┤
│  Libraries   │ LazyConstant, faster MemorySegment→String,   │
│              │  optimized record hashCode(), crypto speedup │
├──────────────┼──────────────────────────────────────────────┤
│  GC          │ G1 dual card table (5-15% throughput),       │
│              │  AOT cache works with ZGC, smaller default   │
│              │  initial heap                               │
├──────────────┼──────────────────────────────────────────────┤
│  Compiler    │ C2 handles large param lists, better         │
│              │  vectorization cost model                    │
├──────────────┼──────────────────────────────────────────────┤
│  Runtime     │ Virtual threads unmount during class init    │
│              │  wait, improved carrier utilization          │
└──────────────┴──────────────────────────────────────────────┘
```

## Migration Considerations

1. **Test with your workloads**: Measure performance on JDK 26 vs. your current version
2. **Watch for regressions**: Report issues on the relevant JDK bug tracker
3. **Consider LazyConstant**: Replace double-checked locking patterns with `LazyConstant`
4. **AOT cache**: Try the new GC-agnostic format if using ZGC or large heaps
5. **G1 throughput**: Reference-heavy workloads should see measurable improvement

## References

- [Performance Improvements in JDK 26 (Inside Java)](https://inside.java/2026/06/09/jdk-26-performance-improvements/)
- [JDK 26 Release Notes](https://jdk.java.net/26/)
- [LazyConstant API Documentation](https://docs.oracle.com/en/java/javase/26/docs/api/)
- [JDK Bug Tracker](https://bugs.openjdk.org/)
- [C2 AutoVectorizer Improvement Ideas](https://blog.e-peter.de/)
