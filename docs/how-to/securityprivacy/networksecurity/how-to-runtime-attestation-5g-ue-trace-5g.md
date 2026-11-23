---
title: 'TRACE-5G: Trust-Aware Runtime Attestation and Continuous Enforcement for 5G
  User Equipment'
diataxis: How-to Guide
domain: security-privacy
topic: network-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25272
date: 2026-11-23
keywords:
- knowledge-base
- network-security
- security-privacy
- how-to
---
# How to Enforce Continuous Runtime Attestation on 5G User Equipment (TRACE-5G)

## Objective
Keep a 5G user equipment (UE) under *ongoing* software-integrity verification after admission — granting full network access only while runtime attestations stay Trusted — without modifying any standardized 5G protocol.

## Context
5G-AKA authenticates subscriber credentials but verifies nothing about the UE's software integrity. Prior approaches (admission-time device-certificate authentication, TPM measured-boot attestation) confirm enrolled credentials and an approved boot state, but cannot reveal harmful unauthorized software executed *after* admission. TRACE-5G closes that post-admission gap.

## Steps
1. **Keep the existing admission gates.** Retain pre-admission certificate checks and measured-boot verification so only enrolled, correctly-booted devices enter the network.
2. **Admit into a restricted tier.** On admission, place the UE in restricted connectivity (limited access on the existing PDU session) while runtime integrity is being verified — access promotion is not automatic.
3. **Record runtime software measurements.** Run the **Linux Integrity Measurement Architecture (IMA)** on the UE to log every executed binary.
4. **Chain the measurements.** Extend IMA measurements into **TPM Platform Configuration Registers (PCRs)** so the runtime state is cryptographically accumulated and tamper-evident.
5. **Evaluate continuously.** Run a **Keylime** remote-attestation verifier on the core side that repeatedly checks the UE's TPM/IMA evidence against enrolled reference values.
6. **Bind trust state to network access.** Trusted verdict → promote to full access on the existing PDU session (Level 2). Untrusted verdict → withhold or revoke full access and trigger network deregistration; enforce via a core-side firewall.

## Expected Results (srsRAN/Open5GS testbed, hardware TPM2.0 UE)
- Across 10 trusted trials, Level 2 access was established in **9–12 s**.
- Across 10 untrusted trials, promotion was consistently withheld; in a representative trace, restrictive policy applied within **5 ms** of the Untrusted decision and UE-context release completed within **1.670 s**.
- No modification of standardized 5G protocols — the trust layer sits alongside 5G-AKA and the existing PDU-session machinery.

## Verification
Validate enforcement end-to-end: (1) trusted UE reaches full access and traffic flows; (2) execute an unenrolled binary on the UE → Keylime flips to Untrusted → confirm firewall policy application and UE deregistration timings; (3) confirm no regressions in standard attach/detach flows.

## Relevance to Our Domain
A concrete zero-trust pattern for network access: identity alone (5G-AKA, certificates, measured boot) is insufficient — continuous runtime attestation (IMA + TPM PCRs + Keylime) converts device integrity into an *enforced, revocable* network capability. The "restricted tier until proven trusted, automatic demotion on failed attestation" pattern transfers directly to enterprise VPN/Wi-Fi/NAC designs; Keylime and IMA are open-source and deployable today.

## References
- Paper: https://arxiv.org/abs/2611.25272
- Tooling: Keylime (https://keylime.dev), Linux IMA, TPM2.0
- Related: network-security notes on 5G security; cloud-devsecops attestation material
