---
title: The 10-Minute Secrets Audit Before Shipping an AI-Built (Vibe-Coded) App
diataxis: How-to Guide
domain: security-privacy
topic: web-security
source: DEV.to Tech News
source_url: https://dev.to/zhuanxyz/before-you-ship-that-vibe-coded-app-run-this-10-minute-secrets-audit-hbb
date: 2026-11-21
keywords:
- knowledge-base
- web-security
- security-privacy
- how-to
---
# The 10-Minute Secrets Audit Before Shipping an AI-Built (Vibe-Coded) App

A viral vibe-coding story: a booking app built with Cursor/Claude + Supabase + Stripe + OpenAI +
Resend shipped **the OpenAI key, the Stripe secret key, and the Resend key in plain text in the
JavaScript bundle**. It worked, customers booked — and every visitor's browser held the keys. AI
tools are excellent at making things work and silent about what you just exposed. This audit closes
that gap in ten minutes, before every deploy.

## Why keys end up in the frontend (the actual mechanism)

Frontend frameworks **inline prefixed environment variables into the bundle at build time** — by
design, since the browser cannot read server environment. The prefix *is* the security model:

- **Vite:** anything prefixed `VITE_` is baked into client code.
- **Next.js:** anything prefixed `NEXT_PUBLIC_` is public.

If an AI agent (or tired human) puts an API key behind that prefix, the key ships to everyone who
opens the page. Quiet variants: a `.env` file left in the deployed folder, or a key pasted into
source "just to get it working".

## Check 1 — grep the build output, not your source

Your source can look clean while the built bundle leaks. The bundle is what the browser gets:

```bash
npm run build
grep -r "sk-live" dist/ || echo "no live Stripe key in bundle"
grep -r "sk-" dist/ | head -20
grep -ri "api[_-]key" dist/ | head -20
```

Any hit is a leak, full stop — regardless of whether the key "looks" unused.

## Check 2 — see what your server actually serves

Bots scan the internet for `/.env` constantly:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://your-app.com/.env   # must print 404
curl -s https://your-app.com/.env | head -5                           # must print nothing
```

If either shows file contents, fix the deployment before anything else. Repeat for `.env.local`,
`config.json`, and backup files in the public folder.

## Check 3 — hard caps on every key (blast-radius control)

A leaked key with no limit is an open wallet; with a $20 hard cap it's an embarrassing afternoon:

- **OpenAI / any LLM provider:** hard monthly spending limit, not a soft alert.
- **Stripe:** publishable key (`pk_`) in the browser, `sk_live_` server-side only; use restricted
  keys with minimal permissions instead of the full secret key.
- **Email/SMS providers:** daily sending cap so a stolen key can't burn your domain reputation.

Caps don't prevent leaks — they limit the blast radius, the only part controllable after the fact.

## Check 4 — rotate anything ever exposed

If a key was ever in a frontend bundle, public repo, screenshot, or chat log, treat it as
compromised:

1. Create a new key with the same permissions.
2. Update server-side configuration to use it.
3. **Delete the old key** — do not just stop using it.
4. Audit the provider's usage logs for calls you did not make.

Unsure whether it was exposed? Rotate anyway: minutes versus someone else's bill.

## The structural fix: keys never touch the browser

```js
// DON'T — the key is visible to every visitor:
const res = await fetch("https://api.openai.com/v1/chat/completions", {
  headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}` },
});

// DO — the browser talks to your server; the key stays server-side:
const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message }) });
```

The `/api/chat` endpoint (Supabase edge function, Vercel serverless function, small Express route)
holds the key, validates the request, and proxies to the provider. Two habits make it stick:
**secret scanning in CI** (gitleaks or GitHub secret scanning catches keys at commit time) and
**separate keys per environment** (dev/staging/prod — when one leaks, rotate one, not everything).

## The lesson beyond keys

The failure mode is invisible to the person shipping: the agent built what it was asked to build,
and security review was never in the prompt. Building got faster; **the review did not shrink — and
it is still your job.**

## References

- [Original article (dev.to, zhuanxyz)](https://dev.to/zhuanxyz/before-you-ship-that-vibe-coded-app-run-this-10-minute-secrets-audit-hbb)
- [Vite env variables and prefixing](https://vite.dev/guide/env-and-mode)
- [Next.js environment variable prefixes](https://nextjs.org/docs/app/guides/environment-variables)
- [gitleaks](https://github.com/gitleaks/gitleaks)
