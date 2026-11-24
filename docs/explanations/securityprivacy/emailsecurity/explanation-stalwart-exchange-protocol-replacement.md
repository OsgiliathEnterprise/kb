---
title: 'Stalwart 1.2.0 as a Drop-in Microsoft Exchange Replacement: MAPI, EWS, ActiveSync
  and the Sovereignty Case'
diataxis: Explanation
domain: security-privacy
topic: email-security
source: HackerNews
source_url: https://stalw.art/blog/microsoft-exchange-replacement/
date: 2026-11-24
keywords:
- knowledge-base
- email-security
- security-privacy
- explanations
---
# Stalwart 1.2.0 as a Drop-in Microsoft Exchange Replacement: MAPI, EWS, ActiveSync and the Sovereignty Case

**Stalwart 1.2.0** (released 2026-11-23) turns the Rust mail suite into a **drop-in replacement for Microsoft Exchange**: it now implements the protocols Exchange *clients* speak — **MAPI over HTTP, Exchange Web Services (EWS), Exchange ActiveSync (EAS), and Autodiscover** — in the open-source AGPL Community edition. Users keep Outlook; the admin moves mailboxes and points DNS at Stalwart.

## Why now: the closing of on-prem Exchange

The blog's case rests on Microsoft's converging exits from on-premises mail:

- **Exchange 2016/2019 reached end of support 2025-10-14**; the paid ESU programme ended **October 2026** — those servers now receive **no fixes at all** (a standing unpatched-exchange risk, cf. historical Exchange CVE waves).
- **Exchange Server Subscription Edition is the last on-prem version** — no more major versions, no cloud features, and even its first CU slipped indefinitely into 2026.
- **New Outlook for Windows does not support on-premises Exchange accounts at all** (Microsoft's own docs).
- **EWS in Exchange Online began being switched off October 2026** and is scheduled gone by **April 2027** — integration codebases must move to Microsoft Graph or off Microsoft.
- **Data sovereignty:** email is the corpus of contracts, legal advice, HR and customer data. A US cloud provider is reachable by US authorities via the **CLOUD Act**, wherever the data physically lives — unacceptable or unappealing for public administrations, healthcare, law firms, defence contractors, many EU companies.

## What Stalwart implements (and on which port)

All served on the **same HTTPS port** as JMAP and the WebUI:

| Protocol | Detail |
| --- | --- |
| **MAPI over HTTP** | EMSMDB + NSPI, native classic-Outlook protocol; cached *and* online mode; mail/cal/contacts/tasks/notes, incremental sync, GAL + offline address book, delegates, shared mailboxes, rules, junk settings, reminders, search folders, read receipts |
| **EWS** | Schema versions Exchange 2010 SP2 → 2016; mail/cal/contacts/tasks, folders, sharing/delegates, free/busy, inbox rules, OOF, name resolution, DLs, streaming + pull notifications |
| **EAS** | 14.1 and 16.1; push via Ping, meeting responses, search, OOF |
| **Autodiscover** | POX, SOAP and JSON dialects — clients self-configure from email + password |

Client coverage: classic Outlook for Windows (2016+, incl. M365 Apps) via MAPI/HTTP + EWS; Outlook for Mac and Apple Mail/Calendar/Contacts via EWS; iOS native apps via EAS; Android (Gmail, Samsung Email, Nine) via EAS; Thunderbird (EWS + TbSync); Evolution via evolution-ews; eM Client; and tooling like `exchangelib`.

## One account, many doors

The Exchange protocols are **not a silo** — they're additional views onto the same stores: a message filed in Outlook is visible to IMAP/JMAP, a phone meeting response appears in CalDAV, an Apple Contacts entry in CardDAV. Server-side integration details worth knowing:

- **Outlook "Rules and Alerts" are stored as Stalwart mail rules and run as Sieve at delivery** — they fire with Outlook closed and for every client.
- **Delegates and folder permissions become regular Stalwart shares** (apply across protocols); shared mailboxes open from group membership.
- **Gaps vs Exchange:** no public folders, no archive mailboxes, no MDM, no RPC-over-HTTP (Outlook 2010 and earlier), **no NTLM/Kerberos** — auth is password, app password, or OAuth. Read the [official limitations list](https://stalw.art/docs/email/exchange/limitations) before a migration.

## The New Outlook trap (security-relevant)

The new Outlook for Windows refuses every self-hosted server — including real on-prem Exchange. Its apparent IMAP loophole is a **data-exposure trap**: when an IMAP account is added, **the connection to your mail server is made from Microsoft's cloud, not the user's machine** (heise/c't reporting), meaning Microsoft handles the login credentials and mail flows through its service. For a sovereignty-driven migration, new Outlook + Stalwart over IMAP defeats the entire point. Use classic Outlook, OWA-style webmail, or JMAP clients instead.

## Also in 1.2.0 / 2.0

- **Resources:** room/equipment accounts with capacity, location, and approver delegates (booking auto-accepted or manual).
- **Native FoundationDB client:** an async Rust client replaces Apple's `libfdb_c` — benchmarks: **4.5–6.9× point-read throughput, 5–7× lower median latency, ~half the CPU**; now in the standard build/Docker image.
- **stalwart-cli 2.0:** schema-driven interactive TUI console (built with Ratatui) covering accounts/domains/config/dashboard/live traces; OAuth **device flow** sign-in with session memory. Upgrade note: existing servers must **add new permissions to default roles** (see changelog).

## Takeaway

Stalwart 1.2.0 removes the last practical blocker to leaving Exchange — **the client habit** — by speaking the client protocols natively instead of forcing IMAP/CalDAV retraining. For EU public sector/regulated orgs it converts a "migrate to M365" drift into a genuine self-hosted path; for everyone else it's a hedge against the EWS sunset and the Exchange SE dead end. Evaluate against the limitations list (public folders and NTLM/Kerberos are the usual deal-breakers) and pilot with classic Outlook + one EWS integration.

## References

- [Stalwart blog: Stalwart is now a drop-in replacement for Microsoft Exchange](https://stalw.art/blog/microsoft-exchange-replacement/) (2026-11-23, Mauro D.)
- [Stalwart Exchange documentation](https://stalw.art/docs/email/exchange/)
- [Stalwart Exchange limitations vs Exchange](https://stalw.art/docs/email/exchange/limitations)
- [heise: Microsoft lays hands on login data — beware of the new Outlook](https://www.heise.de/en/news/Microsoft-lays-hands-on-login-data-Beware-of-the-new-Outlook-9608798.html)
- [Microsoft: new Outlook supported account types](https://learn.microsoft.com/en-us/microsoft-365-apps/outlook/get-started/supported-account-types)
- [Microsoft: EWS deprecation in Exchange Online](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-ews-exchange-online)
