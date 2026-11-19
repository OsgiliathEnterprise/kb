---
title: Telstra 2026 Outage — How an NTP Timing Loop Let One Bad GPS Card Decide the
  Year Was 2006
diataxis: Explanation
domain: cloud-infrastructure
topic: incident-response
source: HackerNews
source_url: https://www.netnod.se/blog/telstra-outage-night-network-decided-year-was-2006
date: 2026-09-19
keywords:
- knowledge-base
- incident-response
- cloud-infrastructure
- explanations
---
# Telstra 2026 Outage — How an NTP Timing Loop Let One Bad GPS Card Decide the Year Was 2006

On **8 July 2026**, a large part of Australia's largest mobile operator (Telstra) stopped working: voice calls dropped, SMS didn't arrive, and even emergency-number calls failed. The disruption spread far beyond the radio network — trains, payment terminals, ticketing systems, and EV chargers were all affected. No attack, no cut fiber, no power loss. The root cause was a **single GPS receiver in a single chassis in Melbourne** that came back from scheduled maintenance believing the year was **2006**, and the rest of the network was persuaded to agree with it.

This is a textbook case where *the protocol worked exactly as designed* but *the architecture around it did not*. The lesson generalizes to any time-dependent critical service.

## Why mobile networks are hard-depended on precise time

Modern cell protocols separate uplink and downlink by either **FDD** (each direction gets its own spectrum slice, running continuously) or **TDD** (one shared block of spectrum, alternating transmit/receive in very short intervals). TDD is more spectrally efficient — it shifts the ratio to match actual traffic — which is why most modern 5G spectrum (including Sweden's main 3.5 GHz band) is TDD.

But TDD depends on accurate time: **every cell on the same frequency must switch direction in step with every other**. A cell whose clock drifts transmits into its neighbour's receive window, so the network starts jamming itself. The industry chose to rely on time accuracy rather than spectrum allocation — a deliberate design choice that creates a hard dependency on every node agreeing about "now" within a few microseconds.

## The time-distribution architecture (2010 design)

NTP expresses its hierarchy in **strata**:
- **Stratum 0** = the reference itself (a GPS receiver, or an atomic clock).
- **Stratum 1** = a machine synchronised directly to a stratum 0 reference.
- **Stratum 2** syncs from a stratum 1 server; **stratum 3** from a stratum 2, and so on.

Telstra's 2010 design:
- Top: **stratum 1 sources at Australia's National Measurement Institute (NMI)**, the national time scale.
- Two **stratum 2** servers of Telstra's own — Sydney and Melbourne — fed from NMI.
- Three **stratum 3** servers — Sydney, Melbourne, Perth — fed by the S2s.
- Below: thousands of client nodes (handover-handling infrastructure) across a vast geography, all needing the same "now" to within microseconds.

The TAP report called this "fit for purpose." Crucially, **stratum number says nothing about accuracy** — only how many hops from a reference. A stratum 1 server with a bad time source is still a stratum 1 server.

## NTP's two defences against bad sources (and their hidden assumption)

NTP has two independent protections:
1. **Stratum weighting** — among otherwise comparable candidates, the lower stratum carries more weight; this decides which source a client settles on.
2. **Majority vote / outlier rejection** — NTP compares several sources and discards those that disagree with the rest. A single source claiming an implausible time is outvoted and dropped, regardless of how authoritative it claims to be.

Neither defence is specific to any particular disruption; together they protect against a broken receiver, a misconfigured server, or an external attack. **But both assume the sources are genuinely independent of each other.** That assumption is where the 2026 failure lived.

## The 2020 upgrade that quietly broke independence

In 2020 the mobile-core timing system was upgraded with new hardware, including a new NTP timing chassis. Two changes were introduced:

1. **Forced cross-wiring.** The new chassis could not let a stratum 2 server feed a stratum 3 server inside the same box, so the two had to be wired across each other: Sydney's S3 took time from Melbourne's S2, and Melbourne's S3 from Sydney's. In effect, instead of two independent S2 sources per site, **each site was left with only one**. The TAP report notes this degradation in redundancy was *known and accepted*.
2. **Client/server → peering mode.** The 2010 setup was really a client/server model (peering allowed only at the same stratum). The upgrade switched to **symmetric (peering) mode**, where nodes exchange time mutually and settle on whichever source the algorithms currently favour. Peering is flexible and survives loss of a source gracefully — but it means **the production topology becomes emergent rather than designed**. What you documented could quietly rearrange itself into a shape no one approved.

The report found no evidence that the resulting risk of **"timing loops"** was ever identified.

## What a timing loop actually is

A timing loop is the network equivalent of believing a rumour by asking three people who all heard it from each other — each agrees, so "it must be true." NTP works the same way: it compares several sources and discards whichever disagrees with the rest. The second defence (majority vote) protects against timing loops **only if the sources are independent**. In a loop, sources that *appear* independent are actually taking their time from each other — directly or indirectly through a shared reference.

Once a wrong value is circulating, the sources start agreeing with each other and the majority vote lands on the wrong value. The protocol worked; the architecture did not.

## The mechanism: GPS week-number rollover (why 2006 specifically)

The "year 2006" is not arbitrary — it is the signature of a **GPS week-number rollover**. GPS internally counts weeks since **January 5, 1980** in a **10-bit field**, so the count wraps every **1024 weeks (~19.7 years)**. Receivers that don't handle the wrap compute a date one epoch in the past. The generic rollover date was April 6, 2019; the specific hardware involved — the **Microchip SSU 2000** synchronization supply unit Telstra deployed in the 2020 upgrade (local vendor: Scientific Devices) — had its own rollover date of **September 18, 2022**. A vulnerable card only rolls over when power-cycled *after* that date, and the rollback is 1024 weeks (~19.7 years) from the then-current date: when the card was power-cycled on July 8, 2026, its clock jumped back from July 2026 to **November 2006** — exactly the date the GPS card reported (Hochstein's analysis of the TAP findings report).

Crucially, a vulnerable card only rolls over **after a power cycle** — a card running continuously through the rollover date behaves fine. That is why September 18, 2022 passed with no incident: the GPS cards were idle failover sources that nobody rebooted for years. The bug stayed latent until **July 8, 2026**, when maintenance staff powered the Melbourne SSU 2000 down to replace its chassis (the backup power supply had failed) — and the un-updated GPS card woke up believing it was 2006.

## Two warnings that passed unnoticed

- **October 2025:** Melbourne's stratum-3 server kept losing connectivity to its Sydney stratum-2 source. Peering mode silently re-parented it to a **stratum-4 client of Sydney or Perth**, making Melbourne effectively stratum 5. The TAP report notes this proves **timing loops were already occurring** a year before the outage — the same emergent-topology failure mode, caught by an alarm that led nowhere.
- **January 2026:** Scientific Devices sent Telstra a **reminder about the SSU 2000 GPS firmware update** — years after it was first available. Per CEO Vicki Brady's Senate testimony, the update was *not ignored*: engineers assessed it and deferred it because, "given the design that was in place, it was not relevant because we were not using this equipment in the way that would trigger this risk," and "any software update creates a risk." Notably, another Telstra executive ("Mr Tracey" in the transcript) stated the GPS module "is not used as part of that design" — evidence that **different people held different models of the architecture**, and the failover role was invisible to the people deciding on the update.

## How the 2006 error won

When the Melbourne GPS card returned from maintenance reporting year **2006**, it was promoted into the stratum-1 tier of the local timing hierarchy. Because the topology had become a peering loop, the "independent" sources were in fact all tracing back through shared references — so the bad value propagated and outvoted the correct ones. The network's majority-vote mechanism then *confirmed* the wrong time instead of rejecting it, because the sources that should have disagreed with each other had been made to agree by the loop.

## Key takeaways for any time-dependent system

- **Stratum ≠ accuracy.** A low stratum number only counts hops from a reference; it says nothing about whether that reference is correct.
- **Majority vote assumes independence.** NTP's outlier rejection is only as good as the independence of the sources being voted on. Peering mode makes topology emergent and can silently destroy that independence.
- **Redundancy loss must be tracked, not accepted.** The 2020 upgrade knowingly reduced each site from two S2 sources to one; the compounding risk (loop + single source) was never assessed.
- **Design the target architecture first** rather than accepting what new hardware imposes. Plan replacement on a rolling cycle and fund keeping existing infrastructure healthy alongside new projects — not with leftovers.
- **Time is a critical service.** The outage happened even though NTP worked as intended; everything *around* it (architecture choices, budget cuts, low staffing, lack of monitoring/ownership/documentation) failed because no one appreciated how vital time services are.
- **Latent hardware bugs need power-cycle drills.** A rollover bug only manifests after a reboot; the only way to test dormant failover hardware is to deliberately cycle it. Vendors publish rollover notices and firmware fixes — treat an "unused" card's firmware as part of the critical path, because *someone will eventually power it on*.

## Diagram

![[telstra-ntp-timing-loop.excalidraw]]

## References
- [Netnod — Telstra outage: The night a network decided the year was 2006](https://www.netnod.se/blog/telstra-outage-night-network-decided-year-was-2006) (Sven-Christian "Svenne" Ebenhag, 2026-09-17)
- [Telstra — What we've learned from the external investigation of our July outage (TAP report)](https://www.telstra.com.au/exchange/what-weve-learned-from-the-external-investigation-of-our-july-outage)
- [Technology Audit Partners — TAP Findings for Telstra Outage (full PDF)](https://www.telstra.com.au/content/dam/tcom/dynamic-media-projects/exchange/TAPFindingsforTelstraOutage.pdf)
- [Surfing Complexity — Thoughts on the July 8th Telstra outage report](https://surfingcomplexity.blog/2026/09/12/thoughts-on-the-july-8th-telestra-outage-report/) (Lorin Hochstein, 2026-09-12 — GPS week rollover mechanics, SSU 2000 timeline, Senate testimony quotes)
- [Telstra CEO Senate Environment and Communications References Committee testimony, 17 July 2026](https://parlinfo.aph.gov.au/parlInfo/download/committees/commsen/29800/toc_pdf/Environment%20and%20Communications%20References%20Committee_2026_07_17.pdf)
