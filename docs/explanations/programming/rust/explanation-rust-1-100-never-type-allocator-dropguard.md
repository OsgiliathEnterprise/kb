---
title: 'Rust 1.100 Explained: Never Type, Allocator API, DropGuard, and Cargo Lints'
diataxis: Explanation
domain: programming
topic: rust
source: HackerNews (blog.rust-lang.org)
source_url: https://blog.rust-lang.org/2026/11/12/Rust-1.100.0/
date: 2026-11-13
keywords:
- knowledge-base
- rust
- programming
- explanations
---
# Rust 1.100 Explained: Never Type, Allocator API, DropGuard, and Cargo Lints

Rust 1.100.0 (2026-11-12) is a milestone release: the **never type** finally stabilizes after 10 years and 5 failed attempts, the **`Allocator` API** core lands, and Cargo gains its own lint system. Upgrade with `rustup update stable`.

## The never type `!` is finally nameable everywhere

`!` is the canonical *uninhabited* type — the type of diverging computations (`return`, `break`, `std::process::exit`). It permits a **never-to-any coercion** (unique among uninhabited types), which is why diverging match arms already type-checked:

```rust
fn mrrrow(option: Option<u32>) {
    let value = match option {
        Some(x) => x,      // x: u32
        None => return,    // return: ! coerced to u32
    };
}
```

What's new in 1.100:

- `!` can be **written anywhere**, e.g. `fn infallible_unwrap<T>(res: Result<T, !>) -> T` — previously illegal.
- `std::convert::Infallible` becomes an **alias of `!`**, so old `Infallible` APIs interoperate with `!` (the long-planned endgame, and the main reason stabilization was hard).
- **Breaking change**: the *never type fallback* changes from `()` to `!` for editions 2015/2018/2021 (edition 2024 already did this). Mostly invisible, but generic-result code that ignores a value may now fail to compile or be detected as unreachable — update offending dependencies first.

## `DropGuard`: run a closure on every exit path

`Drop` runs on scope exit regardless of `return`/`?`/panic, but implementing it for a one-off cleanup is boilerplate. `core::mem::DropGuard` takes a value + closure, implements `Deref`/`DerefMut`, and runs the closure when dropped. `DropGuard::dismiss` returns the inner value *without* running the closure — enabling transaction-like rollback:

```rust
use std::mem::DropGuard;

fn parse_all(nums: &mut Vec<u32>, strings: &[&str]) -> Result<(), ParseIntError> {
    let len = nums.len();
    let mut nums = DropGuard::new(nums, move |nums| nums.truncate(len)); // rollback
    for s in strings {
        nums.push(s.parse()?);        // `?` early-return triggers truncate
    }
    DropGuard::dismiss(nums);         // success: cancel the rollback
    Ok(())
}
```

This is the std version of the `guard`/`scopeguard` crate pattern.

## `conjure_zst`: the sanctioned way to make a zero-sized type

```rust
let token: Python<'py> = unsafe { std::mem::conjure_zst() };
```

During the unsafe-code-guidelines process it became clear the language needed *one* dedicated way to create an inhabited ZST (instead of `transmute::&lt;(), T>(())` or `MaybeUninit::uninit().assume_init()`). It is `unsafe` because APIs guard safety with ZSTs — e.g. PyO3's zero-sized `Python&lt;'py>` token *is* proof you hold the GIL; conjuring it from thin air would break that contract.

## `Allocator` API core stabilized

The `Allocator` trait stabilizes the core of `allocator_api` (issue #32838), letting library authors define custom allocators usable with `Vec` and `Box` today (`Vec<T, A>`, `Box<T, A>`), plus `Vec::from_raw_parts_in`, `into_parts_with_allocator`, `allocator()`, etc. This is the foundation of the **Allocators 1.0** project goal; more collections/pointer types to follow in later releases.

## Cargo: lints, unused dependencies, cache hygiene, min-publish-age

- **Unused dependency warnings** (completes the *Cargo lints* project goal): Cargo itself now reports deps not used by any build target — `warning: unused dependency \`tracing-subscriber\`` pointing at `Cargo.toml:23`. Controlled via the new `[lints.cargo]` table (`cargo::unused_dependencies = "warn"` by default). Caveats: only warns when *every* target that could use the dep is built (`cargo check --bin foo` won't warn); no warning for `dev-dependencies`. This avoids the false positives that plague rustc's `unused_crate_dependencies` lint in Cargo projects.
- **Reduced Cargo cache collisions** for registry cache entries.
- **`min-publish-age`** — dependency *cooldowns*: refuse to resolve crate versions published less than N ago, a supply-chain guard against typosquat/worm releases (the pattern seen in npm/cargo compromise waves).

## Other stabilizations worth knowing

`bool::toggle`, `Box::take`/`Box::map`, `Rc::map`, `Arc::map`, `str::trim_prefix`/`trim_suffix` (+ slices, `Path::trim_prefix`), `Vec::from_fn`, `UnsafeCell::replace` / `as_ref_unchecked` / `as_mut_unchecked`, `impl Default for Once`, `impl AsRef<T>/AsMut<T> for !`, Windows: `CommandExt::show_window`, `Child::main_thread_handle`.

## Practical migration notes

1. If a dependency breaks on the never-type fallback change, update it first — ecosystem fixes were shipped in advance with future-compat warnings.
2. Add `[lints.cargo]` to workspace manifests to adopt the new Cargo lint system gradually.
3. Evaluate `min-publish-age` in CI for supply-chain hardening before adding a new crate.

## References

- [Announcing Rust 1.100.0 — official release post](https://blog.rust-lang.org/2026/11/12/Rust-1.100.0/)
- [Detailed release notes for 1.100.0](https://doc.rust-lang.org/stable/releases.html#version-11000-2026-11-12)
- [Never type fallback change (edition guide)](https://doc.rust-lang.org/edition-guide/rust-2024/never-type-fallback.html)
- [Cargo lints reference](https://doc.rust-lang.org/stable/cargo/reference/lints.html)
- [Rust 1.100.0 release on GitHub](https://github.com/rust-lang/rust/releases/tag/1.100.0)
- [LWN: Stabilizing Rust's never type — the decade-long history behind the 5 failed attempts](https://lwn.net/Articles/1091015/)
- [Rust 1.100.0 changelog summary (releases.rs)](https://releases.rs/docs/1.100.0/)
