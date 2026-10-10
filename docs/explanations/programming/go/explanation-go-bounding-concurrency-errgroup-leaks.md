---
title: Bounding Concurrency in Go — errgroup, Worker Pools, Backpressure, and the
  Leak That Survives Wait
diataxis: Explanation
domain: programming
topic: go
source: DEV.to Tech News
source_url: https://dev.to/rosgluk/bounding-concurrency-in-go-errgroup-worker-pools-and-backpressure-1eh4
date: 2026-10-10
keywords:
- knowledge-base
- go
- programming
- explanations
---
# Bounding Concurrency in Go — errgroup, Worker Pools, Backpressure, and the Leak That Survives Wait

Unbounded fan-out is the default failure mode of Go concurrency: every `go` statement is one more task in flight with no ceiling and no owner. This note covers giving both a ceiling **and** an owner.

Key framing: **cancellation and bounding are separate controls.** Cancellation decides *when* work stops; bounding decides *how much* exists at once. A service can cancel perfectly and still fall over because ten thousand goroutines each decided, independently, that now was a good time to call the database.

## Five primitives, one decision table

| Primitive | Partial results | Fail-fast | Backpressure | Dynamic work | Best for |
| --- | --- | --- | --- | --- | --- |
| `sync.WaitGroup` + `errors.Join` | yes | no | no | no | wait-all batches where every result counts |
| `errgroup.WithContext` | no | yes | no | no | fan-out where the first error ends the request |
| `errgroup.SetLimit(n)` | no | yes | yes (blocks `Go`) | no | bounded fail-fast fan-out |
| Semaphore channel | yes | manual | yes (blocks acquire) | yes | custom admission control |
| Worker pool | yes | manual | yes (queue fills) | yes | steady streams, long-lived workers |

Two questions pick the row:

1. When one task fails, do you still want the others' results? If yes, fail-fast group semantics discard work you needed.
2. Does work arrive continuously, or is it a fixed batch you can count before launching? Groups handle batches; pools and queues handle streams.

`errors.Join` is what makes the plain `WaitGroup` row viable — it collects every worker's error instead of keeping only the first.

## The leak that survives errgroup.Wait

The best-known errgroup failure mode has nothing to do with bounding. It is a **cancellation gap** hiding behind code that looks correct:

```go
g, gctx := errgroup.WithContext(ctx)
results := make(chan int) // unbuffered

go func() { // producer — nobody owns this goroutine
    for i := 0; i < 100; i++ {
        results <- i
    }
    close(results)
}()

g.Go(func() error { // consumer — group member
    for r := range results {
        if r == 5 {
            return fmt.Errorf("save failed")
        }
    }
    return nil
})

err := g.Wait() // returns at the consumer's error
```

When the consumer returns, `gctx` cancels and `Wait` returns. The producer is parked on `results &lt;- i` — **and context cancellation does not unblock a channel send.** Nobody owns that goroutine, so it stays parked for the life of the process. Run this shape in a loop and the leak is exactly linear:

| Variant | Live goroutines after 500 iterations |
| --- | --- |
| Send without a `ctx.Done` arm | 501 (+500 leaked, one per iteration) |
| Send wrapped in `select` with `&lt;-gctx.Done()` | 502 (+1 baseline) |

The fix — every channel operation inside a cancellable task gets a `Done` arm:

```go
// the fix: every channel operation inside a cancellable task
// gets a Done arm
select {
case results <- i:
case <-gctx.Done():
    return
}
```

The same gap exists on the receive side. The rule is mechanical: **every channel operation inside code that can be cancelled gets a `&lt;-ctx.Done()` arm, and every goroutine has an owner** that waits on it or cancels it. `goleak` in CI catches the cases review misses.

Two related shapes worth naming:

- If the producer *is* a group member, the same code produces not a leak but a **deadlock** — `Wait` blocks forever waiting for the parked send (at least it fails loudly).
- A producer that sends with `select` but receives on a channel whose consumer has quit leaks the same way; `Done` arms belong on both sides.

## errgroup.SetLimit: bounded fail-fast fan-out

`SetLimit` turns an errgroup into an admission-controlled group. Each `Go` call beyond the limit blocks until a slot frees:

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(8)
for _, item := range items {
    g.Go(func() error {
        return process(ctx, item)
    })
}
err := g.Wait()
```

## Design rules distilled

1. **Cancellation ≠ bounding.** Wire both: context for stopping, a limit/semaphore/pool for capacity.
2. **Every goroutine needs an owner** — someone who waits on it or cancels it. "Fire and forget" is the leak factory.
3. **Channel ops inside cancellable code need `Done` arms on both send and receive sides.** Cancellation does not unblock a blocked channel operation.
4. **Batches → groups; streams → pools/queues.** Fail-fast only when partial results are worthless.
5. **Put `goleak` in CI** — it catches the parked-goroutine cases that code review misses.

## References

- [Bounding Concurrency in Go: errgroup, Worker Pools, and Backpressure (DEV.to)](https://dev.to/rosgluk/bounding-concurrency-in-go-errgroup-worker-pools-and-backpressure-1eh4)
- [golang.org/x/sync/errgroup documentation](https://pkg.go.dev/golang.org/x/sync/errgroup)
- [uber-go/goleak — goroutine leak detector](https://github.com/uber-go/goleak)
