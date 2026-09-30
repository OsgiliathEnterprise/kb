---
title: Cloudflare Becomes a Public Certificate Authority — GlobalSign Root, ACME+ARI,
  and Merkle Tree Certificates
diataxis: Explanation
domain: security-privacy
topic: tls-ssl
source: HackerNews
source_url: https://blog.cloudflare.com/cloudflare-certificate-authority/
date: 2026-09-30
keywords:
- knowledge-base
- tls-ssl
- security-privacy
- explanations
---
# Cloudflare Becomes a Public Certificate Authority — GlobalSign Root, ACME+ARI, and Merkle Tree Certificates

During Birthday Week 2026 (Sept 29), Cloudflare announced its intent to become
a **publicly trusted certificate authority** — after more than a decade as one
of the largest *consumers* of publicly trusted certificates without issuing a
single one. Three concrete milestones: applications for inclusion in the
Chrome, Apple, Microsoft, and Mozilla root programs; a definitive agreement to
acquire an established GlobalSign root (trusted since 2012); and plans to be
among the first CAs to issue production **Merkle Tree Certificates (MTCs)**,
targeting Chrome's Quantum-resistant Root Program with first MTCs in Q1 2027.

## Two paths to trust: old root for reach, new root for policy

A brand-new root is not widely useful for years — it must propagate through OS
and browser update channels and never reaches the long tail of unupdated
devices (where a large share of traffic originates). Cloudflare's answer is
both:

- **Acquired GlobalSign root** (trusted since 2012) → day-one reach across
  legacy devices.
- **New root submitted to root key programs** → standing under future policies,
  including programs that are starting to cap how old a trusted root may be.

The stated motivation is systemic risk: Let's Encrypt issues ~10M certificates
a day for 500M+ sites (4B+ active in 2025). If the dominant free CA "had a bad
week," much of the web has no comparable free automated alternative. Cloudflare
already ships every Universal SSL certificate with a backup cert from a second
authority — this is that redundancy idea at Internet scale.

## ACME-first, ARI-mandatory

- Issuance and renewal will be **ACME-only** (the open standard most free CAs
  already use) — migrating means changing a directory URL, no new tooling.
- Cloudflare's ACME infrastructure will be a **fork of Boulder** (Let's
  Encrypt's ACME software), tracking upstream MTC support.
- **ACME Renewal Information (ARI, RFC 9773) is a condition of issuance**:
  subscribers must poll the renewal endpoint, act on published renewal windows,
  and identify the certificate being replaced. This lets Cloudflare bring
  renewal windows forward for affected certificates when revocation or
  compliance events occur — spreading replacements across available time
  instead of choosing between timely revocation and keeping subscriber sites up.

## Merkle Tree Certificates: "don't log what you issue, issue by logging"

MTCs (IETF PLANTS working group draft, co-authored by Cloudflare) batch
certificates into an **append-only Merkle tree**; the CA signs the *root* of
the tree instead of many individual certificates. Clients verify a certificate
with a compact **inclusion proof** against a signed tree head rather than
validating each certificate's signature individually — critical for a
post-quantum world where traditional chains grow large enough to strain TLS
handshakes.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "m1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "ACME request\n(domain control check)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "m2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "append-only log\n+ Merkle tree checkpoint", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "m3",
      "type": "rectangle",
      "x": 560,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "mirroring cosigner\n(append-only consistency)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "m4",
      "type": "rectangle",
      "x": 300,
      "y": 260,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MTC = cosignatures\n+ pubkey + inclusion proof", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "ma1",
        "type": "arrow",
        "x": 240,
        "y": 105,
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
        "id": "ma2",
        "type": "arrow",
        "x": 500,
        "y": 105,
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
        "id": "ma3",
        "type": "arrow",
        "x": 400,
        "y": 150,
        "width": 0,
        "height": 110,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [0, 110]]
      }
    ]
  ]
}
```

### Landmark-relative certificates (the performance win)

Standalone MTCs still send large PQ signatures over the handshake. The real
gain is **landmarks**: CAs designate subtrees covering all active certificates
and distribute them out-of-band via an update service. During TLS, the client
checks that the server's cert data appears in a trusted subtree whose inclusion
proof connects to a cosigned landmark — then the public key proves possession.

- Common case: handshake transmits **one public key + one signature + one
  inclusion proof &lt; 1 kB**.
- A small set of MTC batch signatures covers billions of certificates.
- Standalone certs remain as fallback for newly installed/offline clients.
- Transparency scaling changes too: the log carries only hashes of public keys
  (no per-entry signatures); the tree-head signature covers the whole log, and
  consumers fetch a single copy of each certificate — preventing certificate
  explosion.

Chrome's Quantum-resistant Root Program draft policy mandates **at least two
cosignatures**: one from an independent Mirroring Cosigner operated by a
distinct organization, plus one from the issuing CA itself. Cloudflare will
operate mirrors for other pilot CAs and require at least one independent
cosignature on its own issuance.

## Design commitments: "fail small"

- Recovery designed and tested *before* incidents; renewal automation as a
  condition of issuance (ARI).
- Revocation handled by bringing forward renewal windows and tracking
  replacement issuance, not hard revocation that breaks subscribers.
- Reproducible builds, attested hardware security modules, public incident
  dashboard (per the press release).

## Timeline and open questions

| When | What |
| --- | --- |
| Sept 29, 2026 | Root program applications + GlobalSign root agreement disclosed |
| ~Q4 2026 | GlobalSign acquisition expected to close (two months out) |
| After root acceptance | Classic certificate issuance begins |
| Q1 2027 | First production MTCs, targeting Chrome's Quantum-resistant Root Store |

Open questions the announcement leaves: which specific GlobalSign root is
involved, price, whether transfer needs root-program consent, how far along the
IETF MTC draft actually is (IETF work typically takes years), and which ACME
clients meet the ARI requirement. Context from Cloudflare's annual review: PQ
key agreement reached 52% of TLS 1.3 traffic by Nov 2025; full post-quantum
security across their systems targeted for 2029, framed around a quantum
computer able to break deployed RSA/ECDSA sizes possibly existing by 2030.

## Key takeaways

- The WebPKI's single-point-of-failure problem (one dominant free CA) is being
  addressed by the largest certificate *consumer* becoming an issuer — with
  redundancy as the explicit design goal.
- ARI-mandatory issuance converts revocation from a cliff into a managed,
  spread-out renewal wave — a pattern other CAs may copy.
- MTCs shift trust anchoring from per-certificate signatures to signed tree
  heads + inclusion proofs; transparency becomes a requirement of operation
  rather than an add-on (CT-style logging built into issuance).
- For operators: nothing changes today, but the ACME directory URL is now a
  strategic configuration point — and ARI support in your automation stack
  will be required to use this issuer.

## References

- [Building a certificate authority for the whole Internet — Cloudflare Blog](https://blog.cloudflare.com/cloudflare-certificate-authority/)
- [Building a post-quantum certificate authority with Merkle Tree Certificates (companion post)](https://blog.cloudflare.com/pq-ca-with-mtcs/)
- [Cloudflare press release: Public CA for the Post-Quantum Web](https://www.cloudflare.com/press/press-releases/2026/cloudflare-announces-public-certificate-authority-for-the-post-quantum-web/)
- [ACME Renewal Information — RFC 9773](https://www.rfc-editor.org/info/rfc9773)
