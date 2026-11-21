---
title: 'gopgext: Building PostgreSQL Extensions in Go with TinyGo'
diataxis: Explanation
domain: programming
topic: databases
source: HackerNews
source_url: https://jespino.github.io/gopgext/
date: 2026-11-22
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# gopgext: Building PostgreSQL Extensions in Go with TinyGo

**gopgext** builds PostgreSQL extensions from plain Go code using **TinyGo**. The core idea: mark a Go function with a `//gopgext:function` comment and it becomes a SQL function — gopgext generates the **C glue, the install script, and the `.control` file** for you. It is explicitly **experimental**: a bug in the generated code or the Go runtime runs *inside the server process*, where it can crash PostgreSQL or corrupt data, and the API may change without notice.

## The minimal extension

```go
package main

import (
    "strings"
    "gopgext/pg"
)

// Hello returns a greeting for name.
//
//gopgext:function immutable parallel=safe
func Hello(name string) string {
    return "Hello, " + name + "!"
}

// Shout upper-cases s. An empty string raises an error.
//
//gopgext:function immutable parallel=safe
func Shout(s string) (string, error) {
    if s == "" {
        return "", pg.Errorf(pg.CodeInvalidParameterValue, "nothing to shout")
    }
    return strings.ToUpper(s) + "!", nil
}

func main() {} // runs once per backend, when PostgreSQL loads the library
```

Build and install — `gopgext` writes `hello.so`, `hello.control`, and `hello--1.0.sql` and installs them via **PGXS**:

```bash
gopgext init hello       # creates hello/go.mod and hello/main.go
gopgext install hello    # builds + installs .so, .control, .sql
psql -c 'CREATE EXTENSION hello' -c "SELECT hello('world')"
#     hello
# ---------------
#  Hello, world!
```

## What the platform actually covers

This is not a toy "wrap one scalar function" FFI — the surface area maps most of PostgreSQL's extension API onto Go:

- **Standard library works**: `fmt`, `regexp`, `encoding/json`, `crypto/*`, maps, generics, iterators, `defer`/`recover`.
- **Type mapping to SQL**: strings, numbers, arrays, `NULL`s, sets, rows, timestamps, UUIDs, JSON; user-defined data types and composite types are declared in Go.
- **Server facilities**: run SQL through **SPI**, return errors with **SQLSTATE codes** (`pg.Errorf(pg.CodeInvalidParameterValue, ...)`), log, read GUC settings, stay responsive to query cancellation.
- **Beyond scalar functions**: triggers, aggregates, **GiST / GIN / SP-GiST / BRIN operator classes**, index access methods, foreign data wrappers, and query hooks.
- **Proven on contrib**: ports of real contrib modules — `pgcrypto`, `hstore`, `pg_stat_statements`, `cube` — pass upstream's regression tests.
- **Safe coexistence**: several Go extensions can load in one backend; **PostgreSQL errors never unwind through Go frames**, and results are copied into PostgreSQL-managed memory (not Go heap pointers leaking into the executor).

## Architecture: the gokm pattern applied to PostgreSQL

gopgext reuses the design of its sibling project **gokm** (Linux kernel modules in Go):

1. A **custom TinyGo target and runtime layer** for the host (here: PostgreSQL instead of the kernel).
2. A **C runtime compiled by the host's own build system** — **PGXS** for PostgreSQL, kbuild for the kernel.
3. **Generated glue** between host C calling conventions and Go functions.

TinyGo (not full Go) is the key constraint that makes this tractable: a small AOT-compiled runtime can live inside a server process without the full Go runtime's scheduler/GC assumptions. The flip side is the stated warning — a Go-side panic or runtime bug lands inside the backend process, hence "don't use in production."

## Why this matters

PostgreSQL extensions have historically been a C-only club (or PL/extension languages with narrower power). gopgext shows the Go ecosystem — including `crypto/*` for crypto-type extensions like a Go-written `pgcrypto` — can reach the full extension API through code generation plus a trimmed runtime, and its contrib ports passing upstream regression tests is the strongest signal of coverage. The PGXS-kernel-module symmetry (one codegen pipeline, two hostile C hosts) is the transferable architectural insight.

## References

- [gopgext project site](https://jespino.github.io/gopgext/)
- [gopgext tutorial](https://jespino.github.io/gopgext/docs/tutorial/)
- [gopgext on GitHub](https://github.com/jespino/gopgext)
- [gokm — the sibling project for Linux kernel modules in Go](https://jespino.github.io/gokm/)
