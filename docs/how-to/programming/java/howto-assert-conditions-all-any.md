---
title: How to assert conditions over a reactive stream (all, any)
diataxis: How-to Guide
domain: programming
topic: java
source: ''
---
---
created: 2026-09-17
type: howto
title: "How to assert conditions over a reactive stream (all, any)"
domain: programming
topic: java/Reactor
source: "Ebook: Spring in Action, 6th Edition by Craig Walls"
source_book_id: calibrebook_398
source_chapter: "Chapter 11: Introducing Reactor"
tags: [reactor, all, any, logic]
visibility: private
ai_tool_candidate: true

concise: true---

# How to assert conditions over a reactive stream (all, any)

## Input parameters
- A source `Flux`
- A `Predicate<T>` describing the condition to test

## Procedure
1. **All-or-nothing — `all(Predicate)`**: returns a `Mono<Boolean>` that emits `true` only if *every* element matches (and the stream completes):
   ```java
   Mono<Boolean> hasA = animals.all(a -> a.contains("a")); // true
   Mono<Boolean> hasK = animals.all(a -> a.contains("k")); // false — not all contain k
   ```
2. **At-least-one — `any(Predicate)`**: returns a `Mono<Boolean>` that emits `true` if *at least one* element matches:
   ```java
   Mono<Boolean> hasT = animals.any(a -> a.contains("t")); // true (elephant)
   Mono<Boolean> hasZ = animals.any(a -> a.contains("z")); // false
   ```
3. **Subscribe to the resulting `Mono<Boolean>`** — these are terminal logic operations; they consume the stream and produce a single boolean signal:
   ```java
   animals.all(a -> a.length() > 2).subscribe(System.out::println);
   ```

## Error handling
- **Empty stream semantics** → `all()` on an empty Flux emits `true` (vacuous truth); `any()` emits `false`. Guard if your business logic treats "no data" differently.
- **Upstream error** → the resulting Mono errors instead of emitting a boolean; handle with `.onErrorReturn(false)` or similar if you need a definitive answer.

## Verification
```java
StepVerifier.create(animals.any(a -> a.contains("t")))
    .expectNext(true)
    .verifyComplete();
```

## Related notes
- How to filter reactive streams (skip, take, filter, distinct)
- How to test reactive streams with StepVerifier
