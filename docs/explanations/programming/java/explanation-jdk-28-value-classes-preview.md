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

## Action
- Test your code against JDK 28 with preview features **both disabled and enabled**.
- Report unexpected issues to the `valhalla-dev` mailing list.

Note: the original post was unreachable at fetch time (404); content reconstructed from the daily.dev mirror summary.

## References
- [Quality Outreach Heads-up — JDK 28: Value Classes (inside.java)](https://inside.java/2026-10-27/quality-heads-up/) — 404 at fetch time
- [daily.dev mirror of the post](https://daily.dev/posts/quality-outreach-heads-up---jdk-28-value-classes-j9tiziys2)
- [Inside Java heads-up series](https://inside.java/headsup/)
