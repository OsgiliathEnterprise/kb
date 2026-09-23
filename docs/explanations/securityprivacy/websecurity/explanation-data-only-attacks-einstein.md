---
title: Data-Only Attacks Are Easier Than You Think — The Einstein Exploitation Pipeline
diataxis: Explanation
domain: security-privacy
topic: web-security
source: HackerNews
source_url: https://www.usenix.org/publications/loginonline/data-only-attacks-are-easier-you-think
date: 2026-09-23
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# Data-Only Attacks Are Easier Than You Think — The Einstein Exploitation Pipeline

Data-only attacks exploit a program's **data** rather than its control flow: the victim executes all of its intended code (benign functions, system calls), but with attacker-controlled arguments. They have been known since ~2005 ("Non-Control-Data Attacks Are Realistic Threats", USENIX Security) but were long dismissed as too application-specific and complex to be a practical threat. Johannesmeyer, Slowinska, Bos, and Giuffrida (VU Amsterdam VUSec) published **Einstein** at USENIX Security 2024 showing that assumption is wrong: data-only exploits can be generated automatically, at scale, by low-effort attackers.

## Why control-flow hijacking got hard — and why data-only fills the gap

About 70% of security bugs reported by Microsoft, Google, and Mozilla are memory-safety bugs (buffer overflows, use-after-free). The classic weaponization is **control-flow hijacking**: overwrite a code pointer so the program executes attacker code. Decades of defenses — DEP/NX, CFI, CPI — have made diverting control flow increasingly infeasible.

The data-only alternative: let the program run its own intended code path, but corrupt the *arguments* it passes to security-sensitive syscalls (`execve`, `write`, `sendmsg`). The benign and malicious executions are structurally identical; only the data differs.

**Classic example (web server CGI-BIN):** a memory-write bug lets an attacker overwrite the global `cgi_bin_path` from `/usr/local/server/cgi-bin` to `/bin`. A request `POST /sh` with body `touch /tmp/attacker-was-here` then makes the server itself call `execve("/bin/sh", ...)` — arbitrary code execution without a single byte of attacker code running.

## Why they were considered impractical (and why that was wrong)

1. **Application-specific** — building one requires deep knowledge of program semantics to find which data is security-critical and how to reach it.
2. **Complex** — prior automated approaches used heavyweight symbolic execution, simplifying assumptions, or manual gadget chaining; many even built Turing-complete machines inside the target.

Einstein's key insight: none of that is necessary. Four observations make the problem tractable with lightweight analysis:

- Target a **universal interface**: syscalls (any program talks to the kernel through them), not application semantics.
- **Turing completeness is unnecessary** — attackers want specific goals (`execve` for code execution, `write` for filesystem corruption).
- **No need to divert control flow** — programs invoke interesting syscalls on their own valid runtime paths.
- After initialization, many data are treated as **immutable**, so a corrupted value flows unchanged ("identity dataflow") all the way to the sensitive syscall — no constraint solving needed.

## How Einstein works

Einstein is an open-source exploitation pipeline (github.com/vusec/einstein) with two stages:

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "title",
      "type": "text",
      "x": 180,
      "y": 20,
      "width": 560,
      "height": 24,
      "text": "Einstein: data-only attack generation (two stages)",
      "fontSize": 18,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Einstein: data-only attack generation (two stages)",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 1,
      "version": 1,
      "versionNonce": 1,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 250,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 2,
      "version": 1,
      "versionNonce": 2,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t1",
      "type": "text",
      "x": 55,
      "y": 92,
      "width": 220,
      "height": 48,
      "text": "Instrument victim binary\n(dynamic taint analysis)\nstart after initialization",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Instrument victim binary\n(dynamic taint analysis)\nstart after initialization",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 3,
      "version": 1,
      "versionNonce": 3,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 350,
      "y": 80,
      "width": 250,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 4,
      "version": 1,
      "versionNonce": 4,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t2",
      "type": "text",
      "x": 365,
      "y": 92,
      "width": 220,
      "height": 48,
      "text": "Model arbitrary memory-write bug:\ntaint all corruptible data\n(unique color per datum)",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Model arbitrary memory-write bug:\ntaint all corruptible data\n(unique color per datum)",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 5,
      "version": 1,
      "versionNonce": 5,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 660,
      "y": 80,
      "width": 250,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 6,
      "version": 1,
      "versionNonce": 6,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t3",
      "type": "text",
      "x": 675,
      "y": 92,
      "width": 220,
      "height": 48,
      "text": "Run benign workload (test suite)\ntrack taint into security-sensitive\nsyscalls (execve, write, ...)",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Run benign workload (test suite)\ntrack taint into security-sensitive\nsyscalls (execve, write, ...)",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 7,
      "version": 1,
      "versionNonce": 7,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 350,
      "y": 220,
      "width": 250,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 8,
      "version": 1,
      "versionNonce": 8,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t4",
      "type": "text",
      "x": 365,
      "y": 232,
      "width": 220,
      "height": 48,
      "text": "Find identity dataflows:\nsyscall args copied verbatim from\ntainted data -> candidate exploits",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Find identity dataflows:\nsyscall args copied verbatim from\ntainted data -> candidate exploits",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 9,
      "version": 1,
      "versionNonce": 9,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b5",
      "type": "rectangle",
      "x": 40,
      "y": 220,
      "width": 250,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 10,
      "version": 1,
      "versionNonce": 10,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t5",
      "type": "text",
      "x": 55,
      "y": 232,
      "width": 220,
      "height": 48,
      "text": "Confirm: restart server, apply\n(addr,val) overwrite at bug point,\nreplay workload, verify effect",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Confirm: restart server, apply\n(addr,val) overwrite at bug point,\nreplay workload, verify effect",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 11,
      "version": 1,
      "versionNonce": 11,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "a1",
      "type": "arrow",
      "x": 290,
      "y": 115,
      "width": 60,
      "height": 0,
      "points": [[0, 0], [60, 0]],
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 12,
      "version": 1,
      "versionNonce": 12,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    },
    {
      "id": "a2",
      "type": "arrow",
      "x": 600,
      "y": 115,
      "width": 60,
      "height": 0,
      "points": [[0, 0], [60, 0]],
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 13,
      "version": 1,
      "versionNonce": 13,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    },
    {
      "id": "a3",
      "type": "arrow",
      "x": 475,
      "y": 150,
      "width": 0,
      "height": 70,
      "points": [[0, 0], [0, 70]],
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 14,
      "version": 1,
      "versionNonce": 14,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    },
    {
      "id": "a4",
      "type": "arrow",
      "x": 350,
      "y": 255,
      "width": 60,
      "height": 0,
      "points": [[0, 0], [-60, 0]],
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 15,
      "version": 1,
      "versionNonce": 15,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    },
    {
      "id": "note",
      "type": "text",
      "x": 660,
      "y": 235,
      "width": 240,
      "height": 48,
      "text": "Syscall chaining: state shared\nacross syscalls lets one safe call\nset up another (open + write)",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Syscall chaining: state shared\nacross syscalls lets one safe call\nset up another (open + write)",
      "autoResize": true,
      "strokeColor": "#862e9c",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 16,
      "version": 1,
      "versionNonce": 16,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    }
  ]
}
```

Stage 1 — **candidate generation**: instrument the victim binary with dynamic taint analysis; after initialization completes (all config loaded), model an arbitrary memory-write bug by uniquely tainting every datum it could corrupt. Drive the program with a benign workload (its own test suite) and track taint into security-sensitive syscalls. When a syscall argument is *identical* to tainted data — an **identity dataflow** — emit candidate `(address, value)` overwrite pairs. Einstein also tracks library state shared across syscalls, enabling **syscall chaining**: one safe call corrupts state that another safe call later consumes (e.g., `open` pathname + unrelated `write` fd/buf → filesystem corruption).

Stage 2 — **confirmation**: restart the server, apply the candidate overwrite at the bug point, replay an exploit workload (`POST /sh` with a shell command), and verify the effect (file created). This filters out candidates that are neutralized by runtime checks.

## Evaluation results

| Target | Tainted sensitive syscalls (% identity flow) | Code coverage |
| --- | --- | --- |
| httpd | 1834 (97%) | 27.3% |
| lighttpd | 92 (98%) | 27.8% |
| nginx | 1623 (82%) | 49.1% |
| postgres | 2105 (27%) | 46.5% |
| redis | 218 (84%) | 33.6% |

For **nginx**, Einstein produced **944 confirmed exploits**: 1 code-execution, 17 write-what-where, 375 write-what, 79 write-where, 41 send-what-where, 372 send-what, 59 send-where — at only 27–49% test-suite coverage. Two case-study exploits **bypass state-of-the-art mitigations** including syscall filtering and selective DFI:

- **Code-execution**: an `execve` whose pathname and argv come directly from a global variable → trivial arbitrary code execution by overwriting that one string.
- **Write-what-where via chaining**: corrupt the `openat` pathname of one request path and the fd/buf of an unrelated `write` call to corrupt server files.

## The mitigation dilemma

For control-flow hijacking, mitigations could be both *comprehensive* (cover the whole attack surface) and *practical* (cheap to deploy): DEP/CFI/CPI target a well-defined pointer-overwrite → indirect-branch chain. Data-only attacks break that symmetry — they can overwrite **any** data corrupting **any** operation:

| Defense class | Examples | Problem |
| --- | --- | --- |
| Comprehensive but impractical | Memory safety (Rust/Go rewrites), full DFI | Poor performance or onerous software/hardware changes |
| Practical but noncomprehensive | Memory error scanning, selective DFI, syscall filtering | Einstein generates exploits that trivially bypass them |

**Takeaway for vendors**: deploy comprehensive defenses where feasible; use Einstein itself to audit case-by-case which of your syscalls have identity dataflows from attacker-controllable state. The open research direction is making comprehensive defenses practical enough to adopt widely.

## Practical checklist (defenders)

- Audit global/config variables that flow verbatim into `execve`, `open*`, `write`, `sendmsg` arguments — these are the identity-dataflow targets.
- Treat "the program only executes its own code" as **not** a safety property: intended syscalls with corrupted arguments are the attack surface.
- Syscall filtering and selective DFI alone do not close this class; combine with memory-safety hardening of the components that hold security-critical state.

## References

- [USENIX ;login: Data-Only Attacks Are Easier than You Think](https://www.usenix.org/publications/loginonline/data-only-attacks-are-easier-you-think)
- [Practical Data-Only Attack Generation — USENIX Security 2024 paper](https://www.usenix.org/conference/usenixsecurity24/presentation/johannesmeyer)
- [Einstein tool (open source, VUSec)](https://github.com/vusec/einstein)
- [Paper PDF](https://download.vusec.net/papers/einstein_sec24.pdf)
