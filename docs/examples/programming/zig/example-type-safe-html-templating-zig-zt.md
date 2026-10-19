---
title: Type-Safe HTML Templating in Zig with zt (Templ-style, Compiled at Build Time)
diataxis: Example
domain: programming
topic: zig
source: HackerNews
source_url: https://lalinsky.com/2026/10/11/type-safe-html-templating-in-zig.html
date: 2026-10-12
keywords:
- knowledge-base
- zig
- programming
- examples
---
# Type-Safe HTML Templating in Zig with zt (Templ-style, Compiled at Build Time)

Working example from the `zt` project (an adaptation of Go's [Templ](https://templ.guide/) to Zig): templates are **parsed and transpiled to Zig code during `zig build`**, so they can be imported directly from app code — and, as importantly, *can import app code*, making every template parameter fully typed. The generated code is a plain sequence of writes to a `std.Io.Writer`: no allocations, no intermediate state.

Design goals the author set for a Zig templating library:

1. **Type-safe**: all inputs checked at compile time; no runtime template errors.
2. **Fast**: zero allocations; write output straight to a writer (socket or buffer).
3. **Safe defaults**: all dynamic values HTML-escaped by default (text and attributes); URL attributes (`href`, `src`) checked for dangerous schemes; raw output requires the explicit `{!value}` marker.
4. **Reads like HTML**, not a DSL to fight.

## Template definition (`.zt` file)

```zig
const User = @import("../models.zig").User;

pub templ Layout(title: []const u8) {
    <!DOCTYPE html>
    <html>
        <head>
            <title>{title}</title>
        </head>
        <body>
            @children
        </body>
    </html>
}

pub templ HomePage(user: ?User) {
    @Layout("Home") {
        if (user) |u| {
            <h1>Welcome back, {u.name}!</h1>
            <a href="/users/{u.id}">Your profile</a>
        } else {
            <h1>Welcome, guest!</h1>
            <a href="/login">Log in</a>
        }
    }
}
```

Notes:

- `@children` builds layouts that wrap other templates (the Zig equivalent of template inheritance); layouts are passable values.
- Control flow is plain Zig — `if`, `for`, `switch`, including payload captures. A line starting with `if`/`for`/`switch` is parsed as code (following Templ), so prose like "if you forgot your password…" on its own line is a parse error; the author is considering `@if`/`@for`/`@switch` to remove the ambiguity (open GitHub issue).
- The parser requires all elements to be properly closed, so broken markup is impossible.

## Calling from Zig code

```zig
const std = @import("std");
const User = @import("models.zig").User;
const pages = @import("templates/pages.zig");

pub fn main(init: std.process.Init) !void {
    var buf: [4096]u8 = undefined;
    var stdout = std.Io.File.stdout().writer(init.io, &buf);
    const w = &stdout.interface;

    const user: User = .{ .id = 1, .name = "Lukas" };
    try pages.HomePage.render(.{user}, w);
    try w.flush();
}
```

Inside the author's HTTP framework **Dusty**, the same page renders with one call: `try res.render(.html, pages.HomePage, .{user});` (that wrapper also sidesteps a non-obvious `std.Io` cancellation/error-handling bug in the hand-rolled `main` above).

## What compile-time safety looks like

Typo in a template → ordinary Zig compiler error, with a comment mapping back to the original template line:

```
src/templates/pages.zig:45:43: error: no field named 'nmae' in struct 'models.User'
                try zt.writeEscaped(writer, u.nmae); // pages.zt:18:31
```

Type mismatch on the calling side (passing `[]const u8` where `?User` is expected) also fails to compile. Template errors and API errors are the same kind of error: a `zig build` failure.

## Ecosystem context

- Built on top of the author's **zio** (IO) and **Dusty** (HTTP) libraries; the TODO example in Dusty is an htmx-based SPA showcasing `zt` plus the rest of Dusty.
- Inspired by **Ziex** (JSX-style templates in Zig, WASM-targeted) and **Templ** (Go).
- Pair with **htmx** or **Datastar** for client-side behavior without JavaScript/TypeScript.
- Project is young and already used in the wild; issues welcome (Zig Discord / GitHub `lalinsky/zt`).

## References

- [Type-safe HTML templating in Zig (Lukáš Lalinský)](https://lalinsky.com/2026/10/11/type-safe-html-templating-in-zig.html)
- [zt on GitHub](https://github.com/lalinsky/zt)
- [Dusty HTTP framework (TODO example)](https://github.com/lalinsky/dusty/tree/main/examples/todo)
- [Templ (Go)](https://templ.guide/)
- [Ziex (Zig)](https://ziex.dev/)

## Further Reading (added 2026-10-19 by KB Zookeeper audit)

- [Zig gains a compile‑time type‑safe HTML templating library](https://bitroot.org/blog/2026-10-12-zig-gains-a-compiletime-typesafe-html-templating-l/) — Lukáš Lalinský introduced zt, a Zig library that transpiles HTML templates to Zig code at build time, giving compile‑time safety and zero‑allocation rendering.
- [Type-safe HTML templating in Zig | Remix Hacker News](https://news.mcan.sh/item/50051573) — But one of Zig's main selling points is no hidden control flow and they want to keep it that way. christophilus 16 hours ago LLMs are decent at building LSPs…
- [Type-safe HTML templating in Zig](https://www.headlinne.com/articles/type-safe-html-templating-in-zig-hacker-news) — AI Summary A developer shares their experience building a type-safe HTML templating library called 'zt' for the Zig programming language.
