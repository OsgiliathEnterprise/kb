---
title: Unbounded LLM Calls in the Wild — Auditing 14 Public AI SDK Repos for Missing
  Token Ceilings, Timeouts, and Abort Signals
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: DEV.to Tech News
source_url: https://dev.to/ofri-peretz/i-linted-14-public-ai-sdk-repos-12-ship-a-call-with-no-token-ceiling-2349
date: 2026-10-07
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Unbounded LLM Calls in the Wild — Auditing 14 Public AI SDK Repos for Missing Token Ceilings, Timeouts, and Abort Signals

An unbounded LLM call is three failures in one missing config object: **no output cap** (unlimited token spend), **no request timeout** (indefinite hang), and **no abort signal on the stream** (uncancellable work). This note summarizes a lint-based audit of 14 public repositories that use the Vercel AI SDK, plus the methodological lessons about how to report such findings honestly.

## The corpus and the numbers

20,004 source files across 14 public repos; 474 import the Vercel AI SDK; **116 contain a real generation call** — that 116 is the denominator for everything below:

| Bound | Files missing it | Repositories |
| --- | --- | --- |
| Output cap (`maxOutputTokens`) | 103 / 116 | **12 of 14** |
| Request timeout | 50 / 116 | 9 of 14 |
| Abort signal on a stream | 44 / 116 | 7 of 14 |

### Read the repo column, not the percentage

88.8% (files) is the number that would travel — and the one to trust least: one repository (`cloudflare_agents`) contributes 52 of those 103 files, just over half. File percentages measure how a codebase is split into modules as much as how it was written. **The repo count is the robust statistic**: "twelve of fourteen" survives deleting any single project from the corpus; the percentage does not.

### Five of the fourteen are Vercel's own repos

`ai-elements`, `vercel_chat`, `vercel_examples`, `vercel_streamdown`, and `vercel-labs_agent-eval` all appear in the findings. That is not a gotcha — it is the mechanism: example code is deliberately minimal, and a ceiling is "noise" in a snippet teaching you `streamText`. But **the minimal shape is the shape that gets copied** into production handlers, where the omission is no longer noise. The omission is correct upstream and wrong downstream — which is exactly why nothing catches it.

## What an unbounded call looks like in the wild

The common form:

```typescript
const result = streamText({ model, messages });
```

A subtler real case (`302ai_302-AI-Studio`) builds options indirectly — which a naive rule would flag as a false positive:

```typescript
const streamTextOptions = { ...baseConfig, ...(prompt && { system: prompt }) };
const result = await generateText(streamTextOptions);
```

It is *not* a false positive: `baseConfig` sets `model`, `messages`, `providerOptions`, and `tools` — and the whole 1,500-line file contains exactly **one** occurrence of `timeout`, `abortSignal`, or `maxOutputTokens`. Indirect option construction defeats pattern-matching linters that only see literal call arguments.

## The bound the audit threw out (and why)

The sweep also measured a fourth bound — step count (`stopWhen`) — and deliberately did **not** report it, for two independent reasons:

1. The SDK already defaults `stopWhen` to `stepCountIs(1)`, so the loop is bounded unless you raised it yourself; a rule firing there reports a non-defect.
2. Spot-checking four flagged files found one that sets *both* `stopWhen` and `stepCountIs` and was still flagged — a false positive in the rule itself.

A rule that fires on a safe default doesn't make the number bigger; it makes the other three findings unbelievable. **Discarding a weak bound is part of audit credibility.**

## Running it on your own code

```javascript
// eslint.config.mjs — after `npm i -D eslint-plugin-vercel-ai-security`
import ai from "eslint-plugin-vercel-ai-security";

export default [
  {
    files: ["**/*.ts"],
    plugins: { "vercel-ai-security": ai },
    rules: { "vercel-ai-security/require-max-tokens": "error" },
  },
];
```

## Honest limits of the finding

- **n = 14 is small**, and this corpus is an adoption-scan convenience sample, not a random draw from npm. Two directories turned out to be the same project cloned twice — caught by content fingerprinting (every checkout reported the same `git remote`).
- The claim is "this is what the SDK's own ecosystem looks like," **not** a population rate.
- A prior sweep of similar scope recorded findings but no denominator and no repo list, so it could not answer this question at all: *a count without its denominator isn't a small result — it's not a result.*

## Key takeaways

- Unbounded LLM calls are an ecosystem-wide default-in-by-example problem: vendor sample code omits bounds for pedagogical reasons, and the omission propagates into production.
- When reporting security audits of codebases, **report repo-level counts with explicit denominators**, not file percentages — they survive corpus changes and don't conflate module layout with authoring choices.
- Lint rules must handle indirect option construction (spread-built config objects) or they will both miss real defects and generate false positives that erode trust in the whole finding set.
- Practical fix for your own handlers: every generation call gets `maxOutputTokens`, a request timeout, and an `abortSignal` wired to user navigation/cancellation — treat the three as one checklist item ("bounded call"), not optional extras.

## Related notes

- `security-privacy/ai-agent-security/explanation-enterprise-ai-data-security-patterns.md`
- `api-design/request-retrial/howto-singleflight-full-jitter-concurrency-caps-typescript.md` — client-side resource bounding for non-LLM APIs

## References

- [I Linted 14 Public AI SDK Repos. 12 Ship a Call With No Token Ceiling (DEV.to)](https://dev.to/ofri-peretz/i-linted-14-public-ai-sdk-repos-12-ship-a-call-with-no-token-ceiling-2349)
- [eslint-plugin-vercel-ai-security on npm](https://www.npmjs.com/package/eslint-plugin-vercel-ai-security)
