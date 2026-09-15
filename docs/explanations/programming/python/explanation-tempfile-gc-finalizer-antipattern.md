---
title: Why Delegating Temp Directory Cleanup to Python's GC Is an Anti-Pattern
diataxis: Explanation
domain: programming
topic: python
source: DEV.to Tech News
source_url: https://dev.to/flude_team/the-leak-that-wont-die-how-we-broke-pythons-tempfile-95o
date: 2026-09-15
keywords:
- knowledge-base
- python
- programming
- explanations
---
# Why Delegating Temp Directory Cleanup to Python's GC Is an Anti-Pattern

A production post-mortem from the Flude team (C++ SDK with a Python engine) documents how "trusting the GC" for `tempfile` cleanup caused repeated CI failures: `/tmp` filling with thousands of orphaned directories, then — after the "fix" — multi-minute synchronous disk deletions blocking the main thread. The lesson: **finalizers are the wrong owner for heavy system resources**.

## The Failure Sequence

### Stage 1: Explicit cleanup that never runs

The engine ran Doxygen per module: `tempfile.mkdtemp()` → write a dynamic `Doxyfile` → parse hundreds of MB of XML → `cleanup()` with `shutil.rmtree()`. The flaw: if parsing raised, the pipeline aborted before `cleanup()` executed, leaving megabytes of garbage in `/tmp` forever. Nightly CI builds eventually died with `No space left on device`, and `/tmp` was full of directories prefixed `ude_xml_`.

A `try/finally` wrapper wasn't viable because the engine's logic was smeared across dozens of classes — the creation site and cleanup site couldn't be colocated.

### Stage 2: "Fix" via finalizers (the trap)

The rewrite switched to `tempfile.TemporaryDirectory`, whose `__del__` finalizer deletes the folder when the object is garbage-collected, and kept references in a global list on the manager class:

```python
temp_dir_obj = tempfile.TemporaryDirectory(prefix="ude_xml_")
self._active_temp_dirs.append(temp_dir_obj)  # keeps it alive until script end
```

This looked elegant — "the folder lives exactly as long as the engine needs it" — and complaints stopped for a few days. Then CI crashed again, worse than before.

### Stage 3: Why the GC made it worse

Three compounding problems:

1. **Delayed collection.** The engine parsed dozens of modules sequentially, creating one directory per module. Circular references in the parsers (AST nodes referencing parents, classes holding child lists) meant objects weren't reclaimed immediately — they waited for a full GC cycle. `TemporaryDirectory` objects piled up in RAM by the hundreds, and with them their on-disk directories.
2. **Uncontrollable timing.** You cannot control *when* the GC runs, so you cannot control when the disk I/O happens.
3. **Synchronous deletion storm.** When the GC finally collected the batch, each finalizer triggered a massive synchronous file deletion on the main thread — blocking execution for minutes and causing timeouts in other services on the same server.

## The Real Fix: Deterministic Lifecycle via Context Managers

The rewrite enforced one rule: **creating the folder and cleaning it up must happen in the same place.** All access to the temp files happens inside a `with` block, so deletion is guaranteed at block exit — even when an exception propagates:

```python
with tempfile.TemporaryDirectory(prefix="ude_xml_") as tmpdir:
    write_doxyfile(tmpdir)
    xml = run_doxygen(tmpdir)      # if this raises...
    parse(xml)                     # ...the directory is still deleted on exit
# guaranteed cleanup here, no GC involved
```

Two supporting measures:

- **Janitor sweep.** Before each build starts, a janitor scans `/tmp` for orphaned `ude_xml_*` directories and force-cleans them with a warning log — defense in depth against any future regression.
- **Colocation discipline.** The architectural change that actually mattered was moving the temp directory's lifecycle to one code site so create/cleanup can't be separated by an exception path.

## Generalizable Principles

1. **Finalizers are for best-effort hints, not correctness-critical resources.** `__del__` timing is non-deterministic (circular references, GC generation thresholds, interpreter shutdown order). Anything whose cleanup has a cost — disk I/O, network calls, locks — must have a deterministic owner.
2. **Batched finalizer execution creates load spikes.** N deferred cleanups become one synchronous burst on the main thread. If you must defer work, do it in a background worker with bounded concurrency, not in `__del__`.
3. **`with` blocks make exception paths free.** The context manager's `__exit__` runs on both normal and exceptional exits — this is exactly what `try/finally` gives you without the boilerplate, and it works even when the resource spans multiple classes (pass the directory path down; only the owner holds the handle).
4. **Add a janitor for anything that can leak.** Orphaned artifacts from crashed runs are inevitable in long-lived CI runners; a pre-run sweep converts "disk full" into a logged warning.

## References

- [The Leak That Won't Die: How We Broke Python's tempfile — DEV.to](https://dev.to/flude_team/the-leak-that-wont-die-how-we-broke-pythons-tempfile-95o)
- [Python docs: tempfile — Temporary files and directories](https://docs.python.org/3/library/tempfile.html)

## Related

- [[explanation-python-str-lower-idna-unicode-cve-2026-17084]]
