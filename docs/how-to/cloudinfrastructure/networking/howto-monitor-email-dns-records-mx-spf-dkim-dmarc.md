---
title: How to Monitor the Four Email DNS Records That Break Mail While Your Website
  Stays Up
diataxis: How-to Guide
domain: cloud-infrastructure
topic: networking
source: DEV.to Tech News
source_url: https://dev.to/dnsnotify/email-dns-monitoring-the-four-records-that-break-mail-while-your-site-stays-up-ckl
date: 2026-09-25
keywords:
- knowledge-base
- networking
- cloud-infrastructure
- how-to
---
# How to Monitor the Four Email DNS Records That Break Mail While Your Website Stays Up

A homepage uptime check never reads the records mail depends on. Web and email share a domain name and almost nothing else: the site needs an A/AAAA/CNAME record; mail delivery and authentication need **four different public DNS records** — MX, SPF, DKIM, DMARC. When one of them breaks, Exchange can be healthy, every internal dashboard green, while customers' messages bounce.

## Step 1: Capture the four records with dig

```bash
# MX — where mail is delivered
dig example.com MX +short
# 10 mail1.example.net.
# 20 mail2.example.net.

# SPF — who may send as you (TXT at apex)
dig example.com TXT +short | grep spf1
# "v=spf1 include:_spf.google.com include:sendgrid.net -all"

# DKIM — the key that signs your mail (under selector names)
dig selector1._domainkey.example.com TXT +short
dig selector1._domainkey.example.com CNAME +short

# DMARC — what receivers do when checks fail
dig _dmarc.example.com TXT +short
# "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"
```

To find your DKIM selectors (they look like meaningless leftovers: `s1._domainkey`, `k2._domainkey`, `mte1._domainkey`): send yourself an email and read the `s=` tag in the `DKIM-Signature` header.

## Step 2: Know how each record usually breaks

- **MX** — breaks during DNS migrations (zone import drops a record, or keeps an MX for a provider you left). A dead MX doesn't bounce immediately: senders retry for days; if the host still accepts mail, it lands in a mailbox nobody reads.
- **SPF** — lives as a TXT at the apex, which collects junk from every service that ever asked for verification. Two classic breaks: cleanup deletes the SPF line with the junk, or a new tool's setup guide gets added as a *second* SPF record instead of merged into the existing one. **Two SPF records is a permanent error — receivers treat it as no SPF at all.** Mail still sends; it just fails authentication at the other end weeks later.
- **DKIM** — selector names look like leftovers and get deleted as such. The provider keeps signing with the private key, receivers can't find the public one, every signature fails.
- **DMARC** — the usual accident is a debugging session: deliverability looks bad, someone sets `p=none` to rule DMARC out, the real cause turns out elsewhere, and the policy never goes back to `reject`. Nothing visibly breaks; you've quietly stopped telling receivers to refuse forged mail. Also watch the `rua` address — if it changes to an unknown mailbox, your aggregate reports (every IP sending as you) go somewhere else.

## Step 3: Build a monitor from dig + scheduled comparison

All four are plain DNS records, so `dig` is most of a monitor already: run on a schedule, compare against expected values, alert with old vs new value side by side. Two pitfalls that produce false alarms:

1. **Query the authoritative nameservers**, not a cache — otherwise you're comparing stale data.
2. **Join split TXT strings before comparing** — SPF and DKIM values are long enough to be split into several quoted strings, and servers don't always split them identically twice.

## Step 4: Write down the four values today

The hardest part of fixing a broken SPF record is working out what it used to say. Baseline all four records (MX set, SPF line, each DKIM selector, DMARC policy + rua) before anything breaks — that baseline *is* the monitor's expected state.

## References

- [DEV.to — Catch Broken Email DNS Before Your Client Hears "Your Messages Are Bouncing"](https://dev.to/dnsnotify/email-dns-monitoring-the-four-records-that-break-mail-while-your-site-stays-up-ckl)
- [Same author — the seven false alarms to kill in DNS change monitoring](https://dev.to/dnsnotify/dns-change-monitoring-the-seven-false-alarms-i-had-to-kill-hh3)
