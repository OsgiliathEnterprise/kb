---
title: 'Fixing Outlook.com''s Silent DMARC Enforcement: Diagnose and Publish a DMARC
  Record'
diataxis: How-to Guide
domain: security-privacy
topic: email-security
source: HackerNews
source_url: https://mailroute.net/blog/outlook-rejecting-email-without-dmarc
date: 2026-11-09
keywords:
- knowledge-base
- email-security
- security-privacy
- how-to
---
# Fixing Outlook.com's Silent DMARC Enforcement: Diagnose and Publish a DMARC Record

Since **November 5, 2026**, Microsoft's consumer mail platforms (Outlook.com, Hotmail, Live, MSN) have been silently rejecting *some* mail from domains that publish **no DMARC record at all** — including ordinary, low-volume senders, not just the >5,000 msgs/day bulk senders covered by Microsoft's published 2025 rules. There was no announcement: no postmaster notice, no blog post, no service-health entry. Senders only see bounces.

## Why this is dangerous

Three properties make this failure mode easy to miss:

1. **Partial rejection.** Only *some* messages from an affected domain bounce. One message to a Hotmail address arrives, the next bounces, a resend may succeed. "My mail is getting through" is not evidence your domain is safe.
2. **Uninformative bounce.** The enhanced sender rules rejection (`550 5.7.515`) lists per-check results; this one does not.
3. **Silent loss downstream.** Invoices, appointment confirmations, and applicant replies vanish without the recipient ever knowing they existed.

The bounce text looks alarming but usually isn't — affected domains mostly had working SPF, and many had DKIM:

```
550 5.7.1 Message rejected: Message lacks SPF/DKIM/DMARC Auth Records (AS9031519)
```

The `(AS9031519)` code appeared on day two; day one returned the same rejection without a code. What the failing domains were missing is the **DMARC record that ties SPF/DKIM to the `From:` address** (alignment).

## Step 1 — Check whether your domain is exposed

```bash
dig +short TXT _dmarc.example.com
```

- A line starting with `"v=DMARC1` → you have a record; you are not in the targeted population.
- **No output → you have no DMARC record and are exposed.**

## Step 2 — Publish the safe baseline record

Add one TXT record at your DNS host:

| Field   | Value                          |
|---------|--------------------------------|
| Name    | `_dmarc`                       |
| Value   | `v=DMARC1; p=none`             |

`p=none` declares DMARC participation and asks receivers to send aggregate reports, but instructs them to take **no action** on failures. Nothing about how Gmail, Yahoo, or anyone else treats your mail changes.

## Step 3 — Verify alignment, the actual pass condition

DMARC passes only when **SPF or DKIM passes for the domain in your `From:` address**. A DMARC record alone does not help if neither lines up:

- Microsoft 365 signs with its own `onmicrosoft.com` domain until you enable DKIM signing for *your* domain — that signature does not count toward your DMARC.
- If you relay through a third-party smarthost, the sending service must either keep your domain as envelope sender with SPF authorization (`include:` of the relay) or DKIM-sign as your domain.

```bash
dig +short TXT example.com                      # SPF
dig +short TXT default._domainkey.example.com   # DKIM selector (varies)
dig +short TXT _dmarc.example.com               # DMARC
```

## Step 4 — Harden over time

`p=none` is now the *floor*, not a best practice. The same record is the first rung of the escalation path once aggregate reports show all legitimate sources align:

```
p=none  →  p=quarantine  →  p=reject
```

`p=reject` tells receivers to refuse mail that forges your domain — this is the actual defense against the spoofing that powers most phishing and BEC.

## Context

- Microsoft's **published** high-volume sender requirements (since May 2025) mandate SPF+DKIM+DMARC for domains sending >5,000 messages/day to Outlook.com, enforced with `550 5.7.515 Access denied`. The November 2026 behavior extends rejection to *small* senders without any published rule.
- Community reports (Microsoft Q&A, Spiceworks) confirm the same `AS9031519` bounce from Microsoft 365 tenants, sometimes alongside `5.7.23`, and note that a missing DMARC record is a strong but not exclusive correlation.
- This follows the pattern every major mailbox provider has set: requirements start with bulk senders, get announced with a deadline, then quietly become the baseline for everyone.

## See also

- [outlook-dmarc-enforcement.excalidraw](outlook-dmarc-enforcement.svg) — diagnosis and fix flow.
- Related KB notes: [howto-monitor-email-dns-records-mx-spf-dkim-dmarc](../../cloudinfrastructure/networking/howto-monitor-email-dns-records-mx-spf-dkim-dmarc.md) (continuous monitoring of the four records) and howto-email-web-entry-point-hardening (defensive hardening).

## References

- [Outlook.com Is Quietly Rejecting Email From Domains Without DMARC — MailRoute](https://mailroute.net/blog/outlook-rejecting-email-without-dmarc)
- [Fix Outlook.com 550 5.7.1: Message lacks SPF/DKIM/DMARC Auth Records — MailRoute docs](https://mailroute.net/docs/admin/outlook-message-lacks-spf-dkim-dmarc-auth-records)
- [Strengthening the Email Ecosystem: Outlook's New Requirements for High-Volume Senders — Microsoft Tech Community](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)
- [Microsoft Now Requires DMARC, Even for Low-Volume Email Senders — URIports](https://www.uriports.com/blog/microsoft-now-requires-dmarc-even-for-low-volume-email-senders/)
