---
title: 'Traits in Zig: Compile-Time Type Contracts via Structs of Functions'
diataxis: Explanation
domain: programming
topic: zig
source: HackerNews
source_url: https://www.axelmagn.com/blog/202610-zig-traits/
date: 2026-10-23
keywords:
- knowledge-base
- zig
- programming
- explanations
---
# Traits in Zig: Compile-Time Type Contracts via Structs of Functions

Zig has no built-in type classes (Rust traits, Haskell typeclasses), and its two conventional polymorphism mechanisms each carry tradeoffs:

1. **Dynamic interfaces** — opaque pointer + vtable + dynamic dispatch. Gives you familiar type contracts, but the runtime vtable is a hard barrier for the compiler, so it can't apply the optimizations it would on monomorphic code.
2. **Comptime duck typing** — `anytype` / type argument `T` with compile-time reflection or assumptions about `T`'s methods. Monomorphized like C++ templates, violations caught at compile time, but the contract is *implicit* — callers and callees must document and follow it by hand.

A userland **convention** (no libraries, no language feature) closes the gap: a **Trait** is a *compile-time struct that contains related functions over a given type* — OCaml-module-inspired (the word "module" is already taken in Zig).

## The pattern

```zig
/// T forms a Reducer under an empty value and a combine operation
fn Reducer(T: type) type {
    return struct {
        empty: T,
        combine: fn (T, T) T,

        fn reduce(self: @This(), xs: []const T) T {
            var accum = self.empty;
            for (xs) |x| accum = self.combine(accum, x);
            return accum;
        }
    };
}

const sum_trait = impl(Reducer(i32), struct {
    pub const empty = 0;
    pub fn combine(x: T, y: T) T { return x + y; }
});

const product_trait = impl(Reducer(i32), struct {
    pub const empty = 1;
    pub fn combine(x: T, y: T) T { return x * y; }
});
```

The contract is explicit, LSP autocompletion picks it up, and the compiler inlines and unrolls everything. Traits behave like vtables except they are evaluated at **comptime**.

## The `impl` helper

Declaring trait implementations from anonymous structs gets verbose; a tiny reflection helper removes the boilerplate:

```zig
pub fn impl(comptime Trait: type, comptime Impl: type) Trait {
    comptime {
        var result: Trait = undefined;
        for (@typeInfo(Trait).@"struct".field_names) |field_name| {
            @field(result, field_name) = @field(Impl, field_name);
        }
        return result;
    }
}
```

Declarations need to be `pub` for the type reflection to work.

## The three-stage ladder (Möbius transformation example)

For `mobius(x, a, b, c, d) = (a*x + b) / (c*x + d)` over user-defined types like `Rational`/`Complex`:

1. **Comptime duck typing** — call `a.mul(x).add(b)`. Ties you to an object-oriented pattern (methods on the struct); works for user types, not primitives.
2. **Compile-time dependency injection** — pass the needed functions individually: `mobius(comptime T, comptime add, comptime mul, comptime div, x, a, b, c, d)`. Verbose signature, but zero boilerplate on the types and fully explicit.
3. **Traits** — gather the functions into one struct and pass one value:

```zig
fn Num(T: type) type {
    return struct {
        add: fn (T, T) T,
        sub: fn (T, T) T,
        mul: fn (T, T) T,
        div: fn (T, T) T,
    };
}

fn mobius(T: type, num: Num(T), x: T, a: T, b: T, c: T, d: T) T {
    const numerator = num.add(num.mul(a, x), b);
    const denominator = num.add(num.mul(c, x), d);
    return num.div(numerator, denominator);
}

const Complex = struct {
    // fields...
    const num = Num(Complex) { .add = add, .sub = sub, .mul = mul, .div = div };
    // functions...
};

mobius(Complex, Complex.num, x, a, b, c, d);
```

## Extending traits to the primitive types

Traits must be conditioned on a *known* type, so extend `Num` to `i32`/`f32` with a factory function that switches on `@typeInfo`:

```zig
fn builtinNum(T: type) Num(T) {
    const inner = struct {
        fn add(lhs: T, rhs: T) T { return lhs + rhs; }
        fn sub(lhs: T, rhs: T) T { return lhs - rhs; }
        fn mul(lhs: T, rhs: T) T { return lhs * rhs; }
    };
    const div = switch (@typeInfo(T)) {
        .int, .comptime_int => struct {
            fn div(lhs: T, rhs: T) T { return @divTrunc(lhs, rhs); }
        }.div,
        .float, .comptime_float => struct {
            fn div(lhs: T, rhs: T) T { return lhs / rhs; }
        }.div,
        else => @compileError("unsupported type: " ++ @typeName(T)),
    };
    return .{ .add = inner.add, .sub = inner.sub, .mul = inner.mul, .div = div };
}

mobius(f32, builtinNum(f32), x, a, b, c, d);
```

## Limitations

- Traits must be conditioned on a known type — there are **no associated types**. `fn Iter(Elem: type)` with an inferred `T` inside is not valid Zig; you must write `fn Iter(T: type, Elem: type)` with `T` supplied.
- Traits **do not play well with type erasure** — no "give me a number, I don't care which kind".

## When to use (and when not)

- **Use**: abstractions inside hot loops where you want monomorphization + static dispatch; library functions unopinionated about data layout; metaprogramming building blocks. The author mostly reaches for them pull-based — when a function has an undecided implementation detail.
- **Avoid**: nesting comptime-parameterized functions several layers deep. Each instantiation gets its own templated assembly; deep nesting can cause a **combinatorial explosion** of code size, thrash CPU caches, and be *outperformed* by dynamic dispatch with vtables.
- It is a **convention, not a language feature** — which is also why it lends itself poorly to a library and lives per-codebase.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "z1",
      "type": "text",
      "x": 40,
      "y": 15,
      "text": { "content": "Zig polymorphism: three ways to write the same mobius function", "fontSize": 16, "fontFamily": 1 }
    },
    {
      "id": "z2",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 220,
      "height": 130,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Dynamic interfaces\nopaque ptr + vtable\nruntime dispatch\nmodular, but compiler barrier\n+ perf overhead", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "z3",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 220,
      "height": 130,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Comptime duck typing\nanytype / T + reflection\nmonomorphized, checked at compile time\ncontract IMPLICIT (documented by hand)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "z4",
      "type": "rectangle",
      "x": 560,
      "y": 60,
      "width": 220,
      "height": 130,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Traits (convention)\nstruct of comptime functions\nexplicit contract, inlined + unrolled\nno associated types, no type erasure", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "z5",
      "type": "rectangle",
      "x": 300,
      "y": 240,
      "width": 480,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Warning: deep comptime nesting -> templated-assembly explosion\nbinary bloat, cache thrash, vtables can win", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "za1",
        "type": "arrow",
        "x": 260,
        "y": 125,
        "width": 40,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [40, 0]]
      }
    ],
    [
      {
        "id": "za2",
        "type": "arrow",
        "x": 520,
        "y": 125,
        "width": 40,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [40, 0]]
      }
    ]
  ]
}
```

## References

- [We have Traits at Home (Mesoloop / Axel Magnussen)](https://www.axelmagn.com/blog/202610-zig-traits/)
- [Zig Interfaces (Karl Seguin)](https://www.openmymind.net/Zig-Interfaces/)
- [Zig Interface Revisited (William Wong)](https://williamw520.github.io/2025/07/13/zig-interface-revisited.html)
- [Inside Zig's new Writer (Joe McKay)](https://joegm.github.io/blog/inside-zigs-new-writer-interface/)
- [Interfaces in Zig (Brad Cypert)](https://www.bradcypert.com/interfaces-in-zig/)
- [Zig Comptime is Bonkers Good (Scott Redit)](https://www.scottredig.com/blog/bonkers_comptime/)
- [A Practical Guide to Applying Data-Oriented Design (Andrew Kelley)](https://vimeo.com/649009599)
- [Rust std::ops (reference for richer numeric traits)](https://doc.rust-lang.org/std/ops/index.html)
