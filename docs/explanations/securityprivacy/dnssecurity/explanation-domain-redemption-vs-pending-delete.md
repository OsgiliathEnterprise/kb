---
title: 'Redemption Period vs Pending Delete: What Happens to a Domain After It Expires'
diataxis: Explanation
domain: security-privacy
topic: dns-security
source: DEV.to Tech News
source_url: https://dev.to/namedaemon/redemption-period-vs-pending-delete-3mhb
date: 2026-10-30
keywords:
- knowledge-base
- dns-security
- security-privacy
- explanations
---
# Redemption Period vs Pending Delete: What Happens to a Domain After It Expires

When a domain lapses, it doesn't go straight from "expired" to "anyone can register it". It moves through named stages, and the two that confuse most people are **redemptionPeriod** and **pendingDelete** — different names, different rules, different things you can still do.

## The stages, in order

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "t1", "type": "text", "x": 40, "y": 20, "width": 600, "height": 24, "text": {"content": "Domain lifecycle after expiry (EPP status codes)", "fontSize": 15, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}, {"id": "r0", "type": "rectangle", "x": 30, "y": 60, "width": 130, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#e9ecef", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Expired\n(registrar grace period)", "fontSize": 12, "fontFamily": 1}}, {"id": "r1", "type": "rectangle", "x": 190, "y": 60, "width": 150, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#ffec99", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "redemptionPeriod\n~30 days\nRESTORABLE (fee)", "fontSize": 12, "fontFamily": 1}}, {"id": "r2", "type": "rectangle", "x": 370, "y": 60, "width": 150, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "pendingDelete\n~5 days\nNOT restorable", "fontSize": 12, "fontFamily": 1}}, {"id": "r3", "type": "rectangle", "x": 550, "y": 60, "width": 130, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Dropped\nanyone can\nregister", "fontSize": 12, "fontFamily": 1}}, {"id": "a0", "type": "arrow", "x": 160, "y": 100, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a1", "type": "arrow", "x": 340, "y": 100, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a2", "type": "arrow", "x": 520, "y": 100, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "n1", "type": "text", "x": 40, "y": 170, "width": 640, "height": 40, "text": {"content": "During both redemptionPeriod and pendingDelete: the name is NOT in the zone.\nSite/email are down, and nobody else can register it yet.", "fontSize": 12, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```

| | Redemption period | Pending delete |
| --- | --- | --- |
| Can the **owner** restore it? | **Yes**, for a fee | **No** — paying now changes nothing |
| Typical length | ~30 days | ~5 days |
| Registry status | `redemptionPeriod` | `pendingDelete` |
| Does the name **work**? | Usually not | No |
| What's next | Pending delete | **Dropped** — anyone can register it |

## What "redemption period" actually means

After the registrar's own grace period ends, the name enters `redemptionPeriod`. During this window:

- **The site and email are usually down** — the name is not in the zone anymore.
- **Nobody else can register it** — the registry holds the name.
- **The owner can restore it**, but the registrar charges a redemption fee on top of the renewal (varies by registrar; ask — it's not standardized).
- In registry data, the EPP status reads **`redemptionPeriod`** (ICANN publishes the list of EPP status codes).

It's called "redemption" because the owner must *redeem* the name back — the registry has effectively taken it out of circulation but still gives the owner a last chance.

## What "pending delete" actually means

At the end of redemption, the name enters `pendingDelete`. During this window:

- **Even the owner cannot restore it.** The registry will delete the name when the window closes.
- **Nobody can register it yet** — it's in the queue for deletion, not yet released.
- When the window closes, the name is **dropped** and becomes available for **anyone** to register (first come, first served, often via backorders).
- In registry data, the EPP status reads **`pendingDelete`**.

## Why the distinction matters to buyers

Only the **last stage** matters if you're trying to acquire an expired name:

- If it's still in **redemption**, the current owner can still pay and keep it.
- **Pending delete** is the moment to place a **backorder** — any earlier than that risks the owner redeeming it; any later risks someone else grabbing it at drop.

## How to tell which stage a domain is in

Read the **registry** data, not the registrar's UI:

- **Registry status + expiry date + lock state** — the author's tool for this is the [Domain Health Check](https://namedaemon.com), which shows the registry status (including `redemptionPeriod` and `pendingDelete`), expiry, and lock state.
- **Drop calendars** (the author's: the [Drop Calendar](https://namedaemon.com)) list domains in both stages with an **estimated drop date**. Caveat: it's an *estimate* — the registry only exposes a last-modified time, so expect a few days of error.

## Example timeline

```
June 1      Expiry
mid-July    Registrar grace period ends -> redemptionPeriod
mid-August  ~30 days of redemption -> pendingDelete
+5 days     pendingDelete closes
~Aug 20     DROPPED: available for registration (~80 days after expiry)
```

(Dates are illustrative; each registrar has its own grace period, and the 30-day/5-day lengths are typical, not universal.)

## Practical implications

| Situation | Action |
| --- | --- |
| Your domain expired, site/email down | Check registry status: `redemptionPeriod` = contact the registrar now, ask the exact redemption fee — restoring is cheaper than losing the name |
| Status is `pendingDelete` | Nothing to do about restoration — plan for the drop instead |
| Want to acquire an expired name | Place the backorder in **pendingDelete**, not earlier; watch the drop calendar for the estimated date |
| Monitoring your own domains | Track the registry status code (not just the registrar's "expired" banner) — the EPP status tells you which clock is running |

## Related notes

- [Verifying CDS and CDNSKEY Consistency Across All Nameservers Before a DS Update, in Stdlib Python](../../../examples/securityprivacy/dnssecurity/example-dnssec-cds-cdnskey-consistency-check-stdlib-python.md) — the other side of DNS lifecycle operations: verifying state *across* nameservers before acting on it.

## References

- [Redemption period vs pending delete — what each stage means (DEV.to)](https://dev.to/namedaemon/redemption-period-vs-pending-delete-3mhb)
- [ICANN EPP status codes](https://www.icann.org/en/resources/registry-agreements/registry-agreement-annex)
- [Domain Health Check (namedaemon)](https://namedaemon.com)
- [ICANN EPP Status Codes](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) — ICANN's registry of domain status values, including `redemptionPeriod` and `pendingDelete`, with definitions.
- [What Happens When a Domain Expires (Grace, Redemption, Drop)](https://notify.domains/learn/what-happens-when-a-domain-expires/) — Practical walkthrough of the 30–90 day post-expiry cycle (registrar grace, auction windows, drop timing).
