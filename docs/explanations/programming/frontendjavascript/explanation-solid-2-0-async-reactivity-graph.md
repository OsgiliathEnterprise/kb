---
title: 'Solid 2.0: Async Reactivity Graph, Core Server Functions, and Agent-Readable
  Diagnostics'
diataxis: Explanation
domain: programming
topic: frontend-javascript
source: HackerNews (Solid blog)
source_url: https://www.solidjs.com/blog/solid-2-0-the-long-hold/
date: '2026-11-18'
keywords:
- knowledge-base
- frontend-javascript
- programming
- explanations
---
# Solid 2.0: Async Reactivity Graph, Core Server Functions, and Agent-Readable Diagnostics

## Overview
Solid 2.0 reached stable 17 Nov 2026, five years after 1.0. The reactive core was rewritten from scratch (announced Feb 2025, beta Mar, RC Aug with frozen API, then **23 release candidates in 14 weeks** — 971 PRs merged, 753 issues closed). The stabilization bar: a full week with no regression in ordinary app code and no crash/hang anywhere. Three architectural bets define the release.

## 1. Async joins the reactivity graph
A computation can return a Promise or async iterator and downstream nodes understand pending/stale state natively — no `createResource` ceremony:

```jsx
function Profile(props) {
  const user = createMemo(() => fetchUser(props.id));
  return (
    <Loading fallback={<Skeleton />}>
      <h1 class={{ stale: isPending(user) }}>{user().name}</h1>
    </Loading>
  );
}
```

Race conditions, cancellation, and loading state are handled by the graph; speculative state auto-rolls back so the server stays the authority. Cascading async (dropdown → dependent dropdown) is plain derived state — no waterfall choreography.

**Server functions moved from SolidStart into core**: RPC over request/response *and* persistent connections via Server-Sent Events, with `"use server"` on async generators:

```ts
import { live } from "@solidjs/web/server-functions";
const stockPrice = live(async function* (symbol: string) {
  "use server";
  for await (const tick of subscribe(symbol)) yield tick.price;
});
const price = createMemo(() => stockPrice()); // in a component
```

SolidStart (the metaframework) is **retired** — the primitives (request/response on web standards, single-flight mutation, router/cache hooks) now live in core + framework-agnostic Vite plugins, so metaframeworks and ecosystem plugins (Clerk, Sentry, TanStack Query/Router) build on shared primitives instead of re-implementing.

## 2. API surface collapse
Removed because the async graph subsumes them: `createResource`, `batch`, `startTransition`, `on`, `produce`, `computed`, `createMutable` — and even `createEffect` becomes a rare escape hatch. Design principle stated explicitly for the AI era: **safe by construction rather than by exhaustion**; reduce state by deriving it.

## 3. Built to be written (and audited) by agents
The distinctive claim: a fine-grained graph knows exactly what was read, where, and what will update — so a *reactive mistake is detectable, not silent*. Dev builds emit stable diagnostic codes with source location, fix text, doc URL, and a machine-readable repair guide shipped in the package:

```
[STRICT_READ_UNTRACKED] Reactive value read directly in an effect callback will not update.
Move it into a tracking scope (JSX, a memo, or an effect's compute function).
in <App> › <Item> › effect at .../src/Item.tsx:12:19
docs: https://docs.solidjs.com/reference/solid-js/diagnostics/strict-read-untracked
agent repair guide: node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md#strict_read_untracked
```

Diagnostics cover async waterfalls, effect loops, and poorly-scaling graph shapes (wide fan-outs/fan-ins), and the same observability powers production (Sentry plugin, Chrome Performance Tracks integration). Experimental syntaxes aim the same way: **ReactiveScript** and **TSRX** use compilation to improve agent authoring.

The "Long Hold" title references the `long-hold` diagnostic — fires when a hold (pending computation shown via `isPending`) has had no input for too long.

## Mechanics on the ground (independent deep dive, 2026-11)
Dennis Morello's React-developer deep dive (written on the `2.0.0-beta.18` line) pins down the plumbing behind the headline claims:

- **`NotReadyError` is the suspension mechanism**: reading an in-flight async memo throws `NotReadyError` internally, which propagates up the graph to the nearest boundary — never caught by user code; it is what makes `<Loading>` and error boundaries work without a dedicated suspense primitive.
- **`<Loading>` covers initial readiness only** (vs 1.x `<Suspense>`): after first paint, a refetch keeps the *old* content on screen instead of flashing the fallback — the exact behavior React forces you to fight for with `useTransition`. Opt into fallback-reappear on a specific dependency with the new `on` prop: `<Loading on={userId()} fallback={…}>`.
- **Imperative escape**: `await resolve(() => user())` hands you a real promise outside a reactive scope (route loaders, event handlers).
- **Trap to avoid**: there is **no `createAsync` in core 2.0** — that name belongs to `@solidjs/router` and its 2.0 shape is unsettled; the core async primitive is a plain `createMemo` returning a promise (per the async RFC: async is "a first-class capability of computations").
- `<Reveal>` coordinates several boundaries (see the deep dive for the multi-boundary choreography).

Assessment: the fine-grained-graph-does-async story holds up under scrutiny; the beta-era API names are the main caveat, so pin the stable release before porting Morello's snippets verbatim.

## Assessment for our stack
Signals won the framework layer (Angular, Svelte runes, Vue Vapor, a TC39 proposal, React's compiler conversation) — Solid 2.0's real novelty is not signals but **observable reactivity as an agent-feedback loop**: compiler/runtime diagnostics with stable codes + in-package repair guides are a reusable pattern for any tooling that expects AI-authored code. Watch whether the diagnostic-code + SKILL.md convention gets adopted elsewhere.

## References
- Release post: [Solid 2.0 — The Long Hold](https://www.solidjs.com/blog/solid-2-0-the-long-hold/)
- Diagnostics reference: [long-hold](https://docs.solidjs.com/reference/solid-js/diagnostics/long-hold)
- Experimental syntaxes: [ReactiveScript](https://reactivescript.dev/) · [TSRX](https://tsrx.dev/)
- Deep dive: [SolidJS 2.0 Async Data — A Deep Dive for React Devs (Morello)](https://morello.dev/blog/solidjs-2-async-data) · [Async RFC](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/05-async-data.md)
