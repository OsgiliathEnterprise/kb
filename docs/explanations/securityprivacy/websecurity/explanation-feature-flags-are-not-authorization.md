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

## The flag platform itself is a privileged control plane

The note above keeps *rollout* and *authorization* on separate layers. A second, often-missed layer: the **flag management system** that stores targeting rules is now critical infrastructure in its own right — it can toggle entire microservices, expose beta features, or act as kill switches. Industry guidance (e.g., Unleash's feature-flag security best practices) converges on treating it like a Tier-1 control plane:

- **RBAC + least privilege on the flag dashboard**: developers get write access in dev/staging and read-only in production; token generation and project creation belong to release managers. NIST SP 800-53 controls AC-6 (least privilege) and CM-3 (configuration change control) apply directly to flagging infrastructure — a single misconfigured toggle can be as impactful as a malicious code deployment.
- **Token hygiene**: separate client-side from server-side tokens; scope each token to specific projects/environments; rotate long-lived tokens and revoke on departure or repo compromise. A leaked backend token exposes targeting rules for unreleased features.
- **Network boundaries**: default `Access-Control-Allow-Origin: *` on the flag service's frontend API is a common misconfiguration — restrict CORS to your own domains, and keep evaluation traffic inside your VPC where possible (proxy/edge-evaluator).
- **Change management in production**: flipping a production flag is a release event; enforce four-eyes approval for critical environments so one person cannot silently disable a security feature.
- **Immutable audit logs** (who changed what, before/after state, timestamp, source IP) — NIST AU-2 style records that let you correlate an error-rate spike with the exact flag change that preceded it.
- **Stale flags are attack surface**: a deprecated flag left in code is a dormant path that can be reactivated by configuration manipulation; archive release toggles immediately after rollout and audit long-lived kill switches quarterly. (Unleash's write-up of the June 2025 Google Cloud incident cites remediation along the lines of "enforce all changes to critical binaries to be feature-flag protected and disabled by default" — flags increasingly treated as safety barriers, not conveniences.)
- **PII in targeting context**: flag evaluation contexts carry user attributes (email, ID, region). If you send that context to a third-party evaluator, PII leaves your trust boundary; local/edge evaluation keeps it inside.

## Related notes

- [Hardening MCP: A Threat Model and Checklist](../../../how-to/securityprivacy/aiagentsecurity/howto-mcp-security-hardening.md) — capability boundaries for agent tool access
- [Kestra CVE-2026-49869 — Suffix-Match Authentication Bypass Leading to Unauthenticated RCE](explanation-kestra-cve-2026-49869-suffix-match-auth-bypass.md) — what happens when route-based authorization is the only gate

## References

- [Feature Flags Are Not Authorization (DEV.to)](https://dev.to/authbyexample1/feature-flags-are-not-authorization-3ld1)
- [Unleash: Feature flag security best practices](https://www.getunleash.io/blog/feature-flag-security-best-practices) — control-plane RBAC, token hygiene, four-eyes change management, stale-flag risk
- [OWASP Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) — server-side enforcement requirement
