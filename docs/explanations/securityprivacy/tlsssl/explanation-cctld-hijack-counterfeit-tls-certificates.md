---
title: ccTLD Registry Hijacks Yield Counterfeit TLS Certificates for Google and Other
  Large Services
diataxis: Explanation
domain: security-privacy
topic: tls-ssl
source: HackerNews
source_url: https://arstechnica.com/security/2026/10/hackers-obtain-counterfeit-tls-certificates-for-google-and-other-large-services/
date: 2026-10-07
keywords:
- knowledge-base
- tls-ssl
- security-privacy
- explanations
---
# ccTLD Registry Hijacks Yield Counterfeit TLS Certificates for Google and Other Large Services

Attackers hijacked **three country-code top-level domains — .gh (Ghana), .sl (Sierra Leone), and .as (American Samoa)** — and used their control of the registries to modify authoritative DNS records for selected domains within those namespaces. By controlling those DNS records, they passed automated **domain control validation (DCV)** checks and obtained unauthorized TLS certificates for "several Google domains" and "several leading global brands and widely used online services."

## The attack chain

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "h1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "compromise ccTLD registries\n(.gh / .sl / .as)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "h2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "modify authoritative DNS\nrecords + nameserver delegations", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "h3",
      "type": "rectangle",
      "x": 560,
      "y": 60,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "pass DCV checks\nobtain certs from CAs", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "h4",
      "type": "rectangle",
      "x": 560,
      "y": 240,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "cryptographic impersonation\nof affected infrastructure", "fontSize": 13, "fontFamily": 1 }
    },
    [
      {
        "id": "ha1",
        "type": "arrow",
        "x": 240,
        "y": 100,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ],
    [
      {
        "id": "ha2",
        "type": "arrow",
        "x": 500,
        "y": 100,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ],
    [
      {
        "id": "ha3",
        "type": "arrow",
        "x": 660,
        "y": 140,
        "width": 0,
        "height": 100,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [0, 100]]
      }
    ]
  ]
}
```

Key properties of the incident:

- **No domain-owner infrastructure was compromised.** The CAs that issued the certificates followed all requirements — they were doing their job correctly against a DCV check that the attackers legitimately passed. The weak link is *registry-level* control, not CA diligence.
- With DNS control, attackers could redirect traffic to counterfeit infrastructure and present browser-trusted certificates for it — enabling credential theft at scale (the same pattern as the 2011 DigiNotar hack, which minted certs for google.com and 200+ other domains).
- **Chrome blocked all identified unauthorized certificates via CRLSets** and worked with issuing CAs to revoke them. Google explicitly warned domain owners: *do not rely on browser-side intervention* — Chrome cannot guarantee it found every affected domain, and its blocks don't protect non-Chrome users.

## What domain owners should do (per Google's guidance)

1. **Monitor Certificate Transparency logs for all domains** — including parked or regional ccTLD properties. Every publicly trusted certificate must be disclosed in public CT logs; monitoring gives near-real-time alerts on unexpected issuance. If you operate a domain in .gh, .sl, or .as, review recent CT log entries for unexpected issuance right now.
2. **Publish restrictive CAA records (RFC 8659) with ACME account bindings.** CAA cannot stop issuance *during* an active DNS hijack (the attacker controls the zone), but it is a critical safeguard *after* control is restored: because CAs are permitted to cache and reuse completed DCV checks, restoring a restrictive CAA policy — especially one restricting issuance to specific authorized ACME accounts and validation methods — prevents attackers from minting new certificates using cached validation state.
3. **Do not treat browser blocks as protection.** Revocation is slow; undiscovered certificates remain a threat until revoked or blocked everywhere.

## Why this matters architecturally

- The incident confirms the long-standing asymmetry: **TLS proves you control DNS, and whoever controls DNS can mint certs** — so registry compromise converts directly into WebPKI impersonation capability.
- DCV reuse/caching is a real attack surface: validation state outlives the hijack window unless CAA (with account binding) closes it.
- CT monitoring shifts detection from "user reports phishing" to minutes-after-issuance alerts — cheap, passive, and covers lookalike domains too.

## Key takeaways

- Registry-level compromise is the highest-leverage DNS attack class: one ccTLD puts every domain under it at risk simultaneously.
- Defense-in-depth for certificate security = CT log monitoring (detection) + restrictive CAA with ACME account binding (post-hijack prevention) + not trusting browser-side blocks as your only line of defense.
- Historical precedent matters: DigiNotar 2011, and repeated CA mis-issuance incidents since — unauthorized-certificate events are a recurring threat class, not a one-off.

## References

- [Hackers obtain counterfeit TLS certificates for Google and other large services (Ars Technica)](https://arstechnica.com/security/2026/10/hackers-obtain-counterfeit-tls-certificates-for-google-and-other-large-services/)
- [Chrome's Response to Recent ccTLD Registry Hijacks (Google Security Blog)](https://blog.google/security/chromes-response-to-recent-cctld-registry-hijacks/)
- [RFC 8659: DNS Certification Authority Authorization (CAA) Resource Record](https://www.rfc-editor.org/rfc/rfc8659.html)
