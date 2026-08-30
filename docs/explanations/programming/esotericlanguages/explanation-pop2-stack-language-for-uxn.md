---
title: POP-2 — An ALGOL-Like Language with a Deeply Concatenative Stack Evaluation
diataxis: Explanation
domain: programming
topic: esoteric-languages
source: HackerNews
source_url: https://wiki.xxiivv.com/site/pop2.html
date: 2026-08-30
keywords:
- knowledge-base
- esoteric-languages
- programming
- explanations
---
# POP-2 — An ALGOL-Like Language with a Deeply Concatenative Stack Evaluation

POP-2 (historically the language of Cambridge's LISP machine) is described on the XXIIVV wiki as "a few feral cats in an ALGOL trenchcoat": its **syntax** looks ALGOL/Pascal-like, but its **evaluation scheme is deeply concatenative** — everything runs on an explicit operand stack.

## Syntax vs evaluation

```
foo := 123;      (In Pascal)
123 -> foo;      (In POP-2)
```

The assignment can even be split into two statements, because values live on the stack:

```
123;     ; push value onto stack
-> foo;  ; consume it and store in variable
```

## Core constructs

**Functions** are declared ALGOL-style but return by *leaving values on the stack*:

```
function sum x y;
	x + y;
end

sum(5,6) * 2;
```

A function returning multiple values merely leaves them for the next consumer.

**Conditionals push results instead of assigning:**

```
vars x; 4 -> x;

if x > 4
	then 1;
elseif x = 4
	then 2;
else
	3;
close
```

leaves `2` on the stack (since `x = 4`).

**Recursion** works because arguments stay on the stack:

```
function factRec n;
	if n = 0
		then 1;
	else
		n * factRec(n-1);
	close
end

factRec(5);
```

**Loops are plain GOTOs** — no iterators:

```
vars i;
loop:
	if i < 10
		then i + 1 -> i, goto loop;
	close
i;   ; leaves 10 on the stack
```

**I/O** uses the big arrow to a port number (host system here is Varvara; console ports `0x17`/`0x23`):

```
0x48 => 23;    ; outputs "H"
```

**Arrays**: variables can hold N byte cells; `#var` gives the absolute pointer, `{expr}` loads a value at a computed address:

```
vars array:10 i; 2 -> i;
0x48 -> (#array+i);   ; store short into cells 3-4
{array+i} => 23;      ; load and send to console port
```

Putting it together — a string printer:

```
function putChar c;
	c => 23;
end

function printString s;
	vars c:1 i; 0 -> i;
loop:
	{s+i} >> 8 -> c;
	if c
		then putChar(c), i + 1 -> i, goto loop
	close
end

printString("Hello World!\n");
```

## Implementation facts

- Compiles easily for the **Uxn** VM; an entire compiler is **&lt; 800 lines and fits in ~2.5 KB** of memory — a good target for learning stack-machine compilation.
- `comment ... ;` blocks text until the terminating semicolon (multi-line comments).
- On a 16-bit system, variables default to two 8-bit cells; `vars foo:10;` makes a 10-byte variable.

## Why it's worth knowing

POP-2 is a compact demonstration of how far you can push the "ALGOL syntax + stack evaluation" hybrid: control flow, functions, and I/O all reduce to *pushing values*, which makes the whole language trivially mappable onto a tiny VM (Uxn). It sits in the same lineage as Forth-style concatenative languages but keeps familiar statement structure.

## References

- [XXIIVV wiki — pop2](https://wiki.xxiivv.com/site/pop2.html)
- [POP-2 compiler source (Uxntal)](https://wiki.xxiivv.com/etc/pop2.tal.txt)
- [pop2 repository (git.sr.ht/~rabbits/pop2)](https://git.sr.ht/~rabbits/pop2)
- [Wikipedia — POP-2](https://en.wikipedia.org/wiki/POP-2)
