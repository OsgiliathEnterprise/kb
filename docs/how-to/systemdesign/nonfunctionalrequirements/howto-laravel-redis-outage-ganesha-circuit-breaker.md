---
title: How to Make a Laravel App Survive Redis Outages with the Ganesha Circuit Breaker
diataxis: How-to Guide
domain: system-design
topic: Non-Functional-Requirements
source: DEV.to Tech News
source_url: https://dev.to/jantolentino/when-redis-goes-down-does-your-app-die-4kmf
date: 2026-09-27
keywords:
- knowledge-base
- Non-Functional-Requirements
- system-design
- how-to
---
# How to Make a Laravel App Survive Redis Outages with the Ganesha Circuit Breaker

Laravel assumes your cache is always there. When Redis dies, `Cache::remember` throws and every request crashes with a 500. The fix is **graceful degradation**: when the cache fails, fall back to querying the database directly instead of failing catastrophically — slower, but alive.

## Why not just try-catch?

Wrapping cache logic in `try-catch` stops the crash but introduces a worse problem: while Redis is down, every request still waits for the connection timeout before the exception fires. That latency tax hits *every* request during the outage.

```php
trait ResilientCacheAside
{
    protected function rememberSafe(string $key, Closure $callback, int $ttl = 100)
    {
        try {
            $value = Cache::get($key);
            if (!is_null($value)) return $value;
        } catch (\Exception $e) {
            \Log::error("Cache read failed: " . $e->getMessage());
        }

        $value = $callback();

        try {
            if (!is_null($value)) {
                Cache::put($key, $value, $ttl);
            }
        } catch (\Exception $e) {
            \Log::error("Cache write failed: " . $e->getMessage());
        }

        return $value;
    }
}
```

## The circuit breaker approach

A **circuit breaker** tracks failures over time. Once a threshold is reached, the circuit *opens* and the app skips the cache entirely for a set period (straight to the database — no timeout waiting). After a cooling-off period it goes *half-open* to probe whether Redis is back; if so, it closes and normal operation resumes. This eliminates the per-request timeout delay during an outage.

The [Ganesha](https://github.com/ackintosh/ganesha) PHP library implements this with pluggable strategies (rate or count) and storage adapters (APCu, Redis, Memcached, MongoDB). Confirmed on Packagist as `ackintosh/ganesha`.

## Steps

### 1. Install the library

```bash
composer require ackintosh/ganesha
```

### 2. Build a breaker service with an APCu adapter

Key detail: store the circuit state in **APCu, not Redis** — storing "is Redis down?" inside Redis itself is a circular dependency.

```php
class CircuitBreakerService
{
    protected array $breakers = [];

    protected function getBreaker(string $serviceKey): Ganesha
    {
        if (!isset($this->breakers[$serviceKey])) {
            $this->breakers[$serviceKey] = Builder::withRateStrategy()
                ->adapter(new Apcu())
                ->timeWindow(10)              // monitor failures over the last 10 seconds
                ->failureRateThreshold(10)    // open circuit if 10% of requests fail
                ->minimumRequests(5)          // don't trigger until at least 5 requests
                ->intervalToHalfOpen(15)      // wait 15s before probing recovery
                ->build();
        }
        return $this->breakers[$serviceKey];
    }

    public function execute(string $serviceKey, callable $primary, callable $fallback): mixed
    {
        $breaker = $this->getBreaker($serviceKey);

        if ($breaker->isAvailable($serviceKey)) {
            try {
                $result = $primary();
                $breaker->success($serviceKey);
                return $result;
            } catch (Throwable $e) {
                $breaker->failure($serviceKey);
                return $fallback($e);
            }
        }

        return $fallback();
    }
}
```

The `$serviceKey` is just a unique string per resource (`redis_cache`, `external_api`) — tripping the breaker for one service doesn't affect others. Ganesha's rate strategy uses a sliding time window on Redis/MongoDB adapters and a tumbling window on APCu/Memcached (a storage-capability constraint).

### 3. Use it in application code

```php
public function getLowQuantityProducts(int $threshold = 10): stdClass
{
    return $this->circuitBreaker->execute(
        'redis_cache',
        fn() => Cache::remember("analytics.low_quantity.{$threshold}", 3600,
            fn() => $this->productService->getLowQuantityProducts($threshold)
        ),
        fn() => $this->productService->getLowQuantityProducts($threshold)
    );
}
```

### 4. Verify the state transitions

Stop the Redis container and refresh: the app should promptly switch to the database (circuit open). Restart Redis; after `intervalToHalfOpen` seconds the circuit closes and cache reads resume.

## Limitations

If you store **sessions** in Redis, this does not fix them: Laravel's session driver loads very early in the request lifecycle, before service classes exist, so a dead Redis still crashes the site. That requires a custom session driver with its own fallback — out of scope here.

See [redis-circuit-breaker.excalidraw](redis-circuit-breaker.svg) for the state machine and request flow.

## References

- [When Redis goes down, does your app die? (DEV.to)](https://dev.to/jantolentino/when-redis-goes-down-does-your-app-die-4kmf)
- [Ganesha — PHP circuit breaker library](https://github.com/ackintosh/ganesha)
- Related: How to implement a circuit breaker with exponential backoff and jitter
