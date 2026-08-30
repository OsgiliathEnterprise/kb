---
title: Why Your React App Re-renders So Much — and Why That's Usually Fine
diataxis: Explanation
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/tanu_priya/why-does-your-react-app-re-render-so-much-45co
date: 2026-08-30
keywords:
- knowledge-base
- frontend-javascript
- programming
- explanations
---
# Why Your React App Re-renders So Much — and Why That's Usually Fine

Update one small piece of state (`setCount(count + 1)`) and the console suddenly shows `Header rendered`, `Sidebar rendered`, `ProductList rendered`… The instinctive reaction is "React is unnecessarily rendering my entire application!" — but that framing is wrong, and it leads to premature optimization.

## Re-render ≠ complete DOM rebuild

A re-render means React performs rendering work again to determine a component's next output:

```
State changes → Component renders → Next UI calculated
→ React reconciles the result → Necessary changes committed
```

React can render a component and discover that little — or nothing — needs to change in the actual DOM. It does **not** destroy and recreate the browser tree. So: *a re-render is normal; unnecessary expensive work is what you should care about.* The right question is not "how do I stop React from re-rendering?" but "is this re-render causing unnecessary expensive work?"

## What causes a component to render

1. **Its state changes** — the obvious case; `setCount` schedules work for that component.
2. **Its parent renders** — when `App` re-renders, React may also render children like `<Header />` even though they don't use the changed value. If `Header` is tiny and cheap, another render has practically no meaningful impact. The question is *how much work that render actually did*, not whether it rendered at all.
3. **Its props change** — new prop identity (new object/array/function references) makes React treat inputs as changed.

## Practical implications

- Don't chase re-render counts in the console; measure actual expensive work (large subtrees, heavy computations, layout thrash).
- `React.memo`/stable callbacks are only worth it when the render is *expensive*, not merely frequent.
- A cheap component rendering 10× per interaction costs less than one expensive component rendering once — optimize by cost of work, not frequency of renders.

## React 18: fewer render events via automatic batching

React 18 batches state updates **everywhere** (event handlers, timeouts, promises, native event listeners), not just inside React event handlers as before. Two `setState` calls in an async callback now produce a single re-render instead of two — so the raw "render count" you see in the console is already lower than it was pre-18 for the same code. This reinforces the note's core point: render *events* are a weak signal, because React itself is actively collapsing them; what matters is still the work each surviving render performs. (See the reactwg discussion "Automatic batching for fewer renders in React 18".)

## Profiling: measure work, not events

The React DevTools Profiler records per-component **update cost** — time spent rendering and committing — and answers "why did this component update?" by showing which props/state changed. The official performance docs make the distinction explicit: a component may render (recompute its output) while producing elements equal to the previous ones, in which case React does *no* DOM mutations at all. So when profiling:

- Look for components with high **total time** across many updates, not just frequent updates.
- Distinguish "rendered but no DOM change" (cheap — usually fine) from "rendered and committed large subtrees" (expensive — optimize).
- Only then consider `React.memo`, stable callbacks, or splitting state so fewer components see the changed value.

## Key takeaways

- Re-rendering is how React determines what the UI should look like; it is part of normal operation.
- The performance question is always about *work*, not *render events*.
- Diagnose with profiling (React DevTools Profiler) before adding memoization — memoizing cheap components adds overhead without benefit.

## References

- [Why Does Your React App Re-render So Much? (DEV.to)](https://dev.to/tanu_priya/why-does-your-react-app-re-render-so-much-45co)
- [Automatic batching for fewer renders in React 18 — reactwg/react-18 discussion](https://github.com/reactwg/react-18/discussions/21)
- [Optimizing Performance — React official docs (render vs. DOM mutation distinction)](https://legacy.reactjs.org/docs/optimizing-performance.html)
