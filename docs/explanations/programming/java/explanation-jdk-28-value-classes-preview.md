---
title: 'JDK 28 Value Classes Preview (JEP 401): What Changes and How to Test'
diataxis: Explanation
domain: programming
topic: java
source: inside java
source_url: https://inside.java/2026-10-27/quality-heads-up/
date: 2026-10-27
keywords:
- knowledge-base
- java
- programming
- explanations
---
# JDK 28 Value Classes Preview (JEP 401): What Changes and How to Test

The OpenJDK Quality Group's heads-up for **JDK 28**: value classes (Valhalla, **JEP 401**) land as a **preview feature**. With preview features enabled, **30 JDK classes become value classes**:
- `java.lang`: `Integer`, `Long`, `Float`, `Double`, `Byte`, `Short`, `Character`, `Boolean`, `Number`, `Record`
- `java.util`: `Optional`, `OptionalInt`, `OptionalLong`, `OptionalDouble`
- `java.time`: `LocalDate`, `Duration`, … and `java.time.chrono` date classes (`HijrahDate`, `JapaneseDate`)

## Behavior changes (preview enabled)
- **No identity**: value classes compare by field values — `==` may return `true` for instances that previously compared unequal (two separately constructed `LocalDate.of(...)` instances now compare equal with `==`).
- **No synchronization**: you can't `synchronize` on a value-class instance.
- **No weak references**: can't be used with `java.lang.ref` or as `WeakHashMap` keys.
- **No reflective field access**: `setAccessible` on their fields is rejected.
- **Record early-construction rules**: enabling preview at compile time restricts what a record compact constructor may do before `super()`/`this(...)` — statements that call instance methods or otherwise expose the under-construction instance become **compile errors** (remove them, rewrite them for the early-construction context, or move them after field assignment and the super/this call).

## Status and how to try it (verified against OpenJDK, Nov 2026)
- JEP 401 is titled **"Value Objects (Preview)"** (owner Dan Smith, type Feature, scope SE, effort/duration XL). Status **Integrated, Release 28** — announced August 2026 on the Valhalla project page, alongside **JEP 539: Strict Field Initialization in the JVM (Preview)**.
- **JEP 539 is the dependency** that makes the record early-construction rule enforceable: bytecode verification requires value-object fields to be initialized during the early construction phase. So the two JEPs must be tried together — both are preview features.
- Enable the preview on both compile and run, otherwise the migrated JDK classes behave exactly as they did in JDK 27:
  ```bash
  javac --release 28 --enable-preview Main.java
  java  --enable-preview Main
  jshell --enable-preview
  ```
- Experiment with early-access builds at [https://jdk.java.net/28/](https://jdk.java.net/28/) (JDK 28 GA targeted for March 2027; mainline integration of the broader Valhalla work was planned around July 2026).
- JEP 390 (*Warnings for Value-Based Classes*, delivered in JDK 16) is the historical stepping stone — warnings only, no semantic change.

## Non-goals worth internalizing
- `==` is **not** a replacement for `equals`. The JEP redefines `==` only as much as necessary for identity-free objects; the usual advice to compare with `equals` in most contexts still applies.
- Existing classes are **not** automatically promoted to value objects — class authors must opt in explicitly.
- No `struct` feature (unlike C/C#), and **no change to primitive types**: Java still has exactly two kinds of data, primitives and object references.
- No memory-layout or optimization guarantees. Some optimizations (e.g. layouts that exclude `null`) wait on future language/JVM work — see the *Null-Restricted Value Class Types (Preview)* JEP (draft) and JEP 402 *Enhanced Primitive Boxing* (draft).

## Security and performance caveats (from the JEP)
- `==` and `identityHashCode` can **indirectly expose `private` field values** on value objects — treat them as a disclosure surface when value objects wrap sensitive data.
- `==` can take **unbounded time** when comparing two large trees of value objects. Deeply nested value-class graphs make equality comparisons a potential algorithmic-complexity hazard.
- `if_acmpeq` (the `==` bytecode) normally costs about one instruction cycle but now needs an extra check to detect value objects; the identity-class fast path is expected to absorb most of that cost.

## Where this is heading
Valhalla ships as a steady stream, not one release: Value Objects, Null-Restricted Storage, Array Enhancements, Unifying Primitives and Classes, and the Parametric JVM. Useful background: Dan Smith's *Better Tools for Immutable Data* (JavaOne 2026) and *A New Model for Java Object Initialization* (JavaOne 2025); Frederic Parain on value classes and heap flattening (JVM Language Summit 2025).

## Action
- Test your code against JDK 28 with preview features **both disabled and enabled**.
- Report unexpected issues to the `valhalla-dev` mailing list.

Note: the original post was unreachable at fetch time (404); content reconstructed from the daily.dev mirror summary.

## References
- [JEP 401: Value Objects (Preview)](https://openjdk.org/jeps/401) — authoritative spec, Integrated for JDK 28
- [JEP 539: Strict Field Initialization in the JVM (Preview)](https://openjdk.org/jeps/539)
- [Project Valhalla](https://openjdk.org/projects/valhalla/) — status, feature streams, background talks
- [Quality Outreach Heads-up — JDK 28: Value Classes (inside.java)](https://inside.java/2026-10-27/quality-heads-up/) — 404 at fetch time
- [daily.dev mirror of the post](https://daily.dev/posts/quality-outreach-heads-up---jdk-28-value-classes-j9tiziys2)
- [Inside Java heads-up series](https://inside.java/headsup/)
