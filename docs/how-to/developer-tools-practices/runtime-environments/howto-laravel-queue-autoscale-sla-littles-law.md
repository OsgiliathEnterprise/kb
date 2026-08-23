---
title: Sizing Laravel Queue Workers by SLA Instead of Guessing (laravel-queue-autoscale)
diataxis: How-to Guide
domain: Developer Tools & Practices
topic: Runtime Environments
source: DEV.to (kevariable)
source_url: https://dev.to/kevariable/your-laravel-queue-worker-count-is-a-guess-here-is-the-math-that-replaces-it-31ba
date: 2026-08-22
keywords:
- knowledge-base
- Runtime Environments
- Developer Tools & Practices
- how-to
---
# Sizing Laravel Queue Workers by SLA Instead of Guessing

## The Problem

Most Laravel deployments carry a folklore worker count:

```ini
[program:queue-worker]
numprocs=10
```

Why 10? Nobody knows. Too low and jobs wait minutes during a campaign blast; too high and you burn RAM all night for idle workers. The number is wrong in both directions because load changes and the config does not.

This note summarizes a measured test of [cboxdk/laravel-queue-autoscale](https://github.com/cboxdk/laravel-queue-autoscale) (+ `cboxdk/laravel-queue-metrics`), by Sylvester Damgaard (ex-Laravel queue manager). Instead of a worker count, you **declare a promise** and the count is derived.

## The Formula: Little's Law Applied to Queues

Declare one thing — an SLA: *"a job on this queue must be picked up within 10 seconds."* A manager process then solves every 5 seconds:

```
workers = (pending jobs / SLA seconds) / jobs per second per worker
```

Read in two steps:

1. `pending / SLA seconds` = throughput you **need**: 3,000 pending with a 10s promise → 300 jobs/s
2. Divide by what one worker does (a ~100ms job ≈ 10 jobs/s) → **30 workers**

Same reasoning as "I need to move 300 boxes per hour, one person moves 10, so I need 30 people." This is **Little's Law** from queueing theory — the same 1961 theorem behind checkout lines and CPU schedulers. The only human input is a *business* question (how long may a job wait?), not a technical guess (how many processes?).

It mirrors sizing a PHP-FPM pool with `max_children = RAM / avg process size`: measure one unit, derive the count.

## Setup

```bash
composer require cboxdk/laravel-queue-autoscale cboxdk/laravel-queue-metrics
php artisan vendor:publish --tag=queue-autoscale-config
```

```php
// config/queue-autoscale.php
'queues' => [
    'orders' => [
        'connection' => 'redis',
        'sla' => ['target_seconds' => 10],
        'workers' => ['min' => 1, 'max' => 16],
    ],
],
```

Then run `php artisan queue:autoscale` — it spawns and kills plain `php artisan queue:work` processes; the workers don't know the autoscaler exists.

**Gotchas (both cost real time):**

- The manager needs `ext-pcntl` (v4 also `ext-posix`)
- Each queue entry needs an explicit `'connection'` — otherwise it silently looks for a connection literally named `default` and every evaluation fails into the log
- v4 requires **PHP 8.4+**; no Windows dev machines

## Measured: 3,000 Jobs at Once

Dispatched 3,000 ~100ms jobs against the 10s SLA, sampled every 5s:

| t    | workers | pending |
|------|---------|---------|
| 0s   | 1       | 3,000   |
| 5s   | 6       | 2,910   |
| 10s  | 10      | 2,619   |
| 15s  | 14      | 2,209   |
| 25s  | 16 (cap)| 956    |
| 35s  | 16      | 0       |

The formula wanted 30; the configured cap of 16 won (the package also caps by measured host CPU/RAM, so it won't scale past what the machine carries). All 3,000 jobs completed, none lost, and on SIGTERM every worker finished its in-flight job before dying. Scale-down is deliberately slow — one worker per cycle with an anti-flapping cooldown — so bursty queues don't yo-yo.

## The Part That Matters Most: An Outage Is Not Load

The trap with any naive autoscaler: your payment provider dies → every job fails and retries → backlog grows → the math screams "add workers!" → 16 workers hammer a dead API, helping nobody.

Simulated with 2,000 jobs that all throw. The manager logged:

```
fuse OPEN: 100.0% failure rate over 28 jobs, holding at workers.min instead
of scaling into the failure; backlog=1999 requires 999.5 workers to prevent
SLA breach
```

The backlog math demanded **999.5 workers**. The **failure fuse** allowed **1**: it detects that the *failure rate* (not the backlog) is the real signal, pins the queue at minimum, and uses that one worker as a probe. When failures stopped, the failure window aged out, the fuse closed itself (0% over 387 jobs) and normal scaling resumed — no restart, no human.

> "999.5 demanded, 1 allowed" is the difference between an autoscaler and a bash script.

## Do 16 Workers on One Queue Conflict?

No. When a worker claims a job, Laravel runs a **Lua script in Redis** that pops the job from the pending list **and** writes it to a reserved set as **one atomic operation**. Redis runs Lua single-threaded, so two workers can never claim the same job.

But the guarantee is **at-least-once**, not exactly-once:

- Reservations have a timeout (`retry_after`, default 90s) — a worker dying mid-job returns the job to pending and it runs again
- Keep jobs **idempotent**, keep `retry_after` longer than your slowest job, and reach for `ShouldBeUnique` / `WithoutOverlapping` when business logic needs it

## vs Horizon

Different question: Horizon balances workers **across** queues, but pool size is still `maxProcesses` — a number you pick. The autoscaler derives the number. They're not competitors; the gap in both worlds was never balancing, it was that someone still picks the number.

## Honest Tradeoffs

- Scales **processes on one host**, not machines; multi-host needs cluster mode (on Kubernetes you might prefer scaling pods)
- Young project, one maintainer; a real bug was found during testing (metrics package's Prometheus endpoint reads keys its own DTO does not write)
- The manager itself needs supervising (systemd / container restart policy) and runs continuously — a freshly restarted manager has no measurements and ramps lazily for a minute while re-learning

## Diagram: The Decision Loop

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "sla",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 200, "height": 80,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "You declare: SLA\n\"pick up within 10s\"\n(min/max workers)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "manager",
      "type": "rectangle",
      "x": 320, "y": 40,
      "width": 240, "height": 80,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Manager (every 5s)\nworkers = (pending/SLA)\n/ jobs-per-s-per-worker", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "fuse",
      "type": "rectangle",
      "x": 320, "y": 200,
      "width": 240, "height": 80,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Failure fuse\nfailure-rate signal\nholds at min (probe worker)\n999.5 demanded -> 1 allowed", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "workers",
      "type": "rectangle",
      "x": 640, "y": 120,
      "width": 200, "height": 100,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "queue:work processes\nspawned/killed\nRedis Lua atomic claim\nat-least-once", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "x": 240, "y": 80,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-2",
      "type": "arrow",
      "x": 440, "y": 120,
      "width": 200, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [200, 0]]
    },
    {
      "id": "arrow-3",
      "type": "arrow",
      "x": 440, "y": 200,
      "width": 0, "height": 80,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, -80]]
    }
  ]
}
```

## Takeaway

Worker counts, like FPM pool sizes, are **derivable numbers we've been configuring by folklore**. Declare the promise, measure the unit, let the math run every 5 seconds — and let the failure fuse pin you at one worker when everything is on fire.

## References

- [Your Laravel queue worker count is a guess. Here is the math that replaces it — DEV.to](https://dev.to/kevariable/your-laravel-queue-worker-count-is-a-guess-here-is-the-math-that-replaces-it-31ba)
- [cboxdk/laravel-queue-autoscale (GitHub)](https://github.com/cboxdk/laravel-queue-autoscale)
- [cboxdk/laravel-queue-metrics (Packagist)](https://packagist.org/packages/cboxdk/laravel-queue-metrics)
