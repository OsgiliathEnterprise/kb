---
title: 'Post-Quantum Migration of Wi-Fi Key Establishment: A Hybrid ML-KEM Design
  for OWE and FILS, Validated on OWE with hostapd'
diataxis: How-to Guide
domain: security-privacy
topic: network-security
source: arXiv
source_url: https://arxiv.org/abs/2611.21528
date: 2026-11-17
keywords:
- knowledge-base
- network-security
- security-privacy
- how-to
---
# Post-Quantum Migration of Wi-Fi Key Establishment (Hybrid ML-KEM for OWE/FILS)

## Overview

Wi-Fi key agreement rests on Diffie–Hellman, which a capable quantum computer breaks — and "harvest now, decrypt later" makes today's associations tomorrow's plaintexts. Key establishment is therefore the part of IEEE 802.11 that must migrate **first**. This paper designs and validates a hybrid exchange for the two in-frame key-agreement protocols — **OWE** (encrypts otherwise-open networks) and **FILS** (fast initial link setup for dense/mobile deployments) — and ships a working prototype on hostapd/wpa_supplicant.

## When to use this

You run open or high-density Wi-Fi (OWE/FILS) and need quantum-resistant key establishment without extra round trips or AP/station firmware rewrites beyond hostapd/wpa_supplicant.

## Procedure

1. **Replace the Diffie–Hellman exchange with a hybrid one**: run the classical elliptic-curve agreement *alongside* **ML-KEM (FIPS 203)**; derive the master key from **both** secrets, so protection holds as long as either component is unbroken.
2. **Reuse existing frames**: the exchange piggybacks on the frames OWE/FILS already send — no additional round trip is introduced.
3. **Pick the parameter set**: use the **intermediate ML-KEM parameter set** (best security/size balance of the three); with the two smaller sets, even the enlarged association frame fits a single frame under a conservative **1500-byte fragmentation threshold**.
4. **Advertise hybrid mode on the AP** alongside classical OWE for interop.
5. **Enforce on the station side**: configure the client to *require* post-quantum — it refuses to associate unless the PQ exchange completes.
6. **Validate**: confirm both endpoints derive the same master key on every connection; check added connection time and computation (measured **below 0.5 ms**).

## Caveats / limits

- Validation was performed on **OWE**; the design carries over to FILS, but FILS's frame budget is left for future measurement.
- **Capability-to-key binding** (binding advertised capabilities to the derived key, to prevent downgrade) is specified as a design extension but is **not part of the prototype** — treat downgrade resistance as an open engineering item.

## Relevance to Our Domain

Wireless is usually last in PQC migration plans; this paper argues (with a working hostapd prototype) that it can start now, using the same hybrid FIPS 203 pattern already used for TLS. Useful playbook for our network hardening backlog and for vendors' PQC roadmaps.

## References

- Paper: https://arxiv.org/abs/2611.21528 (cs.CR, cs.NI — Abascal, Gómez, Gómez-Pérez; 8 pp.)
- Related: `security-privacy/tls-ssl/`, `explanation-tor-0-4-9-17-relay-ddos-defense.md`
