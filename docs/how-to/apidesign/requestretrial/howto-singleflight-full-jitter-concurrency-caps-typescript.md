---
title: How to Retry a Shared Public API Without Thundering Herds — Single-Flight,
  Full Jitter, and Concurrency Caps (TypeScript)
diataxis: How-to Guide
domain: api-design
topic: request-retrial
source: DEV.to Tech News
source_url: https://dev.to/vin_lookup_8dbd4710f77e9e/retry-backoff-and-jitter-for-nhtsa-decodevinvalues-without-thundering-herds-29n1
date: 2026-10-07
keywords:
- knowledge-base
- request-retrial
- api-design
- how-to
---
# How to Retry a Shared Public API Without Thundering Herds — Single-Flight, Full Jitter, and Concurrency Caps (TypeScript)

When many clients call the same free public endpoint (here: NHTSA's `DecodeVinValues` vPIC API), naive retries make outages *worse*: every client wakes up, fails, sleeps the same 500 ms, and hammers the upstream together again. This note is a concrete TypeScript recipe that combines **single-flight request coalescing**, **exponential backoff with full jitter**, and **process-wide concurrency caps** so retries de-synchronize instead of synchronize.

## Step 1 — Classify what is worth retrying

Retry only **transient** failures:
- Network resets and timeouts
- HTTP `429` (rate limited)
- HTTP `502 / 503 / 504`
- Empty body or parse errors that look like a blip (use caution; count them)

Do **not** retry as if transient:
- Local validation failures (length, I/O/Q check digit)
- Clear `400`-style "bad input" responses you can classify
- HTTP `200` with sparse fields — that is *success with incomplete data*, not a failure
- Invented business logic ("Make was blank, try again")

Blindly retrying sparse 200s wastes quota and delays the honest empty-field UI.

## Step 2 — Single-flight before you even think about backoff

Collapsing duplicate in-flight requests for the same key matters more than fancy backoff curves. If ten components all decode the same VIN, you want **one** upstream call:

```typescript
const inflight = new Map<string, Promise<unknown>>();

export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
```

Wrap the **whole** `fetchWithRetry` in `singleFlight(vin, ...)`, not each attempt separately — otherwise you coalesce attempts but still fan out per key.

## Step 3 — Exponential backoff with full jitter

AWS-style "full jitter" picks a random delay uniformly between 0 and the current cap, which spreads load far better than everyone sleeping exactly `2^attempt` seconds:

```typescript
export type RetryOpts = {
  maxAttempts?: number; // inclusive of first try
  baseMs?: number;
  maxMs?: number;
  retryOn?: (err: unknown) => boolean;
};

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function fullJitter(cap: number) { return Math.floor(Math.random() * Math.max(0, cap)); }

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOpts = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 4;
  const baseMs = opts.baseMs ?? 200;
  const maxMs = opts.maxMs ?? 8_000;
  const retryOn = opts.retryOn ?? defaultRetryOn;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !retryOn(err)) throw err;
      const cap = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
      await sleep(fullJitter(cap));
    }
  }
  throw lastErr;
}

function defaultRetryOn(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const s = Number((err as { status: number }).status);
    return s === 429 || s === 502 || s === 503 || s === 504;
  }
  if (err && typeof err === "object" && "name" in err) {
    const n = String((err as { name: string }).name);
    return n === "AbortError" || n === "FetchError" || n === "TimeoutError";
  }
  return false;
}
```

Tune `baseMs` / `maxAttempts` for interactive UI (short, few tries) versus background batch (longer, more tries, lower concurrency).

## Step 4 — Wire it to the endpoint with abort support

```typescript
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function decodeVinValues(vin: string, signal?: AbortSignal) {
  return singleFlight(vin, () =>
    withRetry(async () => {
      const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new HttpError(res.status, `vPIC ${res.status}`);
      const data = await res.json();
      const row = data?.Results?.[0];
      if (!row) throw new HttpError(502, "vPIC empty Results");
      return row;
    }, { maxAttempts: 4, baseMs: 250, maxMs: 6_000 })
  );
}
```

Use `AbortSignal` from the UI so navigating away cancels waits. **Do not retry after an abort.**

## Step 5 — Caps that actually prevent herds (retries alone are not enough)

- **Global concurrency limit** on outbound calls (e.g. a process-wide semaphore of 2–5).
- **Per-key positive cache** for successful rows (short TTL) so refresh spam doesn't create new storms.
- **Negative/error cache** for 30–120 s after exhausting retries, so a hot key doesn't loop forever.
- **Jittered cron** for batch jobs — random delay at the start of each worker so deploys don't synchronize cold-starts.

When many serverless instances cold-start together, synchronized retries are common; full jitter plus a process-wide semaphore is what breaks it.

## Step 6 — UX and observability during retries

Users should see status, not a frozen button:
- Attempt 1 failure → "Upstream is slow; retrying…"
- After final failure → "Unavailable right now. Try again in a minute." Never show a previous input's result under the new one.
- **Never map a timeout to "invalid input."**

Log/metric per call: `attempt`, `success`, `retry`, `give_up`, status codes, latency per attempt, and whether served from cache. **Alert on give-up rate, not on single 429s.** A brief rate-limit spike with successful jittered recovery is healthy; a high give-up rate with low cache-hit ratio means you need more caching or less fan-out.

## Key takeaways

- Order of operations: classify transient errors → coalesce duplicates (single-flight) → backoff with full jitter → cap concurrency. Coalescing and capping matter as much as the backoff curve.
- Full jitter (`rand(0, min(maxMs, base·2^attempt))`) is the de-synchronization primitive; deterministic `2^attempt` sleeps re-create the herd at every round (see [[explanation-why-backoff-algorithms-need-jitter]]).
- The goal is a *calm client* during upstream blips — not a synchronized hammer.

## Related notes

- `api-design/request-retrial/explanation-why-backoff-algorithms-need-jitter.md`
- `api-design/request-retrial/howto-classify-http-errors-by-retry-eligibility.md`
- `system-design/Scaling-Foundations/explanation-cache-stampede-thundering-herd-prevention.md` — the server-side twin of this client-side problem

## References

- [Retry, Backoff, and Jitter for NHTSA DecodeVinValues Without Thundering Herds (DEV.to)](https://dev.to/vin_lookup_8dbd4710f77e9e/retry-backoff-and-jitter-for-nhtsa-decodevinvalues-without-thundering-herds-29n1)
- [AWS Architecture Blog: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
