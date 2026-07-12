---
title: 'Lazy Constants (JEP 531): Deferred Immutability with JIT Constant-Folding'
diataxis: Explanation
domain: Programming
topic: Java & Spring
source: Java Code Geeks, Baeldung, OpenJDK JEP 531
source_url: https://www.javacodegeeks.com/2026/06/lazy-constants-jep-531-jits-best-friend-you-havent-met.html
date: 2026-07-11
keywords:
- knowledge-base
- Java & Spring
- Programming
- explanations
---
# Lazy Constants (JEP 531): Deferred Immutability with JIT Constant-Folding

## Overview

**Lazy Constants** (JEP 531, Third Preview targeting JDK 27) solve a long-standing tension in Java: you want a value to be immutable so the JIT can inline it, skip null checks, and apply constant-folding — but you also want it to initialize **lazily**, not at class-load time.

The feature first appeared as **Stable Values** in Java 25 (JEP 502), was redesigned and renamed in Java 26 (JEP 526), and is now in its third preview form. Even though it is still a preview API, the direction is clear — and understanding it now means you will be ready the moment it graduates.

> **Preview status:** JEP 531 requires `--enable-preview` at compile and runtime. The API surface can still change before finalization.

---

## The Problem: `final` vs. Lazy Initialization

When the JIT compiles a method that reads a `static final` field, it can embed the value directly into generated machine code — no memory load required. It can propagate that value through branches and eliminate dead code. This is a significant optimization for configuration objects, loggers, connection pools, and service locators read millions of times per second.

The catch: `final` fields must be assigned during the object's constructor or a static initializer block. They are initialized when the **class loads**, not when the value is first **needed**. Dropping `final` to allow lazy assignment means the JVM can no longer trust the value is stable — and it quietly gives up on constant-folding entirely.

### The Double-Checked Locking Band-Aid

The most common workaround — double-checked locking — solves thread safety but does nothing for the JIT:

```java
// Classic double-checked locking
public class ServiceRegistry {
    private static volatile Logger logger;

    public static Logger getLogger() {
        if (logger == null) {
            synchronized (ServiceRegistry.class) {
                if (logger == null) {
                    logger = LoggerFactory.getLogger(ServiceRegistry.class);
                }
            }
        }
        return logger;
    }
}
```

This forces the JIT to treat `logger` as potentially mutable on every read — meaning **no constant-folding, no null-check elision**, and a volatile memory barrier on the hot path even after initialization.

---

## The Solution: `LazyConstant<T>` and `of()`

JEP 531 introduces the `LazyConstant<T>` class — a container that can hold exactly one value of type `T`. Once that value is written, it is immutable for the lifetime of the container. The JVM gets the stability guarantee it needs, even though the assignment happens lazily.

Internally, the implementation uses the JDK-internal `@Stable` annotation (the same annotation used for years on arrays in `String`, `MethodType`, and other core classes) together with `Unsafe` memory barriers for correct visibility across threads.

```java
import java.lang.invoke.LazyConstant;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;

public class ServiceRegistry {
    // The LazyConstant itself is final — the JIT can trust the container
    private static final LazyConstant<Logger> LOGGER =
        LazyConstant.of(() -> LoggerFactory.getLogger(ServiceRegistry.class));

    public static Logger getLogger() {
        return LOGGER.get(); // initialized at most once, thread-safe
    }
}
```

No `null` check, no `synchronized` block, no `volatile` keyword. The platform handles all of that. Because `LOGGER` itself is `static final`, the JIT can constant-fold the **container** — and once the container's value has been set, the JIT can constant-fold **through** the container to the value itself.

---

## Evolution Timeline

| JDK | JEP | Name | Key Changes |
|-----|-----|------|-------------|
| 25 | [502](https://openjdk.org/jeps/502) | Stable Values (Preview) | Initial preview. Low-level API: `setOrThrow`, `trySet`, `orElseSet` exposed. |
| 26 | [526](https://openjdk.org/jeps/526) | Lazy Constants (2nd Preview) | Renamed. Removed low-level methods. Factory methods for lazy List/Map moved into `java.util.List` / `java.util.Map`. |
| 27 | [531](https://openjdk.org/jeps/531) | Lazy Constants (3rd Preview) | Minor refinements. API stabilizing toward final form. |

---

## Lazy Collections: `List.ofLazy()` and `Map.ofLazy()`

### Lazy List

```java
// Lazy pool of database connections — each slot initialized on demand
private static final int POOL_SIZE = 10;

private static final List<DatabaseConnection> POOL =
    List.ofLazy(POOL_SIZE, i -> new DatabaseConnection("jdbc:postgresql://host/db", i));

public static DatabaseConnection acquire(int slot) {
    return POOL.get(slot); // initialized exactly once per slot, thread-safe
}
```

### Lazy Map

```java
// Lazy map: locale keys known upfront, bundles loaded on first access
private static final Set<Locale> SUPPORTED =
    Set.of(Locale.ENGLISH, Locale.FRENCH, Locale.GERMAN);

private static final Map<Locale, ResourceBundle> BUNDLES =
    Map.ofLazy(SUPPORTED, locale ->
        ResourceBundle.getBundle("messages", locale));

public static ResourceBundle bundleFor(Locale locale) {
    return BUNDLES.get(locale);
}
```

Both patterns combine three desirable properties at once: **deferred initialization**, **thread safety**, and **JIT-visible stability**.

---

## Architecture Diagram

```excalidraw
* Excalidraw below
* You can currently edit it with the plugin in VSCode
* code-excalidraw^start
{
  "type": "excalidraw画布",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "app",
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 180,
      "height": 60,
      "strokeColor": "#3498db",
      "backgroundColor": "#d6eaf8",
      "label": "Application Code\nLOGGER.get()"
    },
    {
      "id": "lazy-constant",
      "type": "rectangle",
      "x": 300,
      "y": 50,
      "width": 180,
      "height": 60,
      "strokeColor": "#2ecc71",
      "backgroundColor": "#d5f5e3",
      "label": "LazyConstant<Logger>\n(static final)"
    },
    {
      "id": "stable-field",
      "type": "rectangle",
      "x": 300,
      "y": 150,
      "width": 180,
      "height": 60,
      "strokeColor": "#e67e22",
      "backgroundColor": "#fdebd0",
      "label": "@Stable field\n(initialized once)"
    },
    {
      "id": "jit",
      "type": "rectangle",
      "x": 550,
      "y": 100,
      "width": 180,
      "height": 80,
      "strokeColor": "#9b59b6",
      "backgroundColor": "#e8daef",
      "label": "JIT Compiler\n(constant-folds\nthrough container)"
    },
    {
      "id": "arrow1",
      "type": "arrow",
      "x1": 230,
      "y1": 80,
      "x2": 300,
      "y2": 80,
      "strokeColor": "#333",
      "label": ".get()"
    },
    {
      "id": "arrow2",
      "type": "arrow",
      "x1": 390,
      "y1": 110,
      "x2": 390,
      "y2": 150,
      "strokeColor": "#333",
      "label": "contains"
    },
    {
      "id": "arrow3",
      "type": "arrow",
      "x1": 480,
      "y1": 120,
      "x2": 550,
      "y2": 120,
      "strokeColor": "#333",
      "label": "@Stable visible to JIT"
    }
  ]
}
* code-excalidraw^end
```

---

## Use Cases

| Scenario | Before (Double-Checked Locking) | With LazyConstants |
|----------|--------------------------------|-------------------|
| Logger initialization | `volatile` + `synchronized` | `LazyConstant.of(() -> ...)` |
| Connection pool | Custom lazy + thread safety | `List.ofLazy(size, factory)` |
| Resource bundle caching | `ConcurrentHashMap` + compute | `Map.ofLazy(keys, mapper)` |
| Configuration objects | Holder pattern / enum | `LazyConstant.of(() -> ...)` |

---

## References

- [Java Code Geeks: Lazy Constants (JEP 531): JIT's Best Friend You Haven't Met](https://www.javacodegeeks.com/2026/06/lazy-constants-jep-531-jits-best-friend-you-havent-met.html)
- [Baeldung: Lazy Constants in Java](https://www.baeldung.com/java-lazy-constants)
- [JEP 531: Lazy Constants (Third Preview)](https://openjdk.org/jeps/531)
- [JEP 526: Lazy Constants (Second Preview)](https://openjdk.org/jeps/526)
- [JEP 502: Stable Values (Preview)](https://openjdk.org/jeps/502)
