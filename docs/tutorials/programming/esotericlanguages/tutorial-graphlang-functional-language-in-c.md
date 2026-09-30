---
title: graphLang — Building a Functional Language in C From a Binary Tree Assignment
diataxis: Tutorial
domain: programming
topic: esoteric-languages
source: HackerNews
source_url: https://hereticpleb.vercel.app/blog/needed-one-plus-one/
date: 2026-09-30
keywords:
- knowledge-base
- esoteric-languages
- programming
- tutorials
---
# graphLang — Building a Functional Language in C From a Binary Tree Assignment

A data structures assignment ("evaluate `1+1+1` to 3 using a binary tree")
snowballed into **graphLang**: a functional language implemented in C with
closures, a garbage collector, a custom memory allocator, a REPL, and an FFI.
The post walks the design decisions step by step — useful as a compact tour of
what a graph-reduction evaluator actually needs.

## Step 1: collapse the expression algebra

Naive approach: every operation is its own case in the expression type.

```text
Expr ::= Add Expr Expr | Sub Expr Expr | Mul Expr Expr | Div Expr Expr | Val
```

But all four operators have the same shape — `Expr x Expr -> Expr` — so the
evaluator doesn't need to know *what* a function does, only how to apply one:

```text
Expr ::= Func Expr Expr | Var | Val
```

This is the key reframe of the whole project: **functions are values**, and the
evaluator becomes a generic graph reducer.

## Step 2: nodes as tagged unions in C

```c
typedef enum { LITERAL, VAR, FUNC } NodeType;

struct Node {
    struct Node *left;
    struct Node *right;
    union { int literal; char *var; char *func; } data;
    NodeType type;
};
```

Memory math that motivated the custom allocator: on a 64-bit system each node
is 32 bytes (two pointers + 8-byte union + 4-byte tag + 4 padding), and
`malloc()` adds ~16 bytes of metadata → **48 bytes per node**. Evaluating `1+1`
needs 3 nodes = 144 bytes. For a language that allocates constantly, that's
unacceptable overhead — hence the arena allocator:

```c
#define SIZE 1024
Node arena[SIZE];
int top = 0;

Node *allocNode() { return &arena[top++]; }
```

One big chunk up front, bump-pointer allocation, free the whole block at the
end. (Later upgraded to a **chunk allocator** — multiple chunks as the arena
fills.)

## Step 3: one environment for vars and functions

Variables are hash-table lookups that return an `Expr` — C has no built-in hash
table, so one is implemented (the post follows Ben Hoyt's "How to implement a
hash table in C"). The upgrade that makes it functional: **store vars and
functions in the same environment**, mapping names to nodes.

```c
typedef struct EnvEntry {
    char *key;
    Node *val;          // val is a Node — functions are values too
    struct EnvEntry *next;
} EnvEntry;
```

### Closures as graph nodes, not function pointers

The naive move — store user functions as C function pointers — breaks the
moment a function returns another function: a C pointer is opaque to the
evaluator and can't be walked or re-evaluated. The fix is to make a closure an
**actual node in the graph**: parameter on one side, body tree on the other.

```text
         (closure)
         /        \
   (parameter)    (body)
                 /      \
              (math)  (literal)
```

Users can now define functions without touching C code; the evaluator applies
them step by step over multiple steps.

## Step 4: mark-and-sweep garbage collection

The graph evaluator mutates nodes in place after evaluation, so old subgraphs
accumulate — `fib(40)` was leaking toward **12 GB** of RAM. The fix is a
stop-the-world mark-and-sweep collector over the chunk allocator:

1. **Mark phase**: start from roots (the environment table), walk every
   reachable node and mark it.
2. **Sweep**: scan chunks; unmarked nodes go onto a `freeList` linked list.
3. **Reuse**: new allocations pop from `freeList` first; only when empty does
   the allocator take a fresh node from the current chunk.

Result: `fib(40)` RAM drops from ~12 GB to **~1.7 MB**. The remaining problem
is time — `fib(40)` still takes 6 minutes because the algorithm is inherently
exponential (and the collector is stop-the-world). Planned follow-ups: TCO and
better evaluation strategy, a lexer/parser, FFI, REPL, Cheney's copying
collector.

## What this achieves in part one

- Expression type as an algebraic data type; variants are *kinds of data*
  (funcs, vars, literals), not operations.
- Vars and functions unified: both are just data in one environment table.
- Graph evaluator that mutates the current node after eval (graph reduction).
- Environment table via custom hash table; chunk allocator for nodes.
- Mark-and-sweep GC with a free list recycling unmarked nodes.

## Key takeaways

- The "functions as values" reframe (`Func Expr Expr`) is what turns an
  expression evaluator into a functional language — everything else (env,
  closures) follows from it.
- Closures must be *data the evaluator can walk*, not opaque native pointers;
  representing them as nodes (param + body tree) is the minimal working model.
- Bump-pointer arenas kill per-allocation metadata overhead; a free list over
  swept chunks turns GC into node recycling rather than fresh allocation.
- Memory and time are separate problems: mark-and-sweep fixed the leak but not
  the exponential evaluation — TCO/memoization is the next lever.

## References

- [Needed 1+1, built a functional programming language (full post)](https://hereticpleb.vercel.app/blog/needed-one-plus-one/)
- [graphLang repository](https://github.com/PranavDesai-Git/graphLang)
- [How to implement a hash table in C — Ben Hoyt](https://benhoyt.com/writings/hash-table-in-c/)
