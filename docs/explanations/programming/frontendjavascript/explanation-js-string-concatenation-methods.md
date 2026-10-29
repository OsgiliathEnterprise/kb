---
title: 'JavaScript String Concatenation: `+` vs Template Literals vs `.join()`'
diataxis: Explanation
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/kandz/javascript-string-concatenation-vs-template-literals-vs-join-47kg
date: 2026-10-29
keywords:
- knowledge-base
- frontend-javascript
- programming
- explanations
---
# JavaScript String Concatenation: `+` vs Template Literals vs `.join()`

The "best" way to concatenate strings in JavaScript depends on what you're doing, but for modern JavaScript **template literals** are usually the cleanest and most readable option.

## The three main methods

| Method | Syntax | Best for |
|---|---|---|
| Template literals (ES6+) | backticks + `${}` interpolation | Default choice — readable, multi-line, no quote escaping |
| `+` operator | classic `a + b` | simple single-line combinations |
| `Array.prototype.join()` | `arr.join(separator)` | large lists / building strings in loops |

### 1. Template literals (ES6+)

Use backticks and `${}` to embed variables directly into a string:

```js
const firstName = "Alice";
const lastName = "Smith";
const greeting = `Hello, ${firstName} ${lastName}!`;
```

This is generally the best approach: it's readable, avoids messy quote escaping, and allows multi-line strings without special characters.

### 2. The `+` operator

The classic way. It works fine for simple combinations but gets messy fast:

```js
const greeting = "Hello, " + firstName + " " + lastName + "!";
```

With lots of variables, or when mixing single and double quotes, it becomes hard to read.

### 3. Array `.join()`

Best for concatenating a large list of items or when building strings in a loop:

```js
const words = ["Hello", firstName, lastName];
const greeting = words.join(" ") + "!";
```

Highly performant for large datasets because you aren't creating a new string in memory with every single concatenation operation.

## Performance: old browsers vs modern engines

- **Old browsers**: `+` was slow for large loops because strings are immutable — every concatenation creates a new string in memory. `Array.prototype.join()` was the standard performance fix.
- **Modern engines**: engines like V8 (Chrome, Node.js) optimize `+` using **ropes** — a data structure that defers string copying. In most modern environments, template literals and `+` are fast enough for everyday use.

## When to use which

- **Template literals**: default choice for ~99% of cases.
- **`+` operator**: simple, single-line combinations.
- **`.join()`:** huge loops or building strings from arrays.

## Converting legacy code

If you're modernizing a codebase, converting old `+` concatenations to template literals makes the code much easier to read — but doing it by hand for hundreds of lines is error-prone (it's easy to miss a backtick or a dollar sign).

The article's author built a free **JS String Concatenation Utility** that converts standard string concatenation into ES6 template literals (or vice versa), 100% client-side with nothing uploaded: [tools.kandz.me/js-string-concatenation](https://tools.kandz.me/js-string-concatenation)

## Engine internals (why modern `+` is fast)

The performance claims in the source article deserve context from how V8 actually stores strings:

- V8 represents strings as byte sequences in one of three encodings — **SBO** (8-bit, Latin-1), **URO** (16-bit, UCS-2), and **HBO** (32-bit, full UTF-32). A concatenation of two SBO strings that still fits in 8-bit stays SBO; the moment a character needs more bits, the result is re-encoded (or a *rope* node is kept and re-encoded lazily later).
- Repeated `+` builds a **rope** (a tree of `ConcatenatedString` nodes) rather than copying characters on every step, so the cost of a long `+` chain is deferred until the string is actually consumed (e.g., by a `length` read or a print). That is why the "join is always faster than +" microbenchmarks from the pre-2010 era mostly don't hold on current V8.
- **Template literals** are compiled to the same internal string-building machinery; the difference between `` `a${b}` `` and `'a' + b` at the engine level is negligible in any realistic workload.

Practical guidance (unchanged): prefer **template literals** for readability and interpolation; use **`join()`** when you are assembling from an array; don't micro-optimize `+` vs `join` — measure your own hot path if it matters.

## References

- [JavaScript String Concatenation: + vs Template Literals vs .join() (DEV.to)](https://dev.to/kandz/javascript-string-concatenation-vs-template-literals-vs-join-47kg)
- [MDN: Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
- [MDN: Array.prototype.join()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join)
