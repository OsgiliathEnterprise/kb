---
title: How to Update Your Atlassian Cloud IP Allowlist Before 1 January 2027
diataxis: How-to Guide
domain: cloud-infrastructure
topic: networking
source: DEV.to Tech News
source_url: https://dev.to/mihai_leanzero/atlassian-cloud-ip-ranges-2027-allowlist-and-webhook-ips-ife
date: 2026-10-30
keywords:
- knowledge-base
- networking
- cloud-infrastructure
- how-to
---
# How to Update Your Atlassian Cloud IP Allowlist Before 1 January 2027

On 1 January 2027, Atlassian Cloud adds **131.162.88.0/21** to the IP ranges it uses. If your webhook receiver sits behind a firewall with a pasted list of Atlassian IPs, that list goes out of date. The change is **additive only** — nothing stops working before January, but after that date a firewall missing the new block will drop webhooks, Connect lifecycle calls, and "other requests from Atlassian to your app" that originate from it.

## The ranges to add

From the Atlassian developer changelog (posted 16 October 2026, copied into eight product changelogs including Rovo MCP and Compass):

| CIDR | Direction | Meaning |
| --- | --- | --- |
| `131.162.88.0/23` | ingress | requests **to** Atlassian (browsers, clients calling Atlassian APIs) |
| `131.162.90.0/23` | egress | requests **from** Atlassian (webhooks, Connect lifecycle calls, other outbound requests) |

**The trap:** "egress" is from Atlassian's point of view — it is *your inbound*. Your webhook firewall needs **131.162.90.0/23**. Adding the wrong half, or typing `131.162.0.0/16` because it "looks tidier", is how teams get caught.

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "r1", "type": "rectangle", "x": 40, "y": 60, "width": 240, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Atlassian cloud\negress 131.162.90.0/23\n= YOUR inbound\n(webhooks, lifecycle)", "fontSize": 13, "fontFamily": 1}}, {"id": "r2", "type": "rectangle", "x": 380, "y": 60, "width": 240, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Your app\ningress to Atlassian:\n131.162.88.0/23", "fontSize": 13, "fontFamily": 1}}, {"id": "a1", "type": "arrow", "x": 280, "y": 90, "width": 100, "height": 0, "strokeColor": "#e8590c", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [100, 0]], "text": {"content": "webhooks you MUST allow", "fontSize": 12, "fontFamily": 1}}, {"id": "a2", "type": "arrow", "x": 380, "y": 125, "width": -100, "height": 0, "strokeColor": "#868e96", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-100, 0]], "text": {"content": "your API calls", "fontSize": 12, "fontFamily": 1}}, {"id": "n1", "type": "text", "x": 40, "y": 175, "width": 600, "height": 60, "text": {"content": "Trap: 'egress' is Atlassian's word for YOUR inbound.\nWebhook firewalls need the 131.162.90.0/23 side.\n131.162.90.20/30 (Rovo crawler, egress) sits INSIDE the /23.", "fontSize": 13, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```

## Where the machine-readable list lives

The canonical file is https://ip-ranges.atlassian.com/ — Atlassian's own instruction: *"If you automate your allowlist updates from this file, no further action is required."* For a non-automated path, the **interactive allowlist tool** at https://ip-ranges.atlassian.com/tool.html lets you filter ranges by product and connection purpose (egress vs. ingress, from Atlassian's side of the connection), export the selected CIDRs as plain text/CSV/JSON, and look up which product/environment/direction a given IP belongs to.

Snapshot read on 30 October 2026: `syncToken` 1793068228, `creationDate` 2026-10-27, **173 prefixes**, four of them new:

```bash
$ curl -s https://ip-ranges.atlassian.com/ > ip-ranges.json
$ jq -r '.syncToken, .creationDate, (.items|length)' ip-ranges.json
1793068228
2026-10-27T02:30:28.885679
173
$ jq -r '.items[] | select(.cidr|startswith("131.162.")) \
    | [.cidr, (.direction|join(",")), (.product|join(","))] | @tsv' ip-ranges.json
131.162.90.20/30    egress  rovo-crawler
131.162.88.0/21 egress,ingress  confluence,forge,jira,loom
131.162.90.0/23 egress  confluence,forge,jira,loom
131.162.88.0/23 ingress confluence,forge,jira,loom
```

If you allowlist **per product**, go by the file, not the changelog: the file tags the block for Jira/Confluence/Forge/Loom, while the changelog mentions REST APIs (Jira, Confluence, Cloud Admin, Opsgenie), GraphQL (Compass, Confluence, Jira), Forge and Rovo MCP — and never Loom. The file is also the thing Atlassian tells you to automate from.

## Verification steps

1. **Diff before and after** — the new block was already in the file by 12 October, *before* the 16 October announcement, and was not there in January. Automate a diff of `syncToken`/prefix count so future additions are noticed without the announcement.
2. **Watch the stale header** — Atlassian's human-readable "IP addresses and domains" support page still says *"last updated on April 3, 2025"* even though the new block appears further down the page. Easy to read the header and conclude nothing moved.
3. **Test your own webhooks** — the author's site, tested 29 October, saw **0 of 12** webhook requests come from 131.162.* (traffic migrates over time; don't wait for traffic to prove the rule is needed — add it before January).
4. **Check IPv6 and multi-region sources** — webhooks and Automation for the same site left from **two different AWS regions within one minute**, and Automation used **IPv6** for one of two calls. A firewall that only tracks IPv4 egress will still see gaps.
5. **Know which products are NOT affected** — Email, Bitbucket, Trello, Opsgenie and Statuspage have **no 131.162 entry at all**; notification mail sources do not change.
6. **Don't confuse the two lists** — Atlassian Administration's IP allowlist (who can reach your Jira) is a *different* list from the webhook/egress ranges. Atlassian's own addresses only belong in the admin allowlist as a workaround when Automation calls back into your site.

## Action checklist

- [ ] Add `131.162.90.0/23` to the inbound/webhook firewall rule (the half that matters for webhooks).
- [ ] Optionally add `131.162.88.0/23` for client-side egress rules if you call Atlassian APIs from behind an outbound allowlist.
- [ ] If your allowlist is generated from `ip-ranges.atlassian.com`, verify the generation job actually picked up the four new prefixes (check `syncToken`).
- [ ] Verify the support-page header staleness didn't mislead a teammate into skipping the update.

## Practical implications

| If you... | Then... |
| --- | --- |
| Run a webhook receiver behind a firewall | Add `131.162.90.0/23` before 1 Jan 2027 — after that, webhooks from the new block are dropped |
| Automate your allowlist from `ip-ranges.atlassian.com` | No manual action; verify the new `syncToken` was picked up |
| Allowlist per product | Follow the machine-readable file (tags confluence/forge/jira/loom), not the changelog prose |
| Run Bitbucket/Trello/Opsgenie/Email/Statuspage integrations | No 131.162.* ranges apply to them |
| Rely on the support page's "last updated" header | Don't — it still says April 2025 |

## Related notes

- [Monitoring the Four Email DNS Records That Break Mail While Your Website Stays Up](howto-monitor-email-dns-records-mx-spf-dkim-dmarc.md) — the same class of failure: an upstream provider quietly changes the records your checks assume.

## References

- [Atlassian Cloud IP ranges 2027: allowlist and webhook IPs (DEV.to)](https://dev.to/mihai_leanzero/atlassian-cloud-ip-ranges-2027-allowlist-and-webhook-ips-ife)
- [Atlassian developer changelog — new IP address ranges](https://developer.atlassian.com/changelog/)
- [Atlassian IP ranges machine-readable file](https://ip-ranges.atlassian.com/)
- [Atlassian Cloud IP ranges — interactive allowlist tool](https://ip-ranges.atlassian.com/tool.html) — filter by product/direction, export CIDR lists, and look up a given IP's product/environment/direction from the published data.
- [Atlassian Cloud IP addresses and domains (support)](https://support.atlassian.com/organization-administration/docs/ip-addresses-and-domains-for-atlassian-cloud-products/)
