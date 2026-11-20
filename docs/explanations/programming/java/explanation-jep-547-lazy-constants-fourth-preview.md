---
title: 'JEP 547: Lazy Constants (Fourth Preview) Targeted to JDK 28 — Deferred Immutability
  via java.lang.LazyConstant'
diataxis: Explanation
domain: programming
topic: java
source: inside java
source_url: https://inside.java/2026/11/20/jep547-target-jdk28/
date: 2026-11-20
keywords:
- knowledge-base
- java
- programming
- explanations
---
# JEP 547: Lazy Constants (Fourth Preview) Targeted to JDK 28

JEP 547 re-previews the **lazy constants** API in JDK 28 **with no changes** from the JDK 27 preview (JEP 531). Authors Per Minborg & Maurizio Cimadamore; component `core-libs/java.lang`; status Targeted; effort/duration S. A lazy constant (`java.lang.LazyConstant`) holds unmodifiable data that the JVM treats as a **true constant** — it gets the same constant-folding optimizations as a `final` field — while allowing the initialization to be deferred to first use.

## The gap it fills: between `final` and mutable

- `final` fields are **too constrained**: they must be set eagerly (construction or class init), in textual declaration order. A `static final Logger` in every component slows startup even when some components never log.
- Mutable fields with lazy-init getters are **too unconstrained**: they introduce a hidden invariant (always access via the getter), are thread-unsafe without manual synchronization, and — critically — the JVM **cannot constant-fold** them because a non-final field may change at any time.

Lazy constants = **deferred immutability**: a value computed **at most once**, safely under concurrency, from a computing function supplied at construction, after which the field is unmodifiable and JIT-trusted.

```java
class OrderController {
    private final LazyConstant<Logger> logger =
        LazyConstant.of(() -> Logger.create(OrderController.class));

    void submitOrder(User user, List<Product> products) {
        logger.get().info("order started");
        ...
    }
}
```

## API history across four previews

| JDK | JEP | Key change |
|-----|-----|-----------|
| 25 | JEP 502 | First preview as `StableValue` (low-level: `orElseSet`, `setOrThrow`, `trySet`) |
| 26 | JEP 526 | Renamed to `LazyConstant`; low-level setters removed (factories take computing functions only); lazy collections moved to `List.ofLazy(...)` / `Map.ofLazy(...)`; `function`/`intFunction` factories dropped; `null` computed values disallowed |
| 27 | JEP 531 | Removed `isInitialized`/`orElse` (usable against design goals); added `Set.ofLazy(...)` → lazy forms of all three collection types |
| 28 | JEP 547 | Re-preview, **no changes** |

## Rejected alternatives (and why they lose)

- **Double-checked locking over an array** with `VarHandle.getVolatile/setVolatile` + per-index mutexes: convoluted, error-prone, no constant folding.
- **`ConcurrentHashMap.computeIfAbsent`**: thread-safe but the JVM cannot trust a map entry to be immutable → no constant folding.

## Risk and the reflection caveat

Constant folding requires JVM trust that a field is written once. Reflection's `setAccessible` still allows arbitrary updates of **instance** `final` fields (except in hidden classes/records), so performance is best when lazy constants are stored in **`static final`** fields — reflection cannot mutate those, and folding across them is routine. The long-term fix is JEP 500 (limiting reflection) under the "integrity by default" shift.

**Non-goals:** no lazy-field language construct; `final` semantics unchanged.

## References

- [Inside Java: JEP targeted to JDK 28 — 547 Lazy Constants (4th Preview)](https://inside.java/2026/11/20/jep547-target-jdk28/)
- [JEP 547 full text](https://openjdk.org/jeps/547)
- Related in KB: [Better tools for immutable data in Java](explanation-better-tools-immutable-data-java.md), [JEP 543: Structured Concurrency finalized in JDK 28](explanation-jep-543-structured-concurrency-finalized-jdk28.md)
