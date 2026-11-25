---
title: Why span() = default and span() {} Compile to Different Code — Triviality,
  Value-Initialization, and a GCC 15/16 Regression
diataxis: Explanation
domain: programming
topic: cpp
source: HackerNews
source_url: https://lemire.me/blog/2026/11/02/default-and-braces-are-not-the-same-constructor/
date: 2026-11-25
keywords:
- knowledge-base
- cpp
- programming
- explanations
---
# Why span() = default and span() {} Compile to Different Code — Triviality, Value-Initialization, and a GCC 15/16 Regression

`span() = default` and `span() {}` look like two spellings of "empty constructor." They are not the same constructor: one leaves the class **trivial**, the other makes it **non-trivial** (user-provided), and the difference changes what `span s;` vs `span s{}` *mean* — and, on some compilers, how fast loops over the type run.

Consider:

```cpp
struct span {
  const char *p;
  int len;
  const char *end;
  span() = default; // or span() {}
  span(const char *s, int n) : p(s), len(n), end(s + n) {}
};
```

## The semantic matrix

| Constructor | Declaration | What happens | Members |
|---|---|---|---|
| `span() = default` | `span s;` | nothing | uninitialized |
| `span() = default` | `span s{}` | the whole object is zeroed, **padding included**; the constructor does not run | zero |
| `span() {}` | `span s;` | the empty constructor is called; compiler can delete the call | uninitialized |
| `span() {}` | `span s{}` | the empty constructor is called; **the object is not zeroed** | uninitialized |

Two traps hide here:

1. With a trivial default constructor, `s{}` triggers **value-initialization**, which for a trivial class means zero-initializing the entire object — a guarantee a user-provided `{}` body silently drops. If you converted `= default` to `{}` "for symmetry", `Foo{}` stopped meaning "all zeros."
2. Triviality is not just a perf hint: it gates `memcpy`-ability, `is_trivially_copyable` overloads, and various API contracts (`std::span`-style view types are meant to be trivial).

## The measured cost: a 4.6× GCC regression path

Lemire wraps the span in a `box` whose default constructor value-initializes the span (`box() : s() {}`), then loops assigning either a fresh `box()` or a filled `box(span(s, i+1))`, passing each to `consume(box&)`. Compiled with `-O2 -march=x86-64`, best of five runs, 100M spans, Xeon Gold 6548N:

| compiler | `span() = default` | `span() {}` |
|---|---|---|
| GCC 14.3 | 1.73 ns/span | 1.74 ns/span |
| GCC 15.2 | **7.75 ns/span** | 1.73 ns/span |
| GCC 16.2 | **8.04 ns/span** | 1.73 ns/span |
| clang 21 | 1.75 ns/span | 1.74 ns/span |

With the braces constructor, GCC writes the three fields directly into the slot `consume` expects. With `= default`, GCC 15/16 store `end` directly but route `p` and `len` through a **stack temporary**, then copy the first 16 bytes back (`movdqa`/`movaps`) before the call:

```asm
movdqa  xmm0, XMMWORD PTR [rsp+32]
movaps  XMMWORD PTR [rsp], xmm0
call    consume(box&)
```

The trivial-type path gives the optimizer *more* freedom in theory (no constructor body to respect) — GCC 15/16 turn that freedom into a pessimization on this shape. clang 21 and GCC 14 are insensitive to the choice.

## Practical guidance

- Prefer `= default` when you want a trivial default constructor (views, POD-ish carriers) — but **measure on your compiler versions**, because a codegen regression can invert the expectation.
- Do not casually replace `= default` with `{}`: you lose triviality *and* the zero-initialization guarantee of `T{}`.
- If you need "trivial type, zero-init when I ask," that is exactly `= default` + `{}` at the call site — the table's row 2 is what you want, not a hand-written empty body.
- When a hot loop regresses after a compiler upgrade, diff the assembly of the temporary-materialization around by-value parameter construction; the temporary-plus-copy-back pattern above is the tell.

## References

- [In C++, = default and {} are not the same constructor — Daniel Lemire](https://lemire.me/blog/2026/11/02/default-and-braces-are-not-the-same-constructor/)
- [Benchmark source code](https://github.com/lemire/Code-used-on-Daniel-Lemire-s-blog/tree/master/2026/10/cppinit)
