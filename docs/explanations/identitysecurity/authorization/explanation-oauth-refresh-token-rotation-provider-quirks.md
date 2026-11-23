---
title: 'OAuth at Scale: Refresh Token Rotation and Provider Quirks That Break Connections'
diataxis: Explanation
domain: identity-security
topic: authorization
source: HackerNews
source_url: https://nango.dev/blog/lessons-from-operating-api-auth-for-900-apis/
date: 2026-11-23
keywords:
- knowledge-base
- authorization
- identity-security
- explanations
---
# OAuth at Scale: Refresh Token Rotation and Provider Quirks That Break Connections

"OAuth is a standard, but OAuth providers are not interchangeable." Nango (open-source
integration platform, 1,000+ APIs) learned this the hard way. This note captures the
production lessons that the RFC does not tell you.

## The incident that framed everything

In May 2025 a Nango PR introduced an `if` condition that never fired, so refreshed
credentials were never persisted to the database. It was caught and reverted in under
two hours — but during that window scheduled jobs refreshed and **discarded** access
and refresh tokens for hundreds of connections.

- For most APIs: recoverable. The old refresh token still worked; the next scheduled
  refresh repaired the connection.
- For providers that **rotate refresh tokens** (invalidate the old token the moment a
  replacement is issued — Airtable, Atlassian always; Salesforce and Slack when
  rotation is enabled): **unrecoverable**. Every affected user had to redo the full
  OAuth consent screen.

See [explanation-oauth-refresh-token-rotation-provider-quirks.excalidraw](explanation-oauth-refresh-token-rotation-provider-quirks.svg)
for the refresh flow and the two failure classes.

## Lesson 1: Token rotation makes ordinary bugs irreversible

Refresh token rotation is a security win, but a bug in the rotation path can
permanently destroy a connection. Operating rules that follow:

1. **Treat refresh tokens like money, not cache.** Persist the new token before
   anything else can fail.
2. Give the persistence path its **own regression tests** (a normal feature-test suite
   will not catch "refreshed but not saved").
3. **Serialize refreshes per connection** behind a distributed lock — concurrent
   refreshes can look like replayed/stale tokens.
4. Page on-call immediately on platform-level refresh anomalies (a spike in refresh
   failures is a data-loss signal, not just noise).

### Providers enforce rotation very differently

| Provider | Behaviour (from production experience) |
|---|---|
| Airtable | Refresh with a stale token or wrong client credentials can return 400/401 **and revoke the user's entire authorization** — only fix is user reconnection. Sending the same refresh request twice can also revoke; a short grace period exists for duplicates, but retrying the stale token after it revokes. Old access token is invalidated the instant a refresh succeeds (long-running jobs die mid-run). |
| Xero | More forgiving: if a refresh fails or the response never arrives, you may retry with the previous refresh token for up to **30 minutes**. |
| Exact Online | Access tokens last **10 minutes**, and the token endpoint **rejects any refresh attempt made more than 30 seconds before expiry**. A generic "refresh 15 minutes early" policy means *every* refresh is rejected — they had to add per-provider expiration buffers. |
| Salesforce / Slack | Rotate refresh tokens and invalidate the old one when rotation is enabled for the OAuth app. |

Corollary: even **refreshing early can be wrong**. Expiration buffers must be
per-provider configuration, not a global constant.

## Lesson 2: You cannot reliably know when access tokens expire

RFC 6749 makes `expires_in` **optional** for access tokens — a recurring source of
silent breakage:

- **Zendesk** rolled out expiring access tokens for OAuth clients (including existing
  ones), but includes `expires_in` in the token response **only if you request it**.
  Without it, the token still expires under the default policy and the response never
  says when — breakage surfaces only when rotating refresh tokens lapse.
- **Salesforce** includes no expiry at all. The documented approach is the separate
  introspection endpoint:

```http
POST /services/oauth2/introspect HTTP/1.1
Host: yourInstance.my.salesforce.com
Authorization: Basic <base64 of client_id:client_secret>
Content-Type: application/x-www-form-urlencoded

token=<access_token>&token_type_hint=access_token
```

```json
{
  "active": true,
  "scope": "id api refresh_token",
  "exp": 1549921091
}
```

Call introspection before deciding whether to refresh, rather than trusting local
expiry bookkeeping.

## Design checklist for any long-lived OAuth connection store

- [ ] New refresh token is written durably **before** the old one is considered used.
- [ ] Per-connection distributed lock around refresh (no concurrent rotations).
- [ ] Per-provider config: expiration buffer, retry window for old refresh token,
      duplicate-refresh tolerance.
- [ ] Do not assume `expires_in` exists — support an introspection-based path.
- [ ] Alert on aggregate refresh-failure anomalies (a bug in the rotation path is
      irreversible data loss for rotating providers).
- [ ] Test the *failure* paths: response lost in transit, saved-after-response crash,
      duplicate delivery. Success-path diagrams (like the one referenced above) hide
      most of the interesting cases.

## References

- Nango blog — What we learned operating auth for 1,000+ APIs: [https://nango.dev/blog/lessons-from-operating-api-auth-for-900-apis/](https://nango.dev/blog/lessons-from-operating-api-auth-for-900-apis/)
- Original incident PR and revert: [https://github.com/NangoHQ/nango/pull/3995](https://github.com/NangoHQ/nango/pull/3995)
- RFC 6749 §5.1 (expires_in optional): [https://datatracker.ietf.org/doc/html/rfc6749#section-5.1](https://datatracker.ietf.org/doc/html/rfc6749#section-5.1)
- Related: How to Apply OAuth2 Authorization Best Practices, [Decoding vs Verifying a JWT in Python](../../../examples/identitysecurity/authentication/example-jwt-decode-vs-verify-python.md)
