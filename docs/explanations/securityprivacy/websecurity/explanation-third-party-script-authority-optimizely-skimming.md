---
title: 'Third-Party Script Authority: A Trusted Origin Can Deliver Untrusted Code'
diataxis: Explanation
domain: security-privacy
topic: web-security
source: DEV.to Tech News
source_url: https://dev.to/ntctech/third-party-script-authority-a-trusted-origin-can-deliver-untrusted-code-nkj
date: 2026-11-23
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# Third-Party Script Authority: A Trusted Origin Can Deliver Untrusted Code

**Third-party script authority** is the decision about *who can change the code the browser executes on your production pages*, and what in your architecture would notice. On 2026-11-16 it was tested through Optimizely Web Experimentation: an attacker exploited a flaw in the account **signup flow**, impersonated users on targeted customer accounts, and wrote malicious JavaScript into the customer-writable **Project JavaScript field** — delivered to visitors through the trusted `cdn.optimizely.com` path. Report URI found **188 infected snippets across 178 organizations** (of 1,611 checked); first injection 04:21 UTC Nov 16; it states this was *not* CDN cache poisoning.

The core principle: **a trusted origin is a delivery authorization, not proof of executable-content integrity.**

## Three trust layers answer three different questions

| Layer | Question it answers | What it cannot tell you |
|---|---|---|
| Origin trust (CSP host allow-list) | May the browser load script from this host? | Whether what the host serves is what you approved |
| Content trust | Is this executable content what an accountable party approved? | What the content does once it runs |
| Execution restrictions (`connect-src` etc.) | What may a loaded script reach, run or send? | Whether the script is the one you intended to run |

Here the malicious code arrived *from* the approved host under the vendor's own certificate — allowing that host was never going to help. Approving a vendor script silently delegates: (1) delivery of executable code from an approved origin, (2) authority to change the content behind the delivery path, (3) your site's reliance on it as code, (4) the browser treating it as part of your page — plus (5) whoever can write that Project JavaScript field holds script authority over your production pages, changing what visitors execute **without a deployment on your side**.

## What the 256-host CSP crawl shows

Report URI crawled 256 affected organizations' own hosts and evaluated each CSP against what the payload needed (159 hosts fall in four published categories; 97 unreported):

| Category | Hosts |
|---|---|
| No CSP at all | 68 |
| Policy allowed payload **and** data theft | 50 |
| Payload ran; `connect-src` blocked the theft; in-page address swapping still worked | 17 |
| Payload blocked by restrictive `script-src` | 24 |

Two settings that let the payload through: `'strict-dynamic'` and `'unsafe-eval'` via an inline fallback. Treat this as an observation about *these* policies and *this* payload, not a protection rate — but the layers separate in practice: host allow-listing couldn't distinguish malicious from approved content, `connect-src` stopped only the exfiltration leg, and only restrictive `script-src` blocked execution.

## What the sources do and don't establish

Keep vendor and observer accounts separate: Optimizely says the flaw was closed within three hours, code removed from all affected projects, "not a credentials breach", "<5% of customers impacted" (no denominator given). Report URI says how write access was obtained is unknown and the true count is likely higher than 178. An approval decision should leave a record someone else can challenge — the authority boundary is the customer-writable code field, analogous to workflow-file write access in CI.

## References

- [Third-Party Script Authority (DEV.to / rack2cloud)](https://dev.to/ntctech/third-party-script-authority-a-trusted-origin-can-deliver-untrusted-code-nkj)
- [Report URI: World's Largest Brands Infected With Malware Via Optimizely](https://blog.report-uri.com/worlds-largest-brands-infected-with-malware-via-optimizely/)
- [Optimizely Service Status: Web Experimentation Security Incident](https://status.optimizely.com/incidents/ftw0fh9wx43z)
- Related in KB: [Pre-consent tracker leaks via gtm sendBeacon](explanation-preconsent-tracker-leaks-gtm-sendbeacon.md) · [Third-Party JS Supply Chain: the Optimizely campaign and why CSP is the missing control](explanation-third-party-js-supply-chain-optimizely-csp.md) (incident forensics: IOCs, loader variants, defense checklist)
