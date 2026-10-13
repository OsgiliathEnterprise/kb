---
title: 'A Modern Web App in C: CGI, OpenBSD httpd, and SQLite in 2026'
diataxis: Explanation
domain: programming
topic: c
source: HackerNews
source_url: https://prophitt.me/writing/a-modern-web-app-in-c
date: 2026-10-13
keywords:
- knowledge-base
- c
- programming
- explanations
---
# A Modern Web App in C: CGI, OpenBSD httpd, and SQLite in 2026

## Overview

Corey Prophitt shipped a commercial web product — [marketyour.games](https://marketyour.games/) — using the technology that dynamic websites ran on in 1994: a C program dropped in a `cgi-bin` directory, forked per request. The product is modern in everything except its serving model: user accounts, a search dashboard for content creators, folders, payments via Stripe, transactional emails via Postmark, progressive enhancement with no JavaScript required. The stack is [BCHS](https://learnbchs.org/): **O**penBSD, **C**, **H**ttpd, **S**QLite — one statically linked binary, one SQLite file, three libraries, and the whole application fits in your head.

The central claim: **CGI's decline was justified in 2004 but doesn't hold up in 2026.**

## The Stack, Component by Component

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 220,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Client\nprogressive enhancement\nno JS required", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 320,
      "y": 160,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "OpenBSD httpd (chroot)\nroutes ALL traffic to CGI\nsandbox: pledge + unveil", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 620,
      "y": 160,
      "width": 260,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "One static binary (per request)\nassets compiled in, served from memory\nlibcurl (Stripe/Postmark)\nlibsodium (HMAC, hashing, ids)\nlibcjson (single-file JSON)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 620,
      "y": 320,
      "width": 260,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#b8e6b8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "SQLite file (C API)\nno server process\nvendored amalgamation build", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 260,
        "y": 210,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 560,
        "y": 210,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 750,
        "y": 260,
        "width": 0,
        "height": 60,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [0, 60] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

- **No framework.** A C program reads CGI environment variables and responds. The CGI 1.1 spec (2004) hasn't changed; the entire interface is request headers, methods, query strings, body data.
- **No templating language.** C outputs HTML directly.
- **No database server.** SQLite opened through the C API (official single-file amalgamation, vendored into the project).
- **No container.** A statically linked binary dropped in a folder.
- **All traffic routed to the CGI binary** — static assets are compiled into the executable and served from memory, bypassing the traditional static-file path entirely.
- **Three libraries:** libcurl (outbound Stripe/Postmark requests), libsodium (random identifiers, password hashing, HMAC verification for Stripe webhooks), libcjson (JSON parsing — a single C file, no dependencies). Only libcurl and libsodium are build dependencies; SQLite and cjson are vendored. A clean build takes seconds; rebuilds under half a second.
- **Sandboxing from the OS.** OpenBSD's httpd serves from a chroot by default, so the CGI binary runs sandboxed to its own corner of the filesystem; `pledge` and `unveil` let the C program restrict its own capabilities.

## Why CGI in 2026

**Process forking is cheap now.** The fork cost that made CGI unattractive in the 2000s has been optimized away by modern kernels. And if it ever becomes an issue, FastCGI is a simple upgrade path.

**Deployment is replacing one file.** Every request spawns a fresh process, so deploying a new version means replacing the binary — no server restart, no downtime; new requests pick up the new binary immediately.

**CGI is serverless minus the vendor.** A supervisor invokes your code per request, hands it a bag of environment variables, collects the result — the same shape as serverless, without the vendor (and the surprise bills).

**Single web server, clear separation.** The typical modern topology (nginx reverse-proxying to an app server in another language) means two web servers where one also owns your business logic. CGI is one web server calling business logic directly. It's also easier to debug: the application is an ordinary program you can pipe a request into, watch stderr, and step through with gdb.

**Minimal supply chain.** Against the backdrop of weekly package-repository attacks and autonomous agents managing dependencies, the supply chain here is a C compiler and three well-watched libraries. Compromising it means compromising libcurl — "a project the entire internet watches," not a package with eleven weekly downloads and an owner who left in 2019.

**Tooling that fits in a plain editor.** No LSP, no language server, no plugin dance: classic Vim with zero plugins over a directory of C files and a Makefile. When deeper tooling is wanted, sanitizers, valgrind, gdb, ctags, cscope are a package install away and integrate natively with editors (Vim ships ctags/cscope support and a graphical gdb frontend via `:h Termdebug`).

## What Was Liked

- **Writing HTML/CSS in C is less painful than expected.** The author's prior pain was fighting editors to half-detect mixed template syntax (Go's `html/template` in Vim, jinja/askama in rustrover). With C there is no second language for the editor to detect — "it isn't pretty, but neither is Tailwind."
- **SQLite is a breath of fresh air** versus the default Postgres: no process to babysit, no configuration, no upgrade releases.
- **Fundamentals over frameworks** — if you understand HTTP, you already understand CGI; the knowledge is language- and platform-agnostic and "good forever."

## What Would Be Changed

CGI gives you almost nothing out of the box, so you roll your own utilities for cookie parsing/creation, query-parameter parsing/validation, form-data parsing/validation, and escaping input for display. The author rolled all of it into a single header (`cgi.h`) but isn't convinced that's the right solution — libraries like [kCGI](https://kristaps.bsd.lv/kcgi/) exist, but adopting one means buying into its API and security model. The stated wish: **a set of drop-in shared utilities for CGI (like the stb libraries for graphics)**; the author may publish `cgi.h` as a start.

## The Trade-off Summary

| Dimension | CGI/C/SQLite (this stack) | Modern framework stack |
| --- | --- | --- |
| Moving parts | 1 binary + 1 file + 3 libs | runtime + app server + DB server + package tree |
| Deploy | replace one file, zero downtime | restart/reload pipeline |
| Sandbox | OS-level (chroot, pledge, unveil) | depends on container config |
| Supply chain | compiler + 3 watched libs | hundreds of indirect deps |
| Tooling | plain editor + mature debug tools | LSP + language-specific plugins |
| Per-request cost | process fork (cheap on modern kernels) | in-process (cheaper, but shared-state surface) |
| Escalation path | FastCGI if fork cost ever matters | — |

## Open Questions

- **The missing middle layer.** If `cgi.h`-style single-header utilities never coalesce into a standard drop-in set, every C/CGI project keeps reinventing cookie/form/escaping plumbing — the main real cost of the stack.
- **Concurrency ceiling.** Per-request processes are cheap, but high-concurrency workloads (thousands of RPS) are where the fork model's constant overhead (process creation, SQLite file open per request) would show; FastCGI or a shared-process variant is the stated answer, at the cost of the "replace one file" deployment story.
- **Portability.** The sandboxing argument leans heavily on OpenBSD (pledge/unveil/chroot-by-default). Replicating equivalent guarantees on Linux (seccomp, namespaces) is possible but not as turnkey.

## References

- [A modern web app in C — Corey Prophitt (prophitt.me)](https://prophitt.me/writing/a-modern-web-app-in-c)
- [BCHS stack (OpenBSD, C, httpd, SQLite) — learnbchs.org](https://learnbchs.org/)
- [kCGI — CGI library for C (Kristaps Džers)](https://kristaps.bsd.lv/kcgi/)
- [marketyour.games — the shipped product](https://marketyour.games/)
- [Introducing OpenBSD's new httpd — Reyk Floeter (AsiaBSDCon 2015)](https://www.openbsd.org/papers/httpd-asiabsdcon2015.pdf) — history/design of httpd(8): from Apache 1.3.29 fork → nginx → relayd-derived server; static files, FastCGI, LibreSSL TLS, "httpd is web scale"
