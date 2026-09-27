---
title: How to Test Scheduled Jobs by Faking the Clock with faketime
diataxis: How-to Guide
domain: developer-tools-practices
topic: ci-performance
source: DEV.to Tech News
source_url: https://dev.to/jantolentino/testing-scheduled-jobs-using-faketime-2b4l
date: 2026-09-27
keywords:
- knowledge-base
- ci-performance
- developer-tools-practices
- how-to
---
# How to Test Scheduled Jobs by Faking the Clock with faketime

Unit tests should catch scheduling defects — but sometimes you need to simulate a **real execution** of a scheduled job (e.g. a daily/monthly/yearly export) without waiting for that date or changing the host's clock. `faketime` does exactly this: it manipulates system time for a specific program by intercepting its time-related syscalls, so the program runs as if it were a different date — while the rest of the system keeps real time.

## Goal

Run a Laravel scheduled job inside a container at an arbitrary simulated timestamp (e.g. "30 days ago at 01:00 UTC") to verify daily/monthly/yearly export behavior.

## Steps

### 1. Check that `faketime` is available in the image

It's not commonly included, so confirm the library exists first:

```bash
podman exec -it {container_name} find / -name libfaketime.so.1
```

If it finds the file (typically `/usr/lib/faketime/libfaketime.so.1`), you're ready; otherwise install `faketime` into the image.

### 2. Run the job with a faked clock

```bash
podman exec -it {container_name} sh -c "LD_PRELOAD=/usr/lib/faketime/libfaketime.so.1 FAKETIME_NO_CACHE=1 FAKETIME=\"$(date -u -d '30 days ago' '+%Y-%m-%d 00:01:00')\" php artisan schedule:work"
```

What each piece does:

- `LD_PRELOAD=/usr/lib/faketime/libfaketime.so.1` — loads the faketime library before the command runs, so its time syscalls are intercepted.
- `FAKETIME_NO_CACHE=1` — prevents the faked time from being cached; important for testing where the job reads the clock multiple times.
- `FAKETIME="<timestamp>"` — sets the exact simulated time. Here `date -u -d '30 days ago' '+%Y-%m-%d 00:01:00'` produces "30 days ago at 01:00 UTC".

### 3. Vary the timestamp per schedule cadence

To cover daily, monthly, and yearly behavior, just change the `date` string — e.g. `'last month'`, `'1 year ago'` — so each run simulates the relevant boundary without touching real time or waiting weeks.

## Why this beats the alternatives

- **No host clock changes** — other services on the machine keep running with correct time.
- **Deterministic** — you pick the exact instant, including timezone (use `-u` for UTC to match how the scheduler evaluates cron expressions).
- **Reproducible in CI** — the same command runs identically in a containerized test environment.

## Caveats

- The faked time applies only to processes started under `LD_PRELOAD`; anything already running keeps real time.
- Programs that cache time at startup (or use non-standard clock sources) may not see the fake consistently — hence `FAKETIME_NO_CACHE=1`.

## References

- [Testing scheduled jobs using faketime (DEV.to)](https://dev.to/jantolentino/testing-scheduled-jobs-using-faketime-2b4l)
- [faketime project page](http://koteng.github.io/projects/faketime/)
