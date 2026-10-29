---
title: Testing LLM Prompt Outputs with the Node.js Built-in Test Runner
diataxis: How-to Guide
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/dineshgowtham/testing-claude-prompt-outputs-with-nodejs-built-in-test-runner-a-simple-real-world-guide-156
date: 2026-10-29
keywords:
- knowledge-base
- frontend-javascript
- programming
- how-to
---
# Testing LLM Prompt Outputs with the Node.js Built-in Test Runner

Step-by-step guide to unit-testing LLM prompts (e.g., Claude's JSON responses) with Node's built-in `node:test` runner — no Jest, no Mocha, nothing to install.

## Step 1: Why test LLM prompts at all

LLMs like Claude are **probabilistic**: the same prompt can produce slightly different wording each time. When your application depends on a structured answer (e.g., a JSON payload with `name` and `age`), a single unexpected token can break downstream code, cause UI glitches, or even raise security flags.

Why write tests for prompts:

1. **Guard against regressions** — if you tweak the prompt wording or change model version, a failing test tells you instantly that the JSON shape changed.
2. **Document expectations** — the test file becomes a living contract that new teammates can read to understand what the model should return.
3. **Speed up CI** — a fast, zero-dependency test runs in milliseconds, so your CI pipeline stays lightweight.

The built-in `node:test` module (Node 20+) does all of this without pulling in Jest, Mocha, or any other test library. It integrates with the `node --test` CLI and works with the standard `assert` module.

## Step 2: Set up the test environment

`node:test` provides the `test` (plus `describe` and `t.snapshot`) exports; assertion helpers come from the core `node:assert` module. Both are built in — there's nothing to install:

```ts
// test-setup.ts
import { test } from 'node:test';          // pulls in the test runner
import * as assert from 'node:assert';    // standard assertion library

// A tiny helper that prints a friendly message when the test file loads.
// This runs once, before any test cases.
console.log('🧪 Starting LLM prompt tests...');
```

## Step 3: Run the tests

```bash
node --test                          # execute all *.test.ts / *.test.js files
node --test --watch                  # watch for file changes and re-run automatically
node --test --experimental-coverage  # basic code-coverage collection
```

> **Tip:** the runner prints a concise summary (`✓` for passes, `✕` for failures) that is easy to read in CI logs.

## Step 4: Gotcha — returning async promises

`node:test` treats any unhandled promise rejection as a test failure. However, if you write an `async` test but forget to `return` the promise, the runner thinks the test finished synchronously and will **pass** even if the async code later throws:

```js
// ❌ Bad – test appears to pass, but the async work is ignored
test('bad async test', async () => {
  // missing "return" means the runner does not wait for this promise
  someAsyncFunctionThatFails();
});

// ✅ Good – returning the promise lets the runner see the rejection
test('good async test', () => {
  return someAsyncFunctionThatFails(); // runner waits and reports failure
});
```

Always either `return` the promise or mark the callback `async` **and** `await` inside it.

## Step 5: The real-world pattern — assert on Claude's JSON shape, not its text

The main pattern: the prompt asks Claude to return strict JSON like `{name, age}`. Instead of asserting on the exact response text (wording varies run to run and would break tests), parse the response and assert on the **structure** — `JSON.parse` throws if Claude added extra text, and shape checks stay stable across wording variance.

```ts
// claude-prompt.test.ts
import { test, describe, snapshot } from 'node:test';
import * as assert from 'node:assert';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// 1️⃣ Create a Bedrock client.
//    • Reads AWS credentials from the environment (e.g., ~/.aws/credentials)
//    • Region should match where your Bedrock instance lives.
const client = new BedrockRuntimeClient({ region: 'us-east-1' });

// 2️⃣ Build the request payload.
//    • modelId identifies Claude 3.0 Haiku.
//    • The prompt asks Claude to output strict JSON.
function buildClaudeRequest(): InvokeModelCommand {
  const body = {
    // Claude expects a "prompt" field for classic completion APIs.
    prompt: `You are a helpful assistant. Return a JSON object with exactly two keys:
    - name: a first name string
    - age: a whole number between 1 and 120

    Do NOT add any extra text or formatting.`, // <-- the prompt we are testing
    temperature: 0, // low temperature makes output deterministic
    maxTokens: 100,
  };

  return new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0', // Claude 3.0 Haiku identifier
    contentType: 'application/json',   // tell Bedrock we send JSON
    accept: 'application/json',        // ask for JSON back
    body: Buffer.from(JSON.stringify(body)), // SDK expects a Buffer
  });
}

// 3️⃣ The test itself.
//    • `async` + `await` so the runner knows when the promise resolves.
//    • After receiving the response we parse the JSON string.
//    • `t.snapshot` records the exact JSON so future runs can compare.
test('Claude returns valid JSON with name and age', async (t) => {
  const command = buildClaudeRequest();
  const response = await client.send(command);

  // Bedrock returns a Uint8Array; convert to string then JSON.
  const responseStr = Buffer.from(response.body as Uint8Array).toString('utf-8');

  // Parse the JSON – if Claude added extra text, JSON.parse will throw.
  const parsed = JSON.parse(responseStr);

  // Shape assertions on the parsed structure, not on raw text:
  assert.strictEqual(Object.keys(parsed).length, 2, 'Response must have exactly two fields');
  assert.ok(typeof parsed.name === 'string', 'name must be a string');
  assert.ok(Number.isInteger(parsed.age), 'age must be an integer');
  // For an exact-structure check, pin the parsed object instead:
  // assert.deepStrictEqual(parsed, { name: 'Alice', age: 30 });

  // Snapshot the whole object – future runs compare against this snapshot.
  // The snapshot lives in `claude-prompt.test.ts.snapshot` next to this file
  // (one `.snapshot` file per test file, named after it – not a hidden folder).
  t.snapshot(parsed);
});
```

Key choices:

- **`temperature: 0`** — LLMs use a temperature setting to control randomness; `0` forces the highest-probability token each step, making output far more repeatable (crucial for snapshot testing).
- **Assert on the parsed structure, not exact text** — `assert.deepStrictEqual` / shape checks on the parsed object, so wording variance doesn't break the test.
- **`t.snapshot`** (or the equivalent `t.assert.snapshot`) — stores a "golden copy" of the output in a per-test-file snapshot file: the test file's name with a `.snapshot` extension (e.g. `claude-prompt.test.ts.snapshot` in the same directory, checked in alongside the tests); subsequent runs compare against it. If you intentionally change the prompt and expect a different shape, update with `node --test --test-update-snapshots` (snapshot testing is built in since Node 22.3.0 and no longer experimental since 23.4.0).

### Additional gotchas

- **Streaming responses are nondeterministic** — Bedrock can stream as Server-Sent Events (SSE); each chunk may arrive at slightly different times and the model may insert tiny whitespace variations, so snapshots change on every run. Disable streaming for unit tests (the default for `InvokeModelCommand`) or post-process the streamed text to a canonical form (trim whitespace, sort keys).
- **Per-minute token limits** — Bedrock throttles on a per-minute token quota, not per request. Running many tests in parallel can trigger `ThrottlingException`. Serialize tests that hit the same model, or add a small delay:

```js
// Simple delay helper (ms)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('Claude JSON test with throttling guard', async (t) => {
  await wait(200); // pause 200 ms to stay under the token ceiling
  // … rest of test same as before …
});
```

- **Normalize snapshots** — even with `temperature: 0`, minor formatting differences (extra spaces, newlines) can cause mismatches. Snapshot a stable string instead:

```js
// Inside the test, after parsing:
const normalized = JSON.stringify(parsed, Object.keys(parsed).sort(), 2);
t.snapshot(normalized);
```

Now the snapshot file contains a prettified, consistently ordered JSON string, making diffs easy to read. Keep snapshots small — if the LLM returns a huge document, snapshot only the minimal structure your feature needs.

## Step 6: Iterate with watch mode and coverage

- `node --test --watch` — the runner watches every `*.test.*` file; saving changes re-executes the test automatically, no extra configuration.
- `node --test --experimental-coverage` — after the run, Node prints a summary like:

```text
Coverage Summary:
  lines: 95% (19/20)
  functions: 100% (2/2)
```

## Takeaways

- Node's native `node:test` gives a lightweight, zero-dependency harness for prompt tests.
- Async handling matters: always return or await promises so failures are detected.
- Set `temperature: 0` (and disable streaming) to make Claude's output deterministic enough for snapshot comparison.
- Watch mode + coverage for fast iteration; small delays or serialized tests to stay under Bedrock's token-per-minute quota.

## References

- [Testing Claude Prompt Outputs with Node.js Built-in test Runner (DEV.to)](https://dev.to/dineshgowtham/testing-claude-prompt-outputs-with-nodejs-built-in-test-runner-a-simple-real-world-guide-156)
- [Node.js documentation: node:test](https://nodejs.org/api/test.html)
- [Node.js documentation: node:test — Snapshot testing (added v22.3.0; `--test-update-snapshots`; `<testfile>.snapshot` files)](https://nodejs.org/api/test.html#snapshot-testing)
