---
title: 'Zig: Pointer Stability for ArrayLists (lockPointers / unlockPointers)'
diataxis: Example
domain: programming
topic: zig
source: HackerNews
source_url: https://ziglang.org/devlog/2026/#2026-08-27
date: 2026-08-31
keywords:
- knowledge-base
- zig
- programming
- examples
---
# Zig: Pointer Stability for ArrayLists (lockPointers / unlockPointers)

Zig's `std` Hash Map containers gained **pointer stability locks** in 2024. A pull request initially opened by Leo Emar-Kar in 2025 extends the same memory-safety technique to `std.ArrayList`. The idea: when you store a pointer (or slice) that is *backed by* an ArrayList's internal buffer, you can lock it so any later reallocation that would invalidate those pointers **panics loudly instead of silently corrupting memory**.

## How to use it

Call `lockPointers()` the first time you store a pointer/slice backed by the list, and `unlockPointers()` when those pointers are no longer needed:

```zig
try ctx.parse(gpa, input);
ctx.history.lockPointers();
defer ctx.history.unlockPointers();
try ctx.parse(gpa, input_two);   // safe: growth of history now asserts instead of dangling
```

The relationship that makes this dangerous — and what the lock protects:

![Diagram 1 — example-zig-arraylist-pointer-stability-locks](example-zig-arraylist-pointer-stability-locks-excalidraw-1.svg)

## The bug it catches (spot-the-bug)

Two ArrayLists where one stores slices into the other's buffer:

```zig
const std = @import("std");

const Context = struct {
    history: std.ArrayList(u8),
    lines:   std.ArrayList([]const u8),

    fn parse(ctx: *Context, allocator: std.mem.Allocator, input: []const u8) !void {
        const slice = try ctx.history.addManyAsSlice(allocator, input.len);
        @memcpy(slice, input);
        var it = std.mem.tokenizeScalar(u8, slice, '\n');
        while (it.next()) |line| {
            try ctx.lines.append(allocator, line);   // stores a pointer into history.items
        }
    }
};
```

`ctx.lines.items` holds slices that point *into* `ctx.history.items`. If `history` later grows past its capacity, the buffer is reallocated and every stored slice dangles. Without locking, this is silent corruption (or a segfault). With `zig test`, the unfixed version fails with mangled output:

```
expected: I'm first!
found:    UUUUUUUUUU   // stale pointer into moved buffer
1/1 blah.test.Context.parse...FAIL (TestExpectedEqual)
```

Adding the lock turns it into an immediate, debuggable panic:

```
thread 3023222 panic: reached unreachable code
lib/std/debug.zig:442: assertUnlocked -> self.pointer_stability.assertUnlocked()
lib/std/array_list.zig:1348: ensureTotalCapacityPrecise
```

## Why it matters

- **Fail-fast over fail-silent:** a reallocation that would invalidate escaped pointers now asserts at the exact call site, with a stack trace pointing at `ensureTotalCapacityPrecise`.
- **Allocator-dependent bugs become deterministic:** how a dangling-pointer bug manifests depends on your allocator; locking removes that ambiguity by making the invariant explicit.
- **Opt-in and scoped:** you only pay for the check while pointers are live (`lockPointers`/`unlockPointers` bracket), so hot loops without escaping slices stay unaffected.

## Takeaway

Whenever a Zig `ArrayList`'s buffer is exposed through stored pointers/slices, wrap that lifetime in `lockPointers()` / `defer unlockPointers()`. It converts a class of hard-to-debug memory-safety bugs into an immediate assertion — the same guarantee the Hash Map containers have had since 2024.

## References

- [Zig Devlog: Pointer Stability for ArrayLists (2026-08-27)](https://ziglang.org/devlog/2026/#2026-08-27)
