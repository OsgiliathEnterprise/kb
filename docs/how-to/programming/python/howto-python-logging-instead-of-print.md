---
title: Python Logging Tutorial — Replacing print() with the logging Module
diataxis: How-to Guide
domain: programming
topic: python
source: DEV.to Tech News
source_url: https://dev.to/sameerqaisar17/python-logging-how-to-stop-using-print-for-debugging-54b6
date: 2026-10-10
keywords:
- knowledge-base
- python
- programming
- how-to
---
# Python Logging Tutorial — Replacing print() with the logging Module

A beginner-oriented walkthrough of moving from `print()`-based debugging to Python's standard-library `logging` module. The core idea: **`print()` is for output; `logging` is for diagnostics** — they are different tools, and mixing them makes output hard to parse.

## Why print() breaks down as a debug tool

```python
def divide(a, b):
    print("Starting divide")
    print(f"a = {a}, b = {b}")
    result = a / b
    print(f"Result: {result}")
    return result
```

Problems with this approach:

- You have to delete the statements later — or leave messy output in production.
- No timestamps, no severity levels, no file output.
- You can't turn it off without editing code.
- Every debug session becomes a cleanup job.

## The replacement: logging basics

```python
import logging

logging.basicConfig(level=logging.INFO)

def divide(a, b):
    logging.info("Starting divide")
    logging.debug(f"a = {a}, b = {b}")
    result = a / b
    logging.info(f"Result: {result}")
    return result
```

Output at `level=INFO`:

```
INFO:root:Starting divide
INFO:root:Result: 5.0
```

Notice the **debug line did not print** — messages below the configured level are hidden by default. Set the level once and all messages below it disappear without touching call sites.

## The five log levels

| Level | When to use |
| --- | --- |
| `DEBUG` | Detailed info for diagnosing a problem |
| `INFO` | Confirmation that things are working |
| `WARNING` | Something unexpected, but not breaking |
| `ERROR` | Something failed |
| `CRITICAL` | The program cannot continue |

## Logging to a file

```python
import logging

logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logging.info("App started")
logging.warning("Low disk space")
logging.error("Could not connect to database")
```

Resulting `app.log`:

```
2026-10-10 14:32:01,234 - INFO - App started
2026-10-10 14:32:01,235 - WARNING - Low disk space
2026-10-10 14:32:01,236 - ERROR - Could not connect to database
```

Now you have timestamps, levels, and a permanent record.

## The most useful combination: try/except + logging.exception()

```python
import logging

logging.basicConfig(level=logging.INFO)

try:
    result = 10 / 0
except ZeroDivisionError:
    logging.exception("Division failed")
```

`logging.exception()` automatically includes the **full traceback** — no more losing the error context. (Call it only inside an `except` block; outside one it logs a "No exception" placeholder.)

## Common beginner mistakes

1. **Forgetting to set the level.** Without `level=logging.INFO`, only warnings and above show up (the default root level is WARNING).
2. **Using print() and logging together.** Pick one — mixing them makes output hard to parse.
3. **Logging sensitive data.** Log levels don't protect secrets; never log credentials, tokens, or PII at any level.

## Key takeaways

- `logging.basicConfig()` sets the format, level, and destination in one call.
- Log levels let you control verbosity without changing code.
- `logging.exception()` captures tracebacks automatically inside handlers.
- Log to a file for anything you want to keep; log to console during development.

## References

- [Python Logging: How to Stop Using print() for Debugging (DEV.to)](https://dev.to/sameerqaisar17/python-logging-how-to-stop-using-print-for-debugging-54b6)
- [Python logging module documentation](https://docs.python.org/3/library/logging.html)
