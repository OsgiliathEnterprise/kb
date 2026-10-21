---
title: 'JEP 543: Structured Concurrency Finalized in JDK 28 — StructuredTaskScope
  After Seven Previews'
diataxis: Explanation
domain: programming
topic: java
source: inside java
source_url: https://openjdk.org/jeps/543
date: 2026-10-21
keywords:
- knowledge-base
- java
- programming
- explanations
---
# JEP 543: Structured Concurrency Finalized in JDK 28 — StructuredTaskScope After Seven Previews

**JEP 543** (authors Alan Bateman, Viktor Klang, Ron Pressler; type: Feature; scope: SE; component: core-libs) **finalizes the Structured Concurrency API in JDK 28, without further change** from the JDK 27 preview. Status: Integrated.

## The journey (seven previews in four years)

| JEP | JDK | Change |
| --- | --- | --- |
| JEP 428 | 19 | first delivered as an incubator module |
| JEP 437 | 20 | incubator continued |
| JEP 453 | 21 | became a preview API; `fork` changed to return **Subtask** rather than `Future` |
| JEP 462 | 22 | re-preview |
| JEP 480 | 23 | re-preview |
| JEP 499 | 24 | re-preview |
| JEP 505 | 25 | API changes: public constructors of `StructuredTaskScope` replaced with **static factory methods** |
| JEP 525 | 26 | minor changes |
| JEP 533 | 27 | added a **type parameter for the exception** thrown by `join()` |
| **JEP 543** | **28** | **finalized, no API changes** |

## What the API gives you

The principal class is [`java.util.concurrent.StructuredTaskScope`](https://cr.openjdk.org/~alanb/sc-jdk28/api/java.base/java/util/concurrent/StructuredTaskScope.html). It lets a task fan out into concurrent subtasks and coordinate them **as a unit**: subtasks are executed in their own threads by **forking** them individually and **joining** them as a group, all confined to a clear lexical scope.

```java
Response handle() throws ExecutionException, InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        Subtask<String> user = scope.fork(() -> findUser());
        Subtask<Integer> order = scope.fork(() -> fetchOrder());
        scope.join();   // type parameter names the exception join() may throw
        return new Response(user.get(), order.get());
    }
}
```

Key API facts:

- `StructuredTaskScope.open()` — static factory (constructors were removed in JDK 25); use in **try-with-resources**.
- `scope.fork(callable)` returns a **`Subtask<T>`** (not `Future`) — the change that's been stable since JDK 21.
- `scope.join()` — one blocking call awaits all subtasks; its type parameter declares the exception type.
- `Subtask.get()` behaves exactly as `Future.resultNow()` did while the API incubated: it's only valid **after** `join()` returns, and does not block.

## Why it exists

With `ExecutorService` + `Future`, task-subtask relationships exist "only in our minds":

- if `findUser()` throws, `handle()` fails but `fetchOrder()` **keeps running** — a thread leak
- if the `handle()` thread is interrupted, the interruption **does not propagate** to subtasks
- if `findUser()` is slow and `fetchOrder()` fails, `handle()` still waits for `findUser()` before noticing — no cancellation

Structured concurrency makes the task-subtask hierarchy **reified at run time** — the concurrent counterpart of the call stack: each subtask is a child of its parent, lifetimes are nested like code blocks, the parent can treat one child's failure as a trigger to cancel the others, and observability tools can display threads the way developers understand them (policies like deadlines apply to whole task subtrees).

Non-goals: it does **not** replace `ExecutorService`/`Future`, does not define data-sharing channels, and does not replace the thread interruption mechanism.

## Fit with virtual threads

Structured concurrency is a great match for **virtual threads (JEP 444)**: virtual threads make it cheap to dedicate a thread to every subtask; structured concurrency coordinates that abundance. A server can dedicate a virtual thread to each request, and when a task fans out, a virtual thread to each subtask — with the tree structure carried by a parent reference on each thread.

## Concept provenance

The term "structured concurrency" was coined by **Martin Sústrik** and popularized by **Nathaniel J. Smith** ("Go Statement Considered Harmful", 2018); Erlang's hierarchical supervisors inform the error-handling design.

## Practical note

If you're running JDK 27 previews today, JEP 543 means **no code changes** to reach the final JDK 28 API — the last breaking changes (static factories, Subtask) landed in JDK 21/25, and the last one (join's exception type parameter) in JDK 27.

## References

- [JEP 543: Structured Concurrency (openjdk.org)](https://openjdk.org/jeps/543)
- [JEP 453: Structured Concurrency (Preview) — original proposal](https://openjdk.org/jeps/453)
- [Inside Java: JEP targeted to JDK 28: 543: Structured Concurrency](https://inside.java/2026/10/21/jep543-target-jdk28/)
- [InfoQ: JEP 543 Finalizes Structured Concurrency in JDK 28](https://www.infoq.com/news/2026/10/jep-543-jdk-28/)
