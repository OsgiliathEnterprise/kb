---
title: 'JavaScript Expression Evaluation: Precedence, Associativity, and Short-Circuiting,
  Stage by Stage'
diataxis: Explanation
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/tntetsu/in-what-order-does-a-javascript-expression-run-watching-it-turn-into-a-value-3b9b
date: 2026-11-20
keywords:
- knowledge-base
- frontend-javascript
- programming
- explanations
---
# JavaScript Expression Evaluation: Precedence, Associativity, and Short-Circuiting, Stage by Stage

An expression is one line of code, but running it is a *series of small calculations*. Visualizing each replacement step makes three concepts click: operator precedence, associativity, and short-circuit evaluation. (Demonstrated with the browser-based [JSVisualizer](https://tntetsu.github.io/JSVisualizer/) Expr view, but the mental model is engine-agnostic.)

## The substitution ladder

```javascript
let a = 2, b = 3, c = 4, d = true;
let ok = a + b * c > 10 && d;   // true
```

Evaluation is a ladder of replacements, each row one stage:

```text
ok = a + b * c > 10 && d
ok = 2 + b * c > 10 && d      <- variables replaced left to right
ok = 2 + 3 * c > 10 && d
ok = 2 + 3 * 4 > 10 && d
ok = 2 + 12 > 10 && d         <- * applied before + (precedence)
ok = 14 > 10 && d
ok = true && d                <- everything left of && collapsed to one value
ok = true && true
ok = true
```

Two separate orders are at work — this is where people get confused:

1. **Variable reads** happen left to right (`a`, then `b`, then `c`), regardless of precedence.
2. **Operator application** follows precedence: `*` (highest) → `+` → `>` → `&&` (lowest). Since `&&` is lowest, the expression means `(a + b * c > 10) && d`.

## Trap 1 — you can't write a range as `0 < x < 10`

Same-precedence operators group by **associativity**; `<` is left-associative, which produces a silent bug:

```javascript
let x = 15;
let inRange = 0 < x < 10;
console.log(inRange); // true (!)
```

The hidden middle step: `0 < 15` becomes `true`, leaving `true < 10`. JavaScript coerces `true` to `1` when comparing, so the whole thing is `true`. Math notation does not carry over — the correct form is `0 < x && x < 10`.

## Trap 2 — the right side of `&&` may never run

```javascript
let user = null;
if (user !== null && user.age >= 20) { /* ... */ }
```

Evaluation stages: `null !== null && user.age >= 20` → `false && user.age >= 20` → `false`. The right side is **still unevaluated** when the result is decided — **short-circuit evaluation**. If the left side of `&&` is `false` (or the left side of `||` is `true`), the right side is skipped entirely.

Swap the operands to `user.age >= 20 && user !== null` and the program throws immediately: property access on `null` is attempted. Guards like `user !== null && ...` literally mean *"only calculate the right side when it's safe."*

Strictly, `&&`/`||` work with non-booleans too, returning one of the operands: `0 && 123` → `0`, `"hello" || 123` → `"hello"` (the basis of default-value idioms like `x || fallback`).

## Mental checklist for reading an expression

1. Find the **lowest-precedence** operator — that's the last thing applied and the true "split" of the expression (here: `&&`).
2. Reads/evaluations of operands proceed left to right.
3. Equal-precedence runs group by associativity (`<` left → `0 < x < 10` is `(0 < x) < 10`, a bug magnet).
4. `&&` and `||` may skip the right operand — order guards *before* risky access, never after.
5. When unsure, add parentheses: `(a + b) * c` documents intent and removes precedence from the equation.

## Try it (predict-then-run drills)

- Change `a + b * c` to `(a + b) * c` — which part collapses first now?
- Change `&& d` to `|| d` — does `d` still get evaluated when the left side is `true`?
- For `0 < x < 10`: is there any `x` that makes it false? (Yes — the coercion `true < 10` is always true once `x > 0`, so negative `x` is the falsifying case.)

## References

- [In What Order Does a JavaScript Expression Run? — DEV.to (tntetsu)](https://dev.to/tntetsu/in-what-order-does-a-javascript-expression-run-watching-it-turn-into-a-value-3b9b) (original article)
- [JSVisualizer (browser-based step-through Expr view)](https://tntetsu.github.io/JSVisualizer/)
- [MDN: Operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence)
