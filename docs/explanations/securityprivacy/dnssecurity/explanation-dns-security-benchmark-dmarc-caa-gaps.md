---
title: 'The Compliance Checkbox Paradox: What a 112-Vendor DNS Security Audit Reveals
  About DMARC, SPF, and CAA Gaps'
diataxis: Explanation
domain: security-privacy
topic: dns-security
source: DEV.to Tech News
source_url: https://dev.to/riskopslab/i-audited-the-dns-security-of-112-saas-24-top-ai-companies-100-of-fintech-blocks-spoofing-3ec4
date: 2026-11-25
keywords:
- knowledge-base
- dns-security
- security-privacy
- explanations
---
# The Compliance Checkbox Paradox: What a 112-Vendor DNS Security Audit Reveals About DMARC, SPF, and CAA Gaps

A reproducible, public-DNS-only audit (Cloudflare DNS-over-HTTPS script, GitHub Action re-run weekly, 2026-11-24 snapshot) of **112 B2B SaaS + 24 AI companies** across six sectors measured five signals: **DMARC policy, SPF strictness (`-all` vs `~all`), CAA records, MX stack, and Trust Center CNAMEs** (`trust.*`, `security.*`, `compliance.*`). Headline finding: **100% of fintech enforces `DMARC p=reject`; only 45.8% of AI/LLM vendors do** — and 8 of the 13 laggard AI vendors have already paid for a Vanta Trust Center. Public DNS has no marketing department: records are enforced or they aren't.

## The reproducible check — run it yourself in three seconds

```bash
dig +short TXT _dmarc.huggingface.co
dig +short TXT _dmarc.cursor.com
dig +short TXT _dmarc.replicate.com
dig +short TXT _dmarc.stripe.com
dig +short CAA vanta.com
```

Representative returns on audit day:

```
# _dmarc.huggingface.co  -> monitor-only, apex AND subdomains
"v=DMARC1; p=none; sp=none; rua=mailto:dmarc@huggingface.co; pct=100; adkim=r; aspf=s"
# _dmarc.stripe.com      -> the fintech baseline
"v=DMARC1; p=reject; pct=100; fo=1; rua=mailto:dmarc-reports@stripe.com; ruf=mailto:dmarc-forensics@stripe.com;"
# CAA vanta.com          -> (no output) = no CAA record published
```

A subtlety the audit surfaces: **`sp=` overrides `p=` for subdomains**. `replicate.com` looks like `p=quarantine` but explicitly sets `sp=none`, leaving every subdomain unguarded. Read both tags.

## Sector results (112 vendors, 2026-11-24)

| Sector | Vendors | DMARC p=reject | DNS CAA | Public Trust Center |
|---|---|---|---|---|
| Fintech & HR (Stripe, Brex, Ramp, Mercury, Plaid, Wise, Deel, Rippling, Gusto, Carta, Paddle, Shopify) | 12 | **12/12 (100%)** | 41.7% | 75.0% |
| Productivity SaaS | 18 | 72.2% | 50.0% | 38.9% |
| Automation & GTM | 18 | 66.7% | 38.9% | 72.2% |
| Cloud & DevOps | 26 | 65.4% | 50.0% | 53.8% |
| Security & GRC | 14 | 64.3% | **28.6% (worst)** | 71.4% |
| AI & LLM | 24 | **45.8%** | 54.2% | 70.8% |

Overall: 66.1% `p=reject`, 32.1% `p=quarantine`, 1.8% `p=none` (only **Hugging Face** and **Clay**). Only 45.5% publish any CAA record. In the AI cohort only **OpenAI** and **Modal** score 100/100 (`p=reject` + SPF `-all` + CAA + Trust Center); Anthropic/Perplexity/Groq score 95 (SPF is soft-fail `~all`).

Two uncomfortable patterns:

1. **Fintech treats email spoofing like cash leaving the building** — a spoofed Stripe invoice or Mercury wire notice loses money the same afternoon, so nobody leaves DMARC half-finished.
2. **Security & GRC vendors forgot CAA**: only Snyk, Okta, 1Password, Tailscale publish CAA among 14 security vendors; all four major GRC platforms (Vanta, Drata, Secureframe, Sprinto) skipped it on their own apex.

## Why vendors buy the Trust Center before finishing DMARC

A Vanta/SafeBase Trust Center unblocks procurement questionnaires **this quarter**; moving `p=quarantine` → `p=reject` requires auditing **every forgotten HubSpot, Customer.io, Zendesk, and outbound-sales SaaS that sends mail on your domain**, or legitimate mail bounces. So the DNS ticket sits at `quarantine` indefinitely while a paid compliance portal advertises rigor. The audit doubles as a market-share census: of 70 trust subdomains detected, Vanta holds 41.4% (88.2% of AI vendors with DNS trust centers); 85.7% of the 112 route corporate mail through Google Workspace.

## Honest limits of DNS-as-security-evidence

1. **`p=quarantine` is not a compromise** — Gmail/Outlook/Proofpoint still dump unauthenticated mail to spam; teams legitimately hold at quarantine while hunting a rogue marketing subdomain with broken DKIM alignment. `p=none`, by contrast, enforces nothing — spoofed mail lands in inboxes.
2. **A 100/100 DNS score says nothing about application security** — pristine DMARC/SPF/CAA coexists fine with tomorrow's SSRF or open S3 bucket. DNS measures outer-perimeter operational follow-through, not code quality.
3. **"No trust CNAME" ≠ "no security program"** — a page at `example.com/security` is invisible to DNS probing.
4. **Still worth checking first** because once senders are inventoried, `p=reject` + a CAA record is ~15 minutes and $0. Not finishing a free, fifteen-minute hardening job is an objective (if narrow) signal about the ops backlog.

## Path to p=reject (rollout hygiene, cross-referenced)

1. Start at `p=none` (or quarantine) with `rua=` reporting active.
2. Inventory **all** legitimate senders; validate SPF/DKIM **alignment** for each (SPF alone is not enough — the From: domain must align).
3. Mine aggregate (rua) + forensic (ruf) reports until every real sender passes; watch SPF `include:` count (permerrors at >10 lookups).
4. Move to `p=quarantine`, then `p=reject` — and set `sp=` deliberately, not implicitly.
5. Treat post-reject monitoring as part of the project, not an optional chore; a new marketing tool can silently break alignment later.

## References

- Original audit write-up + dataset: [I Audited the DNS Security of 112 SaaS & 24 Top AI Companies (DEV.to)](https://dev.to/riskopslab/i-audited-the-dns-security-of-112-saas-24-top-ai-companies-100-of-fintech-blocks-spoofing-3ec4)
- Live report & CC-BY CSV/JSON: [State of SaaS & AI Vendor DNS Security Benchmark](https://qq459538565-bot.github.io/riskops-mcp-suite/reports/state-of-saas-security-2026.html)
- MCP checker (zero-dependency Node, `audit_vendor_security`, read-only): [riskops-mcp-suite on GitHub](https://github.com/qq459538565-bot/riskops-mcp-suite)
- Related in KB: [Verifying CDS/CDNSKEY Consistency](../../../examples/securityprivacy/dnssecurity/example-dnssec-cds-cdnskey-consistency-check-stdlib-python.md)
