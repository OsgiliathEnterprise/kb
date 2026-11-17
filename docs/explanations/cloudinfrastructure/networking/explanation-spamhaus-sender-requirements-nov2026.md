---
title: Spamhaus Sender Guidelines (November 2026) — The Minimum DNS, Authentication
  and Hygiene Bar for Any Sending IP
diataxis: Explanation
domain: cloud-infrastructure
topic: networking
source: HackerNews
source_url: https://www.spamhaus.org/sender-guidelines/
date: 2026-11-17
keywords:
- knowledge-base
- networking
- cloud-infrastructure
- explanations
---
# Spamhaus Sender Guidelines (November 2026) — The Minimum DNS, Authentication and Hygiene Bar for Any Sending IP

Starting **November 2026**, Spamhaus is gradually rolling out a hard requirement: **every sending IP must present a valid HELO, have a reverse DNS (PTR) record, and that hostname must resolve back to a matching A/AAAA record**. IPs that miss the bar go onto the CSS (Email Spam IPs) or XBL blocklists, and receivers consuming Spamhaus data will silently filter you. The guidelines are effectively the de-facto compliance spec for self-hosted mail, ESPs and any app sending transactional email.

## The five minimum requirements

1. **Confirmed opt-in (COI)** for every subscriber — no confirmation, no send. Purchased/rented/harvested lists are the top spam-trap source, and a trap hit is the fastest route to a listing.
2. **Forward-confirmed reverse DNS (FCrDNS)** for every sending IP: PTR → FQDN → A/AAAA back to the same IP. Missing/mismatched rDNS is the single most common listing trigger.
3. **HELO/EHLO hostname that resolves to the sending IP** and is *consistent* across connections from that IP. `localhost`, provider-default hostnames, or HELO values that vary between connections are read as misconfiguration, residential proxy, or malware.
4. **IPv6 allocations of at least /64 with valid reverse DNS** — consistent with RFC 6177 and M3AAWG guidance; sub-/64 sending space is treated as spammer behaviour.
5. **SPF + DKIM + DMARC on every sending domain**, with the DKIM `d=` domain aligned to the RFC 5322 header From.

## Authentication details that actually bite

- **SPF has a hard 10-DNS-lookup limit** including nested `include:` — exceeding it returns `PermError`, which is *not a pass*, so SPF can no longer satisfy DMARC alignment. Prefer `ip4:`/`ip6:` mechanisms (zero lookups) over `a`/`mx` (one lookup each); avoid macros; never use `+all`; prune `include:` entries for former providers.
- **DKIM: every outbound message signed; 1024-bit minimum, 2048-bit recommended**; rotate keys at least annually; use separate `d=` subdomains per mailstream (transactional vs marketing) so each builds its own reputation.
- **DMARC: `p=none` is a starting point, not an end state** — Spamhaus expects an enforcement policy; set the `rua=` aggregate report address from day one.
- **Envelope FROM (RFC 5321 MAIL FROM)** needs its own valid SPF pointing at the sending infrastructure; use **SRS** when forwarding so SPF still aligns; never `gmail.com`-style freemail as envelope sender; reserve the `&lt;>` null sender for DSNs/MDNs only.
- **Never bounce after accepting** — reject during the SMTP transaction. Bouncing to forged senders creates *backscatter*, counted as indirect spam.

## DNS hygiene

Audit DNS regularly: remove CNAMEs, NS delegations, A records and SPF includes for decommissioned services — **dangling records can be claimed and used to send mail that appears to come from your domain** (subdomain takeover class). No wildcard DNS records. Don't use "cousin domains" for extra mailstreams — use subdomains. Don't hide WHOIS on the root sending domain (upstream registrar reputation is factored in).

## Verification commands

```bash
dig -x <sending-ip>                          # PTR exists and is FQDN
dig TXT <helo-hostname>                      # HELO name resolves forward (A record)
dig -x <an IPv6 addr in allocation>          # IPv6 reverse DNS present
dig TXT <envelope-sender-domain>             # SPF record incl. sending IPs; count
                                             # include/a/mx/ptr/exists/redirect ≤ 10
dig TXT <selector>._domainkey.<domain>       # starts with v=DKIM1
dig TXT _dmarc.<domain>                      # starts with v=DMARC1
```

Plus: Spamhaus HELO/DNS checker on the guidelines page, email to `helocheck@abuseat.org` to see your real HELO, [bgp.he.net](https://bgp.he.net/) to confirm your IP space is actually routed (unrouted space invites BGP hijack-spoofing of your range), and the Reputation Checker at check.spamhaus.org.

## How this fits operations

This is the checklist side of email deliverability; for continuous monitoring of these exact records (MX/SPF/DKIM/DMARC drift over time) see [[howto-monitor-email-dns-records-mx-spf-dkim-dmarc]]. The new HELO+PTR+A trinity requirement means homelab and VPS operators can no longer ship mail with the hosting provider's default reverse DNS — branded rDNS is now table stakes, not a nice-to-have.

## References

- Spamhaus Sender Guidelines (primary source, Nov 2026 rollout notice): [Spamhaus Sender Guidelines](https://www.spamhaus.org/sender-guidelines/)
- ESP & large-sender addendum: [Spamhaus ESP & Large Senders](https://www.spamhaus.org/sender-guidelines/esp-large-senders/)
- RFC 6177 (IPv6 sender allocation guidance): [RFC Editor](https://www.rfc-editor.org/info/rfc6177/)
