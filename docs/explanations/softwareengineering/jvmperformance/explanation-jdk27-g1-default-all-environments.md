---
title: 'JDK 27: G1 Becomes Default Garbage Collector in All Environments'
diataxis: Explanation
domain: Software-Engineering
topic: JVM-Performance
source: Inside Java
source_url: https://inside.java/2026/07/20/quality-heads-up/
date: 2026-07-27
keywords:
- knowledge-base
- JVM-Performance
- Software-Engineering
- explanations
---
# JDK 27: G1 Becomes Default Garbage Collector in All Environments

## Overview

Starting with JDK 27, the HotSpot JVM selects G1 (Garbage-First) as the default garbage collector in all environments, including constrained ones. Previously, the JVM would fall back to Serial GC when only a single CPU or less than 1792 MB of physical memory was detected.

This change is part of [JEP 523](https://openjdk.org/jeps/523): "Make G1 the Default Garbage Collector in All Environments."

## Background: The Old Behavior

When no garbage collector was specified on the command line, the HotSpot JVM used environment detection to choose between collectors:

| Environment Condition | Previous Default GC |
|-----------------------|---------------------|
| Multiple CPUs + ≥1792 MB RAM | G1 GC |
| Single CPU OR &lt;1792 MB RAM | Serial GC |

Serial GC was preferred in constrained environments due to its historical throughput and footprint advantages.

## The Change in JDK 27

Recent work has made G1 competitive with Serial even in constrained environments:

| Metric | G1 vs. Serial in Constrained Environments |
|--------|------------------------------------------|
| Native memory overhead | Similar |
| Throughput | Slightly lower for G1 |
| Maximum latency | Lower for G1 |

The rationale: consistent default behavior is easier to reason about than environment-dependent selection.

## What Does NOT Change

This change is narrow in scope:

- **Serial GC is not removed**: It remains available when its performance characteristics are preferable
- **Explicit GC selection is unaffected**: Applications that specify a garbage collector on the command line are not impacted
- **Well-resourced environments unchanged**: Applications running with multiple CPUs and more than 1792 MB of memory already used G1

## Who Is Impacted

An application is only affected if it meets **both** conditions:
1. Runs in a constrained environment (single CPU or &lt;1792 MB RAM)
2. Does not explicitly select a garbage collector on the command line

## Recommendations

For affected applications:

1. **Benchmark**: Test against different GCs to pick the one that best suits your needs
2. **Accept G1**: If benchmarking is not possible, G1 as the new default is a reasonable choice
3. **Pin Serial**: Configure `-XX:+UseSerialGC` to guarantee no change in GC-related performance characteristics

## Command-Line Reference

```bash
# Explicitly select Serial GC (if needed for compatibility)
java -XX:+UseSerialGC -jar myapp.jar

# Explicitly select G1 GC (now the default in JDK 27)
java -XX:+UseG1GC -jar myapp.jar

# Let JDK 27 choose (will be G1 in all environments)
java -jar myapp.jar
```

## Architecture Diagram

```
                    JVM GC Selection Evolution
                    ==========================

JDK 26 and earlier:                  JDK 27+:
┌──────────────────┐                 ┌──────────────────┐
│ Command line GC? │                 │ Command line GC? │
│   Yes → Use it   │                 │   Yes → Use it   │
│   No → Check env │                 │   No → G1        │
└───────┬──────────┘                 └──────────────────┘
        │
   ┌────┴────┐
   │         │
┌──┴──┐   ┌──┴──┐
│ ≥2  │   │ &lt;2  │
│ CPU │   │ CPU │
│ &   │   │ OR  │
│ ≥1792│  │ &lt;1792│
│ MB  │   │ MB  │
└──┬──┘   └──┬──┘
   │         │
  G1      Serial
```

## Why This Matters

1. **Predictability**: Developers no longer need to wonder which GC their application is running in a given environment
2. **Lower latency**: G1 provides better maximum latency characteristics even in constrained environments
3. **Simplified testing**: Test environments can match production GC behavior without manual configuration
4. **Quality outreach**: The OpenJDK Quality Group is promoting testing of FOSS projects with OpenJDK builds to validate this change

## References

- [JEP 523: Make G1 the Default GC in All Environments](https://openjdk.org/jeps/523)
- [OpenJDK Quality Outreach Program](https://wiki.openjdk.java.net/display/quality/Quality+Outreach)
- [Quality Discuss Thread](https://mail.openjdk.org/archives/list/quality-discuss@openjdk.org/thread/REAJQSW4DJ6BZNEKLGU56HB2757I26HM/)
- [Original Article](https://inside.java/2026/07/20/quality-heads-up/)
