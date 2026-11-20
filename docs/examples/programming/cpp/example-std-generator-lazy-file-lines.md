---
title: Lazy File Line Iteration with std::generator (C++23 Coroutines)
diataxis: Example
domain: programming
topic: cpp
source: DEV.to Tech News
source_url: https://dev.to/fill1890/on-c-coroutines-40cd
date: 2026-11-20
keywords:
- knowledge-base
- cpp
- programming
- examples
---
# Lazy File Line Iteration with std::generator (C++23 Coroutines)

A compact, real-world use case for C++23 coroutines: replacing a hand-written iterator adapter (or a load-the-whole-file `std::vector<std::string>`) with a Python-style generator, in a constrained ESP32 firmware logging pipeline.

## The problem

Log events are appended to a file as one JSON object per line (single objects resist corruption better than a live JSON array); on rotation, each line must be deserialized and appended to a JSON array written to the "rotated" file. Constraints from the embedded context:

- File I/O goes through the C `FILE*` API (an RAII wrapper `file_t` exists) — `<iostream>` alone adds ~200 kB to the binary, so iostreams are avoided.
- Reading the whole file into memory is bad practice on a device — lines should be read **lazily**.
- A range interface is wanted so callers can write `for (auto& line : file.lines())` and compose with `std::views`.

Without coroutines the choices are: buffer everything in a vector, or write a full iterator adapter type (extra types, manual state, fiddly to satisfy range concepts).

## Coroutines in one paragraph

A coroutine is a function that can be **paused and resumed**: on `co_yield` it returns a value to the caller while **all local variables are saved**; the next resumption continues right after the yield. This is exactly Python's `yield`, and `std::generator` (C++23) packages it into an iterable range. (Approximating this with `static` locals fails: statics are global across invocations and don't reset.)

## Working example

```cpp
#include <generator>
#include <string_view>
#include <cstdio>

class file_t {
 public:
  file_t(std::filesystem::path path, const char* mode);

  std::generator<std::string_view> lines() {
    char line[4096];
    fseek(m_file, 0, SEEK_SET);
    while (fgets(line, sizeof(line), m_file)) {
      co_yield std::string_view{line};
    }
  }

 private:
  FILE* m_file;
};

int main() {
  file_t file{"art_of_war.txt", "r"};
  for (auto& line : file.lines()) {
    // parse line as JSON, append to output array...
  }
}
```

Compose with ranges as usual — e.g. filtering rotated logs from a directory:

```cpp
auto logs() const {
  return std::filesystem::directory_iterator(m_dir)
         | std::views::filter(
             [](auto& entry) { return entry.path().extension() == ".json"; });
}
```

## Caveats (from the author, plus the obvious ones)

- `fgets` stops at newline **or** buffer end: lines ≥ 4096 chars are silently split; errors and EOF are both signalled by `NULL` and are not distinguished here.
- `std::string_view` points into the **reused `line` buffer** — the view is only valid until the next iteration. Do not store views (or parse lazily after resumption); copy or fully parse before advancing.
- `co_yield` requires a generator promise type — `std::generator` provides it; hand-rolling `promise_type`/`initial_suspend`/`final_suspend` is what `std::generator` saves you.
- Requires a C++23 toolchain with `<generator>` support (GCC 12+/Clang 15+/MSVC 17.3+ roughly); on embedded targets check your libc++/libstdc++ availability.

## When to reach for this

Prefer `std::generator` over an iterator adapter when: iteration is linear, state is naturally expressed as local variables, and you want range composability without writing iterator concepts plumbing. The read-all-into-vector option remains fine when the working set is genuinely small — don't pay coroutine machinery cost for tiny files.

## References

- [Original post: On C++ — Coroutines (DEV.to)](https://dev.to/fill1890/on-c-coroutines-40cd)
- [std::generator reference (cppreference)](https://en.cppreference.com/cpp/coroutine/generator)
- Related KB: [Cpp-Concurrency-Fundamentals](../Cpp-Concurrency-Fundamentals/), [Cpp-Language-Features](../Cpp-Language-Features/)
