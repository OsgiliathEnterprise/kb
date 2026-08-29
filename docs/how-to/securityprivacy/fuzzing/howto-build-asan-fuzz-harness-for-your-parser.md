---
title: How to Build an ASAN-Instrumented Fuzz Harness for Your Parser — Lessons from
  a Vibecoded FFmpeg Fuzzer
diataxis: How-to Guide
domain: security-privacy
topic: fuzzing
source: DEV.to Tech News
source_url: https://dev.to/jamilxt/21-bytes-can-crash-ffmpeg-inside-the-vibecoded-fuzzer-that-found-what-years-of-audits-missed-fpe
date: 2026-08-29
keywords:
- knowledge-base
- fuzzing
- security-privacy
- how-to
---
# How to Build an ASAN-Instrumented Fuzz Harness for Your Parser — Lessons from a Vibecoded FFmpeg Fuzzer

An AI-assisted coverage-guided fuzzer ([fuzzer-tool](https://github.com/daedalus/fuzzer/) on GitHub) found a deterministic crash in FFmpeg's VPK (PS2 video package) demuxer with **21 bytes of input** — in a library that has been continuously fuzzed by OSS-Fuzz for most of the past decade. One machine, one overnight run: 10 hours 43 minutes to a reportable bug with suggested fix and regression test. The fuzzer itself is a coverage-guided binary fuzzer with 147 mutation operators across 9 categories, 14 scheduler modules under Elo arbitration, AFL-style forkserver execution, shared-memory edge coverage, and comparison tracing down to individual call sites — and its README honestly admits it is slower in raw throughput than the AFL family (AFL remains the better choice for production-scale fuzzing).

The article's core argument: this was **engineering with guardrails, not lucky vibes**. The repo's `AGENTS.md` (human-maintained instructions for the AI agents working on the codebase) enforces rules like: always find the closest existing example and match its conventions before adding anything; never bypass pre-commit hooks; register new mutation operators in a single source-of-truth registry so every scheduler discovers them automatically; never commit corpus directories. Findings documents follow a template with crash metadata, GDB backtraces, an exploitability assessment separating "this is a DoS primitive" from "this is memory corruption," a suggested fix, and a regression test.

## The 21-byte VPK crash — and why your reproduction may fail (instructively)

The issue's trigger chain requires **probe-time data and packet-read-time data to diverge**, which happens in the fuzzer's custom `AVIO` path where the harness feeds FFmpeg from an in-memory buffer it controls. The CLI reading a file from disk takes a different I/O path — so reproducing with:

```bash
printf '\x20\x4b\x50\x56\x56\x50\x00\xf8\x04\x00\x3b\x03\x61\x39\x56\x32\x36\x36\x30\x38\x50' > vpk_crash.bin
ffmpeg -i vpk_crash.bin -c:a copy -f null -
```

on FFmpeg 6.1.1 (Ubuntu) yields **no crash**: FFmpeg detects the VPK container, reports an absurd audio stream (942,683,702 Hz sample rate, 80 channels), fails to open the ADPCM decoder, and exits cleanly with a demuxing error — exactly the behavior you want. The mismatch is itself evidence for the root cause: the channel count genuinely depends on *which snapshot of the data you ask*, and that ambiguity kills the dividing instruction when the wrong snapshot wins.

Two takeaways from the failed-then-understood reproduction:

1. **A crash report without the exact harness is not a reproduction.** Environment, version, and I/O setup all matter — which is why the issue includes the full backtrace, target hash, and seed.
2. **The parse result alone is a finding.** Even on the "safe" path, FFmpeg happily reported a 942 MHz sample rate and 80 channels from 21 bytes before erroring out. Malformed-input tolerance is a spectrum; watching where your parser lands on it is free intelligence.

## The harness anatomy (the part you can copy)

The fuzzer's FFmpeg target, `ffmpeg_read.c`, is a model of what a fuzz harness should be — the core loop is five FFmpeg API calls:

```c
avformat_open_input(&fmt_ctx, NULL, NULL, NULL);
avformat_find_stream_info(fmt_ctx, NULL);
while (av_read_frame(fmt_ctx, pkt) >= 0) {
    avcodec_send_packet(dec_ctx, pkt);
    while (avcodec_receive_frame(dec_ctx, frame) >= 0) { /* got frames */ }
}
avformat_close_input(&fmt_ctx);
```

Around that skeleton sit the details that separate a toy from a bug finder:

- **Custom in-memory I/O.** Instead of writing files to disk, the harness allocates an `AVIOContext` backed by a memory buffer — each mutated input is fed at memory speed and, crucially, through the custom-I/O path where probe and packet data can diverge. That is precisely where the VPK bug lived.
- **ASAN, always.** The target compiles with `-fsanitize=address`. Memory bugs that would silently corrupt data on a normal build become loud, attributed crashes on an instrumented one.
- **Coverage feedback.** An AFL-compatible edge map updated from the target via a small shim rewards mutations that reach new code. Blind mutation finds the shallow stuff; coverage guidance digs into a specific demuxer's final-block branch.
- **Guardrails against false positives.** The harness caps packets per input, runs a watchdog timer so a hung demuxer cannot stall the campaign, and deliberately routes subtitle streams through a different decode API — driving them through the modern packet API trips an internal FFmpeg assertion that would be a *harness artifact*, not a real finding. That comment alone saved them from reporting a bug that does not exist.

## The five-step recipe for your own parser

1. **Pick a target that parses untrusted input** — anything accepting bytes from users: media, documents, archives, protocol messages.
2. **Write the thinnest possible harness.** Feed a byte buffer straight into the parser's public entry point; resist adding logic.
3. **Instrument with a sanitizer.** ASAN or UBSAN for C/C++, equivalent checkers elsewhere. A fuzzer without instrumentation misses the bugs that matter most.
4. **Seed with real samples.** A handful of valid files give the mutator structure to break — the campaign that found the VPK bug grew a corpus of 13,188 entries.
5. **Triage like the findings doc does.** Deduplicate by stack trace, minimize the input, classify the signal (DoS primitive vs. memory corruption), write the two-line fix and regression test while context is fresh. A crash you cannot explain is a crash you cannot report.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "fz1",
      "type": "rectangle",
      "x": 60,
      "y": 80,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Seed corpus\nvalid samples (grew to\n13,188 entries)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "fz2",
      "type": "rectangle",
      "x": 380,
      "y": 60,
      "width": 260,
      "height": 140,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Mutator\n147 operators / 9 categories\n14 schedulers (Elo arbitration)\nAFL-style forkserver",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "fz3",
      "type": "rectangle",
      "x": 720,
      "y": 60,
      "width": 280,
      "height": 140,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Target (ASAN build)\nthin harness: buffer -> parser\nentry point; in-memory AVIO;\nwatchdog + packet caps",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "fz4",
      "type": "rectangle",
      "x": 720,
      "y": 260,
      "width": 280,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Coverage feedback\nAFL-compatible edge map\nvia small shim",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "fz5",
        "type": "arrow",
        "x": 300,
        "y": 130,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "fz6",
        "type": "arrow",
        "x": 640,
        "y": 130,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "fz7",
        "type": "arrow",
        "x": 860,
        "y": 260,
        "width": 0,
        "height": 60,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            0,
            -60
          ]
        ]
      }
    ]
  ]
}
```

## What to do this week (defender checklist)

- **Inventory your parsers** — every place your systems accept bytes from outside; rank by exposure, not code age.
- **Point an ASAN build plus a fuzzer at the top one.** libFuzzer, AFL++, or the AI-assisted route above: hours, not weeks.
- **Adopt the findings-doc template** for every crash: backtrace, minimization, severity honesty, suggested fix, regression test — it converts a scary stack trace into a mergeable pull request.
- **Close your known-but-unfixed guards.** The VPK division had a proposed fix sitting in a mailing-list archive for almost two years; every codebase has its own version of that thread.

The uncomfortable implication: the marginal cost of finding a real, reportable bug in critical infrastructure just dropped to "leave your laptop running while you sleep," and the bug classes that fall first are the unglamorous ones — rarely-touched demuxers and obscure format branches where a validation guard has been missing for years. Anything that parses attacker-controlled bytes needs a fuzzing story; "nobody will bother" is no longer an excuse, because bothering now costs pennies of compute.

## References

- [21 Bytes Can Crash FFmpeg: Inside the Vibecoded Fuzzer That Found What Years of Audits Missed (dev.to)](https://dev.to/jamilxt/21-bytes-can-crash-ffmpeg-inside-the-vibecoded-fuzzer-that-found-what-years-of-audits-missed-fpe)
- [fuzzer-tool — the AI-assisted coverage-guided fuzzer](https://github.com/daedalus/fuzzer/)
