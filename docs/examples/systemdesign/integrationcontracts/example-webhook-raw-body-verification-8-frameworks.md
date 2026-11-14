---
title: Reading the Raw Request Body for Webhook Signature Verification in 8 Frameworks
diataxis: Example
domain: system-design
topic: Integration-Contracts
source: DEV.to Tech News
source_url: https://dev.to/shannonllc/getting-the-raw-request-body-for-webhook-verification-in-8-frameworks-2pnd
date: 2026-11-14
keywords:
- knowledge-base
- Integration-Contracts
- system-design
- examples
---
# Reading the Raw Request Body for Webhook Signature Verification in 8 Frameworks

Most webhook signature mismatches are self-inflicted: the framework's JSON middleware parses the
body **before** verification runs, and re-serialization changes the bytes the HMAC was computed over.
The fix is identical in every framework — **read the body before any JSON parser touches it**.

Concrete example of why re-serialization breaks HMAC: sending `{"amount": 1.50, "name": "caf\u00e9"}`
through `JSON.parse` + `JSON.stringify` yields `{"amount":1.5,"name":"café"}` — spaces removed,
`1.50` → `1.5`, and the 6-char escape `\u00e9` becomes a literal `é` (2 bytes in UTF-8). Identical
data, different bytes, different signature. Python's `json.dumps` produces yet another variant
(separator spaces, escaped non-ASCII). You cannot reliably reproduce the sender's bytes by
parse-and-re-serialize; you must verify the raw bytes first and parse afterwards.

All examples use the [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)
header format (`webhook-id`, `webhook-timestamp`, `webhook-signature`); the same raw-body reads work
for Stripe, GitHub, or any sender.

## Quick reference

| Framework | Raw body access | Type | Gotcha |
|---|---|---|---|
| Express | `req.body` with `express.raw()` on the route | Buffer | Register the route **before** `app.use(express.json())` |
| Next.js (App Router) | `await request.text()` | string | `request.json()` first consumes the body — can't re-read |
| Next.js (Pages Router) | Read the stream with `bodyParser: false` | Buffer | API Routes auto-parse otherwise |
| Hono | `await c.req.text()` | string | No body-reading validator (`zValidator('json', …)`) before verify |
| FastAPI | `await request.body()` | bytes | A Pydantic body parameter only gives you the *parsed* value |
| Django | `request.body` | bytes | `request.read()` first → `RawPostDataException`; exempt CSRF |
| Rails | `request.raw_post` | String | Exclude the action from forgery protection |
| Laravel | `$request->getContent()` | string | — |
| Go (net/http) | `io.ReadAll(r.Body)` | []byte | Body is a one-shot stream — copy it if you also need it parsed |

## Express

```js
import express from 'express';
import { Webhook } from 'webhookadmin';

const wh = new Webhook(process.env.WEBHOOK_SECRET!);
const app = express();

// Register the webhook route BEFORE express.json()
app.post('/webhooks', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  try {
    const event = await wh.verify(req.body, req.headers);
    res.sendStatus(204);
  } catch {
    res.sendStatus(400);
  }
});

app.use(express.json()); // for every other route
```

`express.raw()`'s `type` option defaults to `application/octet-stream` — set it to `application/json`
or the parser skips the request. Route-ordering is the #1 Express failure (Stripe's troubleshooting
guide gives the same advice).

## Next.js — App Router vs Pages Router

```ts
// app/webhooks/route.ts  (App Router — no bodyParser config needed)
import { Webhook } from 'webhookadmin';
const wh = new Webhook(process.env.WEBHOOK_SECRET!);

export async function POST(request: Request) {
  const body = await request.text();          // raw string, before any parsing
  try {
    await wh.verify(body, request.headers);
    return new Response(null, { status: 204 });
  } catch {
    return new Response('invalid signature', { status: 400 });
  }
}
```

```ts
// pages/api/webhooks.ts  (Pages Router — must disable the auto body parser)
import type { NextApiRequest, NextApiResponse } from 'next';
import { Webhook } from 'webhookadmin';

export const config = { api: { bodyParser: false } };
const wh = new Webhook(process.env.WEBHOOK_SECRET!);

async function readRaw(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = await readRaw(req);
  try { await wh.verify(raw, req.headers); res.status(204).end(); }
  catch { res.status(400).end(); }
}
```

## FastAPI and Django

```python
# FastAPI — await request.body() returns bytes
import os
from fastapi import FastAPI, Request, Response
from standardwebhooks.webhooks import Webhook

wh = Webhook(os.environ["WEBHOOK_SECRET"])  # whsec_…
app = FastAPI()

@app.post("/webhooks")
async def webhooks(request: Request):
    body = await request.body()             # bytes — do NOT use a Pydantic model param
    try:
        event = wh.verify(body, dict(request.headers))
    except Exception:
        return Response(status_code=400)
    return Response(status_code=204)
```

```python
# Django — request.body is the raw bytestring
import os
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from standardwebhooks.webhooks import Webhook

wh = Webhook(os.environ["WEBHOOK_SECRET"])

@csrf_exempt                       # exempt the webhook view from CSRF checks
@require_POST
def webhooks(request):
    try:
        event = wh.verify(request.body, dict(request.headers))
    except Exception:
        return HttpResponse(status=400)
    return HttpResponse(status=204)
```

Python verifiers accept **bytes** — both `await request.body()` (FastAPI/Starlette) and
`request.body` (Django) return them, and the Standard Webhooks library decodes UTF-8 itself.
If anything calls `request.read()` before Django's `.body` accessor, you get `RawPostDataException`.

## Rails (and Laravel / Go one-liners)

```ruby
class WebhooksController < ApplicationController
  protect_from_forgery except: :create        # exclude from CSRF/forgery protection

  def create
    webhook = StandardWebhooks::Webhook.new(ENV.fetch('WEBHOOK_SECRET'))
    payload = webhook.verify(request.raw_post, {
      'webhook-id'        => request.headers['webhook-id'],
      'webhook-timestamp' => request.headers['webhook-timestamp'],
      'webhook-signature' => request.headers['webhook-signature'],
    })
    head :no_content
  end
end
```

- **Laravel**: `$request->getContent()` returns the raw body string — pass it to your verifier before
  calling `$request->json()` / `$request->all()`.
- **Go (net/http)**: `raw, err := io.ReadAll(r.Body)` then `json.Unmarshal(raw, &event)` — the body is a
  stream you read once, so keep the bytes and unmarshal from them instead of `json.NewDecoder(r.Body)`.
- **Hono**: `await c.req.text()` (or `arrayBuffer()`); identical code on Cloudflare Workers, Bun,
  Deno, Node. Secrets on Workers come from `c.env`.

## Verification checklist

1. Verify **raw bytes**, parse only the verified payload (or the verifier's return value).
2. Reject on missing `webhook-timestamp` and stale timestamps (replay defense — see
   [[howto-defend-webhooks-against-replay-attacks]]).
3. Register the webhook route before global JSON middleware (Express) / disable the parser per-route
   (Next Pages) / avoid body-consuming validators on the route (Hono).
4. Exempt the endpoint from CSRF/forgery protection (Django, Rails, Laravel).
5. Return 204 on success, 400 on invalid signature — never 500, which invites sender retries of bad payloads.

## References

- [Getting the Raw Request Body for Webhook Verification in 8 Frameworks (DEV.to)](https://dev.to/shannonllc/getting-the-raw-request-body-for-webhook-verification-in-8-frameworks-2pnd)
- [Standard Webhooks specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)
- [Original blog post (Webhook Admin)](https://webhookadmin.com/en/blog/webhook-raw-body-by-framework/)
- [Next.js Route Handlers reference](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js API Routes — bodyParser config](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Django HttpRequest reference](https://docs.djangoproject.com/en/stable/ref/request-response/)
- [ActionDispatch::Request (Rails API docs)](https://api.rubyonrails.org/classes/ActionDispatch/Request.html)
