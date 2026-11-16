---
title: Tor 0.4.9.17 — Rapid-Response Relay DoS Defense Under Circuit-Flood Attack
diataxis: Explanation
domain: security-privacy
topic: network-security
source: HackerNews
source_url: https://forum.torproject.org/t/security-release-0-4-9-17/22454
date: 2026-11-16
keywords:
- knowledge-base
- network-security
- security-privacy
- explanations
---
# Tor 0.4.9.17 — Rapid-Response Relay DoS Defense Under Circuit-Flood Attack

On 2026-11-13 the Tor Project shipped **Tor 0.4.9.17** (stable) in *rapid response* to an ongoing, sustained DDoS attack against the network. The attack floods relays with a **massive volume of client circuits**, overwhelming most relay operators network-wide. The release bundles several security fixes; the one tied to the incident is a **DoS-defense fix in IPv6 handling**.

## Why this attack class is hard to mitigate

The flood is not raw bandwidth — it is *protocol-valid-looking load*: the attacker builds enormous numbers of client circuits, which relays must allocate state for (circuit maps, queueing, crypto). The project explicitly says the problem is "not easy to address" and that **further releases with additional defenses are expected**, i.e. 0.4.9.17 is one increment in an adversarial iteration loop, not a final fix.

One specific weakness patched in this round was in how relay DoS defenses handled **IPv6** — defense logic that is correct for IPv4 can be bypassed or fail open when the same connection patterns arrive over IPv6 (separate address space, distinct rate-limiter accounting, dual-stack code paths).

## Operator guidance (what the release itself says)

- **If you run a relay, upgrade as soon as possible** to 0.4.9.17.
- **No post-upgrade action is required** — the defenses are not opt-in configuration; the fix is in the binary.
- Downloads: [dist.torproject.org](https://dist.torproject.org/), source in the [GitLab core/tor repository](https://gitlab.torproject.org/tpo/core/tor), detailed notes in the `release-0.4.9` branch `ReleaseNotes`.
- Coordination between operators happened live on the `tor-relays@` mailing list — the project called out relay-operator help as central to the response.

## Patterns worth remembering for any public-facing infrastructure service

1. **DoS defenses live in the same code path as the protocol.** A flood of legitimate-shaped requests (circuits here, API calls or handshakes elsewhere) is defended by per-workload rate accounting inside the daemon — not by upstream scrubbing alone.
2. **Dual-stack doubles the defense surface.** Rate limiters, connection caps, and circuit/ session budgets must be audited independently for IPv4 and IPv6; per-family accounting gaps are a recurring bypass.
3. **Rapid-response releases are a process, not an event.** Expect a series (0.4.9.12, .13, .15 in the preceding months; more planned after .17) with operators on a live channel — this mirrors vulnerability disclosure pipelines applied to availability incidents.
4. **Upgrade-with-no-config-change is a design goal** for volunteer-run infrastructure: anything requiring operators to hand-edit `torrc` under active attack would deploy too slowly.

## References

- [Security Release 0.4.9.17 — Tor Forum announcement](https://forum.torproject.org/t/security-release-0-4-9-17/22454)
- [Tor releases emergency security update as DDoS attack hits relays — CyberSecurityNews](https://cybersecuritynews.com/tor-ddos-attack/)
- [0.4.9.x ReleaseNotes — gitlab.torproject.org](https://gitlab.torproject.org/tpo/core/tor/-/raw/release-0.4.9/ReleaseNotes)
