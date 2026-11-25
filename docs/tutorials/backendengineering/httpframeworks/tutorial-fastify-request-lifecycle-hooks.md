---
title: 'Learning Fastify''s Request Lifecycle by Making It Print Itself: Hooks from
  onRequest to onResponse'
diataxis: Tutorial
domain: backend-engineering
topic: http-frameworks
source: DEV.to Tech News
source_url: https://dev.to/tony133/hooks-and-the-request-lifecycle-fastify-with-typescript-part-918-5d9c
date: 2026-11-25
keywords:
- knowledge-base
- http-frameworks
- backend-engineering
- tutorials
---
# Learning Fastify's Request Lifecycle by Making It Print Itself: Hooks from onRequest to onResponse

Fastify's answer to middleware is **hooks**: functions attached to well-defined stages of the request lifecycle, with explicit execution order and encapsulation. This tutorial (chapter 9 of the *Fastify with TypeScript* series) teaches the lifecycle by **instrumenting it** rather than memorizing a diagram — a technique worth stealing for any framework.

## The order you need in your bones

```
onRequest → preParsing → preValidation → preHandler → handler
  → preSerialization → onSend → onResponse
```

## Step 1 — Print the lifecycle

Temporarily register a logging hook per stage inside a plugin (here `src/users/users.route.ts`):

```ts
const stages = [
  'onRequest', 'preParsing', 'preValidation', 'preHandler',
  'preSerialization', 'onSend', 'onResponse',
] as const;
for (const stage of stages) {
  fastify.addHook(stage, async () => { console.log(stage); });
}
fastify.addHook('onError', async (request, reply, error) => {
  console.log('onError:', error.message);
});
```

A valid request prints the full sequence. An **invalid body** (`-d '{"name":"Grace"}'` with `email` required) prints:

```
onRequest
preParsing
preValidation
onError: body must have required property 'email'
onSend
onResponse
```

Three lessons fall out of this one experiment:

1. Schema validation runs **between `preValidation` and `preHandler`** — on failure, `preHandler`, the handler, and `preSerialization` never run.
2. The error response still flows through `onSend`/`onResponse`, so your metrics hooks see errors too.
3. Hitting `/health` (declared **outside** the users plugin) prints **nothing**: hooks are scoped by encapsulation, exactly like plugins.

## Step 2 — Know which stage does what job

| Hook | State of the request | Canonical use |
|---|---|---|
| `onRequest` | body not read yet | auth, rate limiting — rejection costs almost nothing |
| `preParsing` | raw body stream | decompression, decryption (rare) |
| `preValidation` | parsed, unvalidated | normalize input before the schema sees it |
| `preHandler` | validated + typed | authorization needing `request.body`/`params` |
| `preSerialization` | handler's return value | enrich the payload before JSON encoding |
| `onSend` | serialized payload + headers | last chance to modify the response |
| `onResponse` | response sent | metrics, timing |
| `onError` | something threw | observe (log/report) — never change the reply |

The official Fastify docs add one more request hook this article omits: **`onTimeout`**.

```ts
// preValidation: normalize before validation
fastify.addHook('preValidation', async (request) => {
  const body = request.body;
  if (body && typeof body === 'object' && 'email' in body && typeof body.email === 'string') {
    body.email = body.email.trim().toLowerCase();
  }
});

// preSerialization: enrich the payload
fastify.addHook('preSerialization', async (request, reply, payload: unknown) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return { ...payload, servedAt: new Date().toISOString() };
  }
  return payload;
});

// onResponse: measure what already left
fastify.addHook('onResponse', async (request, reply) => {
  request.log.info({ ms: reply.elapsedTime }, 'Request completed');
});
```

**TypeScript reality check**: in `preValidation`, `request.body` is `unknown`; in `preSerialization`, `payload` is unvalidated. Narrow with `typeof`/`in` — these are precisely the stages where data is *not* guaranteed, so do not reach for a cast.

## Step 3 — Stop a request from a hook

Two idioms; prefer throwing so the error handler owns the response shape:

```ts
// option A: throw → Fastify stops, error handler builds the response
// option B: reply yourself — return it from async hooks so Fastify knows it's answered
fastify.addHook('onRequest', async (request, reply) => {
  if (!request.headers.authorization) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});
```

## Step 4 — Route-level hooks instead of whole-plugin hooks

Any route can declare per-stage hook arrays in its options — the pattern for reusable auth: write the check once, list it per protected route.

```ts
fastify.get('/admin', {
  onRequest: [async (request, reply) => {
    if (request.headers['x-admin'] !== 'yes') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  }],
}, async () => ({ admin: true }));
```

## Step 5 — Application lifecycle hooks

```ts
fastify.addHook('onReady', async function () {
  this.log.info('All plugins loaded, ready to accept connections');
});
fastify.addHook('onClose', async function () {
  this.log.info('Closing');
});
```

`onReady` fires once after all plugins load; `onClose` fires on `app.close()` — the place where resource-holding plugins (DB pools) release, and the backbone of graceful shutdown.

## Cleanup and progression

Remove the temporary printing block when done. Natural next topics: error handling (the `onError` path) and authentication via route-level `onRequest` hooks.

## References

- [Hooks and the request lifecycle — Fastify with TypeScript, part 9/18 (DEV.to)](https://dev.to/tony133/hooks-and-the-request-lifecycle-fastify-with-typescript-part-918-5d9c)
- [Hooks — Fastify official reference](https://fastify.dev/docs/latest/Reference/Hooks/)
