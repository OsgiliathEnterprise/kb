---
title: 'Rust GUI State Models and the Incrementalization Question: Why GPUI''s notify
  and Elm''s Update Don''t Scale'
diataxis: Explanation
domain: programming
topic: rust
source: HackerNews
source_url: https://blog.zortax.de/posts/a-critique-of-gpui
date: 2026-11-09
keywords:
- knowledge-base
- rust
- programming
- explanations
---
# Rust GUI State Models and the Incrementalization Question: Why GPUI's notify and Elm's Update Don't Scale

A critique of the Rust-native GUI trend (GPUI — chosen for Discord's rewrite — and egui) from someone with skin in the game: the author ported GPUI's Linux renderer to wgpu, built the benchmark harness, and works on `zgui`, a signal-based framework. Strip the bias and there's a rigorous architectural thesis worth understanding.

## The one question that matters

Ron Minsky (quoted by Raph Levien): *"hidden inside of every UI framework is some kind of incrementalization framework."* A UI is a function of state; state changes a little at a time. Every framework must answer: **when one value changes, what runs?**

| Model | What a write runs | Who finds the change |
| --- | --- | --- |
| Immediate (egui) | All UI code, next frame | Nobody |
| Elm (Iced) | All of `view`, then a diff | The diff |
| Views (GPUI) | Every view without a cache | You, with `notify` |
| Signals, re-run (Freya, Compose) | Components that read it | The framework |
| Signals, run-once (Floem, Solid, zgui) | Closures that read it | The framework |

## GPUI: `notify` is zone.js

GPUI is "hybrid immediate and retained": state lives in entities, UI is plain-Rust `render` functions, and writes must be announced with `cx.notify()` — because **Rust has no write barrier on `&mut`**, GPUI cannot see *which* field changed, or whether anything changed. `notify` carries an entity id; below that id GPUI knows nothing and re-renders every view not behind a valid `.cached()` boundary (rarely used in practice — it constrains layout semantics).

The Angular team's 2023 postmortem on zone.js applies: it "is only capable of notifying us when something *might* have happened... This approach has not scaled well." Measured scaling of a sparse change in a large tree:

- 3,000 live rows with a cached view per row: changing one label = **8.4 ms** (~3 ms per 1,000 rows). A hover, a keystroke, and writing an equal value cost the same — **the cost follows the tree, not the change**.
- Same rows as plain elements: **92 ms**.
- A hand-written equality guard: equal write drops 7.9 ms → **0.9 µs** (how much is left to each call site to discover).

**Making it precise defeats the appeal.** Retaining subtrees (Zed's experiments, the `gpui-fast` fork) works only down to *view* granularity — to update one label without rebuilding the sidebar, the label must become its own entity: a `Render` impl, a `Subscription`, a stored copy of the value, a hand-written equality guard, and an owner — all to say "this label depends on this count". In a signals framework:

```rust
let unread = Memo::new(move |_| {
    threads.with(|ts| ts.iter().filter(|t| t.unread.get()).count())
});
Label::derived(move || format!("{} unread", unread.get()))
```

Retention also pays only where state already mirrors views: with state owned per panel, one change saves 83%; with a *shared* model, the same frame is 11% **slower**. Zed's own team measured retention "1–3% slower than off on ordinary workloads" and warned "microbenchmark wins didn't predict real-Zed results". And Zed's design note concedes the failure mode: **"Missing notifications are application bugs."**

## Elm: deceptively simple at small scales

One state value, one `update`, one `view` reads beautifully in tutorials. In a real app, a derived `unread` count must be maintained in **every** message arm that touches a thread — the definition is spread across the file and the compiler checks exhaustiveness, not arithmetic. Derived state has no single home; neither does local state (hover, half-typed drafts): "Actively trying to make components is a recipe for disaster in Elm." A real-world Elm file manager carries 136 top-level message variants + 73 per-tab.

Elm's `update` answers "what happened?", not "what changed?" — the same scalability hole as GPUI. Iced rebuilds all of `view` per message batch: one label at 3,000 rows builds **39,023 widgets in 7.3 ms**; `Lazy` on every row only reaches 5.7 ms because `view` still visits each row to hash its key (the official example's `version: u8` bumped by hand in four `update` arms is "a dirty flag with a nicer name").

## The convergence claim

The web already walked this road: Redux docs read like a field report (treat the store "as if it were a database"; selectors "will be re-run after every dispatched action"; the core package "obsolete"), Redux guidance says subscribe at a granular level, MobX says create lots of small observers — i.e., make a boundary per projection **manually**, because the framework can't infer it. Outside React the mainstream moved to tracked reads (Angular/Vue/Svelte/Solid signals; Svelte: "we've come to the realisation that Knockout was right all along"). React remains the large dissenting exception. The author's conclusion: once you accept you need precision, **components that run once, with signals and reactive holes, are the simplest API for it**.

Caveats to weigh: benchmarks come from a stakeholder (he built `zgui`); the counter-argument (Iced's maintainer) that avoiding components "forces you to think hard about your data model" is given fair hearing; virtualized/bounded screens genuinely are cheap (Iced measured 0.19 ms on one).

## See also

- [gui-state-models-taxonomy.excalidraw](gui-state-models-taxonomy.svg) — the five-model taxonomy and the scaling law.

## References

- [A Critique of GPUI — zortax blog](https://blog.zortax.de/posts/a-critique-of-gpui)
- [Angular: Effects guide (signals era)](https://angular.dev/guide/signals/effect)
- [Svelte: Introducing runes](https://svelte.dev/blog/runes)
- [Redux: Deriving Data with Selectors](https://redux.js.org/usage/deriving-data-selectors)
