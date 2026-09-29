---
title: Feature Flags Are Not Authorization — Keeping Rollout and Access Control on
  Separate Layers
diataxis: Explanation
domain: security-privacy
topic: web-security
source: DEV.to Tech News
source_url: https://dev.to/authbyexample1/feature-flags-are-not-authorization-3ld1
date: 2026-09-29
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# Feature Flags Are Not Authorization — Keeping Rollout and Access Control on Separate Layers

A common pattern: ship an admin screen or a beta API behind a flag. Flip it off in production for most users, flip it on for a few accounts, ship, move on. That controls **product exposure**. It does not control **who is allowed to do the thing** — and mixing the two layers is how "hidden" endpoints stay callable.

## What flags actually decide vs what authorization decides

A flag answers questions like:

- Is this feature ready for this cohort?
- Should we show the new UI in staging?
- Are we ramping to 10% of traffic?

Authorization answers different questions:

- Is this principal allowed to perform this action on this resource?
- In this tenant?
- Right now, with attributes that still hold?

Those are not the same layer. A flag is a rollout decision about *visibility*; authorization is an access decision about *permission*. The failure mode is letting one pretend to be the other.

## How it breaks in practice

**Direct calls.** The UI respects the flag — the client hides the button. But the API still accepts `POST /admin/export` if the handler only checks "is the flag on?" or worse, checks nothing because "the UI is gated." Hiding a button is not an access control; it is a rendering decision.

**Wrong environment / wrong targeting.** Someone enables `admin_v2` for an internal test cohort. Targeting rules are broader than expected. Suddenly half of staging — or a production segment — can hit privileged routes that never had a real authz check.

**Fail-open on outage.** Flag evaluation fails (timeout, SDK error, misconfig). The code path defaults to "show feature" or "allow request" so the app does not look broken. Privileged actions become available to anyone who can reach them — an availability choice silently became a security decision.

**Flags as pseudo-roles.** `is_beta_admin = true` starts as a rollout toggle and slowly becomes the only gate. There is no audit trail of grants, no revocation story, no resource-level scope — just a boolean that means "trust me."

## Put authz on the handler

Gate the handler with a real authorization decision: role, attribute, or relationship check against the resource. Return 403 when the principal is not allowed — **even if the flag is on for them**. Use the flag only for rollout: whether to register the route in this deploy, whether to show the UI entry point, whether a cohort is in the experiment. Never: whether the request is authorized.

A useful decision table combining both layers:

| Flag | Authz | Result |
| --- | --- | --- |
| on | allow | proceed |
| on | deny | 403 |
| off | allow | hide / 404 / not in this release (product choice) |
| off | deny | still deny (security wins) |

If the flag service is down, **fail closed for privileged actions**. Degrade the product surface; do not open the security surface.

## A quick checklist before shipping a "flagged" admin or beta capability

1. Is there an authorization check on every mutating and sensitive read path?
2. Would a raw HTTP client with a normal user token still get denied?
3. If flag evaluation errors, do privileged paths deny by default?
4. Can you revoke access without waiting for a flag change or redeploy?

If the answer to any of those is no, the flag is doing authz work it was never designed for. Rollout toggles decide who *sees* a feature; authorization decides who *may* use it. Keep both — and do not let one pretend to be the other.

## Related notes

- [Hardening MCP: A Threat Model and Checklist](../../../how-to/securityprivacy/aiagentsecurity/howto-mcp-security-hardening.md) — capability boundaries for agent tool access
- [Kestra CVE-2026-49869 — Suffix-Match Authentication Bypass Leading to Unauthenticated RCE](explanation-kestra-cve-2026-49869-suffix-match-auth-bypass.md) — what happens when route-based authorization is the only gate

## References

- [Feature Flags Are Not Authorization (DEV.to)](https://dev.to/authbyexample1/feature-flags-are-not-authorization-3ld1)
