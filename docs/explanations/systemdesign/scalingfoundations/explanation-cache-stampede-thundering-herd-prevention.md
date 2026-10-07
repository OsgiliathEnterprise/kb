---
title: 'Cache Stampede (Thundering Herd): Why One Expired Key Can Take Down Your Backend'
diataxis: Explanation
domain: system-design
topic: Scaling-Foundations
source: DEV.to Tech News
source_url: https://dev.to/delehq/the-cache-stampede-problem-why-a-popular-cache-key-can-take-down-your-backend-1jol
date: 2026-10-07
keywords:
- knowledge-base
- Scaling-Foundations
- system-design
- explanations
---
# Cache Stampede (Thundering Herd): Why One Expired Key Can Take Down Your Backend

A cache is supposed to shield the backend from load. The **cache stampede** (a.k.a. thundering herd / dog-piling) is the failure mode where the cache itself becomes the trigger for an outage: a single hot key expires, and every request that arrives in the next few hundred milliseconds sees the same miss and independently recomputes the value — turning one expensive query into hundreds of concurrent copies hitting the database at once.

## Why it happens

The core issue is that a cache miss is interpreted identically by every request: *check cache → find nothing → recompute → write back*. Nothing in that logic asks "is someone else already recomputing this right now?" Three common triggers:

- **Hot key with hard TTL** — steady traffic on a widely used entry; the instant it expires, every arriving request misses.
- **Cold cache after deploy/restart** — many hot keys emptied at once; previously-cached traffic all needs recompute simultaneously.
- **Viral key** — sudden spike in requests for one item (trending page, breaking news) that coincides with its refresh window.

### Concrete scale example

An endpoint returns a leaderboard from an 800 ms query over a large table, cached for 60 s. At normal traffic, one request pays the cost per minute and everyone else reads in milliseconds. But at **500 requests/second**, the instant the entry expires up to ~500 concurrent 800 ms queries can land on the database before the first recompute writes back — enough alone to cause timeouts, connection exhaustion, or cascading slowdown of unrelated endpoints sharing that database.

## The five standard mitigations

| Technique | Mechanism | Cost / trade-off |
| --- | --- | --- |
| **Locking around recomputation** | First miss acquires a short-lived lock (e.g. Redis `SET key val NX PX ttl`); others wait briefly then read the fresh value, or fall back to stale data | Distributed-lock complexity; losers add latency or staleness |
| **Request coalescing / single-flight** | In-process: if a recompute for a key is already in flight, new requests attach to it and share the result | No lock overhead, but only works within one process — needs coordination across instances for full coverage |
| **TTL jitter** | Add a random offset per entry (e.g. 60 s ± 10 s) so expirations spread over a window instead of clustering | Nearly free; the default first move when many entries share a TTL |
| **Stale-while-revalidate** | Serve the expired value immediately while a background refresh updates it — same idea as HTTP `Cache-Control: stale-while-revalidate` | Accepts bounded staleness; zero added latency for readers |
| **Probabilistic early expiration (XFetch)** | Each read has an increasing probability of proactively triggering a background refresh *before* expiry, spreading work over time | Extra state (`delta`, `expiry`) and complexity; best reserved for the highest-traffic, highest-cost keys |

### XFetch in detail

Popularized by Facebook's engineering team (and formalized as optimal in Vattani et al., VLDB 2015), each cached entry stores two extra fields: `delta` (how long the last recompute took) and `expiry`. On every read, a cheap inequality decides whether this reader volunteers to refresh early:

```
if !value or time() - delta * beta * ln(rand()) >= expiry then
    value <- recompute_value()
    cache_write(key, (value, delta), ttl)
end
return value
```

- `rand()` is uniform on (0, 1], so `-delta * beta * ln(rand())` is always a positive lead time.
- The lead time grows with `delta` — expensive keys volunteer earlier, which is exactly the work you most want hidden off the request path.
- `beta` (default 1.0) tunes eagerness: > 1 recomputes earlier, &lt; 1 later; good range roughly 0.5–2.0.
- Far from expiry the gap `expiry - now` is large and almost no reader triggers; as `now` approaches expiry the trigger probability rises smoothly toward one — a single early refresh resets the clock before any herd forms. No locks, no coordination, no extra round trips.

The Internet Archive's RedisConf 2017 harness (`stampede.php`) benchmarks four strategies: plain `fetch`, `locked`, `xfetch`, and `xlocked` (XFetch + a lock that "ducks out" — if the lock is held but a value exists, return it instead of waiting). Findings: `fetch` collapses under load; `locked` fixes stampede but starves workers behind slow recomputes; `xfetch` handles most situations with occasional simultaneous recomputes; `xlocked` gives zero misses and no simultaneous recomputes at the cost of extra stored state.

### Choosing between them

- **Jitter** is close to free — add it almost anywhere many entries share a TTL.
- **Locking / single-flight** when recompute is expensive and a short wait (or slightly stale read) is acceptable for the few requests that lose the race.
- **Stale-while-revalidate** when slightly outdated data is fine and no user should ever wait on a slow recompute.
- **XFetch** for your highest-traffic, highest-cost entries — but watch `beta`: too high and you recompute constantly (waste), too low and the window collapses onto expiry (herd returns). Diagnose by counting recomputes per expiry interval; healthy is roughly one recompute per TTL window.

## Key takeaways

- A cache's job is not just to store values — it is to make sure **expensive work happens once, not once per concurrent request**. Any strategy that ignores "what happens when many requests see the same miss at the same time" solves half the problem.
- None of these require replacing your caching layer: Redis, Memcached, CDNs, and app-level caches all support at least one pattern; jitter or a simple lock is usually a small isolated change.
- The techniques compose: jitter + single-flight for most keys, stale-while-revalidate where staleness is acceptable, XFetch (or xlocked) for the crown-jewel hot keys.

## Related notes

- `api-design/request-retrial/explanation-why-backoff-algorithms-need-jitter.md` — client-side twin: deterministic retry back-off creates synchronized herds; jitter breaks synchronization
- `system-design/CDN-Design/howto-handle-cdn-miss-origin-fetch.md` — the same miss-amplification problem at CDN edge

## References

- [The Cache Stampede Problem: Why a Popular Cache Key Can Take Down Your Backend (DEV.to)](https://dev.to/delehq/the-cache-stampede-problem-why-a-popular-cache-key-can-take-down-your-backend-1jol)
- [Optimal Probabilistic Cache Stampede Prevention — Vattani, Chierichetti, Lowenstein (VLDB 2015)](https://www.vldb.org/pvldb/vol8/p886-vattani.pdf)
- [Internet Archive: Preventing cache stampede with Redis & XFetch (RedisConf 2017 harness)](https://github.com/internetarchive/xfetch/)
