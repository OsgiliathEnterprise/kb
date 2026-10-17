---
title: 'Qualify Inbound Leads From the Email Domain: Four Apify Actor Steps and the
  Routing Rules They Produce'
diataxis: How-to Guide
domain: developer-tools-practices
topic: workflow-automation
source: DEV.to Tech News
source_url: https://dev.to/outricher/inbound-lead-qualification-from-the-email-domain-company-record-decision-makers-and-the-gmail-1p5d
date: 2026-10-17
keywords:
- knowledge-base
- workflow-automation
- developer-tools-practices
- how-to
---
# Qualify Inbound Leads From the Email Domain: Four Apify Actor Steps and the Routing Rules They Produce

A form fill is a *claim*. The one field the sender did not write — the domain after the `@` — is the only one you can verify without asking. A qualifier that scores the message text scores a well-written pitch as hot, because the pitch was written to be scored; a qualifier that scores the domain is harder to flatter.

This workflow runs four Apify Actors on a batch of 12 signup-form-style domains plus 10 personal mailboxes (runs of 2026-10-17, inputs included so they can be rerun), then turns the returned rows into routing rules. **Vendor note:** the author builds the `b2bsearch` Actors on Apify — treat timings and field names as their product's output.

## Step 1 — What the domain resolves to

*Company Enrichment by Domain* ([apify.com/b2bsearch/domain-to-company](https://apify.com/b2bsearch/domain-to-company)) returns the company record each domain resolves to: name, headcount (and range), industry, HQ, founding year, profile link — plus **`_matchCandidates`** when multiple records claim the domain. Batch of 12: 22 seconds, 10 resolved, 2 not.

The **gmail.com trap**: the domain *did* resolve — to a real 886-person London IT company whose profile lists gmail.com as its website, with `_matchCandidates: 10` (ten records claim it; the Actor picked the largest whose name contains it). A rule that trusts any resolved row would qualify every gmail signup as an 886-person software company. Two defenses: a **free-mail domain list in front of the step**, and `_matchCandidates` behind it. Four legitimate rows also carried candidates (2–10, subsidiaries/regional pages); when size band decides routing, check the `linkedinUrl` before believing the headcount.

The misses are free rows *with a reason*: `not_found` = "no company lists this domain as its website". A typo or fake domain is not spam, it's an **unknown** — it goes to a human with "which company?", not the bin.

## Step 2 — Who signs

*Decision Maker Email Finder by Domain* returns the top of each company, ranked founder/CEO first:

```json
{
  "domains": ["hubspot.com", "vercel.com", "..."],
  "roles": ["cxo", "founder", "vp"],
  "maxPerCompany": 2
}
```

37 seconds, 16 people at 8 companies (12 founders, 4 C-level), all rows `_freshness: updated_1y`, work-email flag on all 16, personal-email flag on 10; each row carries title, seniority bucket, `positionStartYear`, profile link. The address itself is a separate metered step — you learn who is *reachable* without paying for anyone you won't contact.

The **four empty domains are the useful part**:

| Domain | Returned | Meaning |
|---|---|---|
| gmail.com | `domain_too_broad` | "many unrelated companies list this domain as their site" — the row to branch on |
| hubspot.co | `unresolved_domain` | typo / unknown |
| formfill-demo.invalid | `unresolved_domain` | fake |
| mit.edu | `no_decision_makers` | a university has no founders/C-level in the sales sense — the Actor says so instead of returning two administrators |

If the sender's name matches one of the two rows, the lead **is** the signer; otherwise the two rows are the CC list for the first reply, with `positionStartYear` telling you whether the CEO is a 15-year founder or an arrival this year.

## Step 3 — The claim the sender made

"VP Sales" at a 35-person company is possible; at a 79-person company with no sales function on record, it's a question. *People Search* in **count mode** answers for free, several companies at once:

```json
{
  "mode": "count",
  "titleKeywords": ["sales"],
  "segments": [
    {"name": "hubspot.com", "companyDomains": ["hubspot.com"]},
    {"name": "cal.com", "companyDomains": ["cal.com"]}
  ]
}
```

18 seconds, five numbers: HubSpot 1,171, lemlist 15, Instantly 3, Cal.com 1, Resend 0. The rule is **not** "zero means lying" (a 79-person dev-tools company might just have hired sales). The rule is: a title claim at a company whose function count is zero goes to a person, not the hot queue — and the count rides along on the ticket so the person knows why.

## Step 4 — The sender with no domain

~25% of real inbound carries a personal mailbox. *Reverse Email Lookup* returns the person: current title, employer, location, career history — no contact fields unless asked. Ten addresses: 5 seconds, 9 found, 1 `not_found`. Eight matched the list's title/employer exactly.

The **dual-position trap**: the list said "Head of Sales" at an aviation company; the lookup said "Director" at a *different* aviation company, held since 2013 — both true, and the headline position is the older one. Reading only `jobTitle` routes this person to the wrong company; the row carries `experience.work` with both positions and start dates, and the one matching the sender's own words is the one to use.

## The routing rules that fall out

| Row says | Route | Why |
|---|---|---|
| `not_found` / `unresolved_domain` | human, "which company?" | a typo/unknown, not spam; the row cost nothing |
| `domain_too_broad`, or domain on your free-mail list | Step 4 on the address | the person is the key, not the domain |
| `employeeCount` outside the ICP band | nurture | the one fact the sender did not type |
| function count = 0 for the claimed title | human, count attached | not hot-queue, not spam |
| sender matches a decision-maker row | hot — the lead *is* the signer | highest-intent signal |

## Diagram

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {"id": "l1", "type": "rectangle", "x": 40, "y": 40, "width": 190, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#c4e0f2", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Inbound form\nname/title/company/domain", "fontSize": 14, "fontFamily": 1}},
    {"id": "l2", "type": "rectangle", "x": 310, "y": 40, "width": 200, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#d9ccff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Step 1: domain -> company\n(+ free-mail list, _matchCandidates)", "fontSize": 14, "fontFamily": 1}},
    {"id": "l3", "type": "rectangle", "x": 580, "y": 40, "width": 190, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#f9e0a3", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Step 2: decision makers\nfounder/CEO first, 2 per company", "fontSize": 14, "fontFamily": 1}},
    {"id": "l4", "type": "rectangle", "x": 310, "y": 180, "width": 200, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#cdeac0", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Step 3: title-claim check\nfunction count = 0 -> human", "fontSize": 14, "fontFamily": 1}},
    {"id": "l5", "type": "rectangle", "x": 580, "y": 180, "width": 190, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#f5d0d0", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Step 4: personal mailbox\nreverse email lookup", "fontSize": 14, "fontFamily": 1}},
    {"id": "a1", "type": "arrow", "x": 230, "y": 75, "width": 80, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]]},
    {"id": "a2", "type": "arrow", "x": 510, "y": 75, "width": 70, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [70, 0]]},
    {"id": "a3", "type": "arrow", "x": 410, "y": 110, "width": 0, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 70]]},
    {"id": "a4", "type": "arrow", "x": 675, "y": 110, "width": 0, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 70]]}
  ]
}
```

## References

- [Inbound lead qualification from the email domain — DEV.to](https://dev.to/outricher/inbound-lead-qualification-from-the-email-domain-company-record-decision-makers-and-the-gmail-1p5d) (primary source, vendor-authored)
- [Apify — Company Enrichment by Domain](https://apify.com/b2bsearch/domain-to-company)
- [Apify — Decision Maker Email Finder by Domain](https://apify.com/b2bsearch/domain-to-decision-makers)
- [Apify — People Search](https://apify.com/b2bsearch/people-database-search)
- [Apify — Reverse Email Lookup](https://apify.com/b2bsearch/reverse-email-lookup)
