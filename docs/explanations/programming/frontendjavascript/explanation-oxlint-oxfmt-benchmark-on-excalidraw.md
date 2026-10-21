---
title: 'Oxlint and Oxfmt vs ESLint and Prettier: a Real-Codebase Benchmark and Migration
  Reality Check'
diataxis: Explanation
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/thereleasedesk/we-let-oxlint-loose-on-a-real-react-codebase-the-speed-wasnt-the-surprise-1gl9
date: 2026-10-21
keywords:
- knowledge-base
- frontend-javascript
- programming
- explanations
---
# Oxlint and Oxfmt vs ESLint and Prettier: a Real-Codebase Benchmark and Migration Reality Check

Case study from a team that ran the Oxc project's Rust-based linter (**Oxlint**) and formatter (**Oxfmt**) against **Excalidraw** — a large open-source React + TypeScript codebase (710 JS/TS files) still on **ESLint 7 with Create React App rules** and **Prettier 2.6 running inside ESLint as a plugin**. Machine: ordinary laptop (Ryzen 5 5600H, 12 threads, 15 GB RAM). Each command: 1 warm-up + 3 timed runs, median reported.

## Benchmark results

| What was run | Time |
| --- | --- |
| ESLint + Prettier plugin (Excalidraw's shipped setup) | 60.2 s |
| ESLint with the Prettier rule switched off | 50.7 s |
| Prettier 2.6 `--check` alone | 15.3 s |
| Oxlint with Excalidraw's rules ported | 1.5 s |
| Oxfmt `--check` | 0.41 s |

The full check went from ~1 minute to ~2 seconds (~30x). That is real but well short of the "50–100x faster than ESLint" headline — every rule/plugin switched on costs time. Oxlint with zero config took 0.46 s; with React, import, and accessibility rules on, 1.3–1.5 s.

**Bonus finding:** the Prettier-inside-ESLint plugin alone cost ~10 s per run. Even without switching tools, splitting Prettier out of ESLint recovers that today.

## The part nobody puts in the benchmark

Speed was the easy part. ESLint reported **0 warnings**; Oxlint with the same rules ported reported **435 warnings and 1 error** — and none of it meant Oxlint found 435 missed bugs:

- **145** were unused variables/parameters: Oxlint's version of the rule is stricter by default.
- **48 of 50** "number loses precision" warnings came from a single file: a table of 40-digit math constants written that way on purpose.
- **The 1 error** was a `target="_blank"` link that already had `rel="noopener"`, built from a template string — a case Excalidraw had already told ESLint to skip.

The genuinely useful findings: Oxlint's React rules flagged **22 places calling `setState` directly inside an effect** (newer React guidance says compute during render instead) and **10 `async` Promise executors** — things ESLint 7's old rules simply don't know about.

Takeaway: *the speed is free; the rule review is the real work.* First 2 seconds: "wow." Next 20 minutes: "which of these are real?" Next week: "who decides which rules we actually want?"

## What didn't move over

Three of Excalidraw's custom rules have no built-in Oxlint version:

1. `no-restricted-syntax` — used to forbid plain text in JSX (force `t(...)` for i18n). A real guard you'd lose.
2. `import/order` — Oxfmt can sort imports instead, but that's a formatting change, not a lint error.
3. `dot-notation` — minor.

Escapes: Oxlint's **JS plugin support** (load the original ESLint plugin through Oxlint — still **alpha**) or the official "run both" setup: `oxlint && eslint` with `eslint-plugin-oxlint` disabling the rules Oxlint already covers.

**Migration tooling trap:** `@oxlint/migrate` only reads **ESLint v9/v10 "flat" configs**. Excalidraw still used the legacy `.eslintrc.json`, so its config had to be ported by hand. If your project is on ESLint 8 or older, budget time for manual porting.

## The formatter is the easy win

Oxfmt ships its own migration command that worked on the first try:

```bash
npx oxfmt --migrate=prettier
```

It even caught a trap: **Oxfmt's default line width is 100, Prettier's is 80** — the tool kept Excalidraw at 80. Oxfmt wanted to reformat 102 files (+1,163 / −1,092 lines); Prettier 3 wants 126 files in the same repo, and every one of Oxfmt's 102 was also on Prettier 3's list. The churn comes from leaving Prettier 2's old style, not from Oxfmt being strange — you'd pay it either way.

Bonus: Prettier 2.6 couldn't even parse one of Excalidraw's TypeScript files (newer generic syntax) — the team had added a "skip Prettier here" comment above it. Oxfmt read it fine.

## Practical conclusion

- If you only want the win today: move Prettier out of ESLint (saves ~10 s here) — no tool switch.
- If you switch: expect the speed gain (~30x on this codebase), but budget real time for **rule review** (stricter defaults, false positives from numeric-precision checks, template-string blind spots) and **manual config porting** if you're below ESLint 9 flat config.
- Formatter migration (`npx oxfmt --migrate=prettier`) is the low-risk part; line-width defaults differ (100 vs 80), so verify before accepting churn.

## Maturity check

As of October 2026, Oxlint is the mature half of the pair, while **Oxfmt** reached **alpha in December 2025** and **beta in February 2026** (per the Oxc project blog). Budget the formatter migration accordingly — the `--migrate=prettier` command is the stable path, but expect Oxfmt defaults to still shift between beta releases.

## References

- [We let Oxlint loose on a real React codebase. The speed wasn't the surprise (DEV.to)](https://dev.to/thereleasedesk/we-let-oxlint-loose-on-a-real-react-codebase-the-speed-wasnt-the-surprise-1gl9)
- [Oxc project (Oxlint / Oxfmt)](https://oxc.rs)
- [Oxfmt: Oxc Formatter Alpha (Oxc blog, 2025-12-01)](https://oxc.rs/blog/2025-12-01-oxfmt-alpha.html)
- [Oxfmt Beta (Oxc blog, 2026-02-24)](https://oxc.rs/blog/2026-02-24-oxfmt-beta)
- [Migrate from Prettier (Oxfmt docs)](https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html)
- [Oxlint JS Plugins Alpha (Oxc blog, 2026-03-11)](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha)
