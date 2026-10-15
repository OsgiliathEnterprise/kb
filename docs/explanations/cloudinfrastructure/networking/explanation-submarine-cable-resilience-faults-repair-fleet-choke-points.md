---
title: Submarine Cable Resilience — Fault Causes, Choke Points, Repair Economics,
  and the Fleet Under-Investment Problem (APNIC)
diataxis: Explanation
domain: cloud-infrastructure
topic: networking
source: HackerNews
source_url: https://blog.apnic.net/2026/10/14/submarine-cable-resilience/
date: 2026-10-15
keywords:
- knowledge-base
- networking
- cloud-infrastructure
- explanations
---
# Submarine Cable Resilience — Fault Causes, Choke Points, Repair Economics, and the Fleet Under-Investment Problem (APNIC)

An estimated **1.5 million kilometres of subsea communications cable across 607 in-service systems** carries essentially all intercontinental traffic — satellites cannot replace it, and a large-scale outage would isolate whole communities. This note (from APNIC, October 2026) explains how these cables fail, why the ocean is the hard layer, how repair actually works, and why the industry's pooled-repair-fleet structure is the core resilience problem.

## How cables are built — and where they are weakest

- **Deep-sea segments** (most of the length): optical fibre plus a single thin steel thread in silicone gel, a **copper sheath that powers the cable repeaters**, wrapped in polyethylene. No armour — roughly **20 mm in diameter** (garden-hose size).
- **Shallow/coastal segments** (approaching the landing station): wrapped in additional **steel cable jacketing (armour)**, mostly to reduce vulnerability to shipping accidents.
- **Landing stations**: secured coastal facilities; siting prefers low fishing/maritime traffic and a steep rise from the seafloor — the shorter the shallow-water run, the better.

The vulnerability distribution follows the geography: cables are **most vulnerable close to shore** — shallow water, concentrated fishing, anchoring, and the landing station where every cable serving that coast comes ashore. **The deep ocean is the safest place for a cable.**

## Why cables fail

About **200 submarine cable faults are reported worldwide each year** — a number that has stayed broadly steady even as the cable inventory grows. The cables themselves are remarkably reliable; **the maritime traffic above them is the problem**:

| Cause | Share of faults |
| --- | --- |
| Fishing activity or anchoring | **~86%** (fishing ≈ 2× anchoring) |
| Geological events (landslides, seabed movement) | ~7% |
| Abrasion | ~4% |
| Component failure (repeaters) | ~4% |

Just under **half of all faults occur in territorial waters**, most of the remainder in exclusive economic zones; **only ~2% occur on the high seas** — which is why jurisdiction, not oceanography, dominates repair logistics. Under UNCLOS (1982), any physical cable activity inside the 12-nautical-mile territorial zone (or the 200/350-nautical-mile continental shelf regime) **requires the coastal state's permission**.

Two historical notes: in **August 1914** the British cable ship *HMTS Alert* hauled up and cut five German transatlantic/European cables, forcing Germany onto eavesdroppable wireless (the Zimmermann Telegram context); a similar cut of German cables to Lisbon and New York followed in **September 1939**. Deliberate severance is a standing risk category alongside geology and accidents.

## Choke points — where many cables share one route

Route objectives conflict (shortest is cheapest and lowest-latency; diverse is more resilient; deep is safer but harder to repair), and economic clustering keeps pushing cables through the same straits:

- **Bab al-Mandab Strait**: 16 cables; in **September 2025** several were severed, disrupting an estimated **25% of cable capacity between Asia, Europe, and the Middle East**. Houthi-controlled waters remain effectively ungovernable for cable protection.
- **Singapore Strait**: a major junction for **35 cable systems** in shallow water with heavy surface shipping.
- **Luzon Strait** (Taiwan–Philippines): **18 cables**; the **December 2006** earthquake and subsequent submarine landslides severed all of them and buried many under deep sediment — **11 repair vessels took 49 days** to restore all systems.
- **Black Sea**: geopolitical risk plus regulatory gaps; mine risk confirmed but no cable faults directly documented in the Ukraine war; the region is functionally inaccessible for routine maintenance.
- **Matsu Islands** (Taiwan Strait, avg. depth ~70 m): the Taima cables were **cut 27 times between 2018 and 2022**, with four major outages in 2023–2025. The **Baltic Sea** logged 11 disruptions to its cable/pipeline systems since 2023.

Cable owners also avoid politically unstable territorial waters where alternatives exist, and FCC landing constraints apply to cables touching US territory.

## How repair actually works

1. **Locate**: an optical pulse reflects at the break — distance-to-fault with considerable precision (OTDR-style).
2. **Engage a specialist cable repair ship** — then obtain the coastal state's permission to work at the fault location (recall only ~2% of outages are in international waters).
3. **The marine operation**: drag a **grapnel** along the seabed to hook the cable, cut it, recover one end and buoy it off, recover the other; **splice a new section aboard in the jointing cabin** — fibre **fusion-spliced and tested**, the joint rebuilt and sealed against pressure — then lay the repaired cable back with enough slack to reach the seabed.
4. **Cost**: **USD 500k–1M per repair**, varying with depth, location, contract terms, weather, and how long the operator waits for a vessel.

The systemic finding: **repair response times have more than doubled over the past decade**, and the **longest single repair recorded in 2023 took 947 days** — much of it waiting for permission.

## The fleet problem — the core of the resilience question

- Roughly **60 ships worldwide can repair a submarine cable**, pooled across cable owners under **five Submarine Cable Maintenance and Repair "zone" agreements**: Atlantic, North American Western Coastal, Mediterranean, South East Asia + Indian Ocean, and Yokohama (North Pacific).
- TeleGeography/Infra-Analytics analysis: **~two-thirds of maintenance vessels reach end-of-service-life by 2040**, while cable kilometres grow **~48%** over the same period. Closing the gap would take **~USD 3B and ~15 replacement ships** (plus ~5 more just to hold current service levels as the network expands).
- **Nobody obviously owns this bill.** Pooled agreements were optimized over decades to be as cheap as possible — right for a young fleet, the wrong structure for financing renewal. Adding cable routes is comparatively easy (hyperscalers fund much of it), but **no single cable is critical enough to sustain a dedicated repair fleet**, so the industry uses pooled resources that suffer from under-investment.

## How resilience actually happens today: rings to purchased redundancy

The old telephone model treated each cable as a self-contained **ring architecture** — any ring outage flowed around the other half, at the cost of ~50% carriage efficiency (paid for in the cable price). ISPs instead buy **non-backed-up capacity across multiple cable systems** and reroute on outage via the routing system. The net effect: **resilience responsibility shifted from the cable operator to the network operator** — an outage drops capacity, and elastic Internet traffic absorbs it as a performance dip rather than a shutdown.

## The decommissioning wave and consolidation

- **~25% of the world's subsea cable kilometres (~845,000 km) are projected to be decommissioned by 2030** — the late-1990s/early-2000s boom inventory reaching end of life. Already retired: **TAT-8, TAT-14** (Atlantic), **SEA-ME-WE-3** (Europe–Asia), **Japan-US**, **China-US**.
- New capacity is heavily funded by US hyperscalers: by **2028 Google is projected to own the largest cable set (by kilometres) in the Pacific, Atlantic, and Indian Oceans** — over 50% of the Indo-Pacific inventory — raising **sovereign-risk** questions for economies whose only conduits are owned by a foreign entity, and over who controls maintenance and the pooled repair fleet. The EU has begun funding repair-vessel capacity and cable surveillance as regional security; few other economies follow.

## What resilience depends on (the global checklist)

1. **Detailed, current seabed surveys.**
2. **Shipping controls** — declared **Cable Protection Zones** that prevent anchoring and seabed fishing.
3. **A distributed repair fleet** with trained crews (and the funding to replace the ageing half).
4. **Rapid clearance to operate in territorial waters** — pre-agreed emergency procedures instead of negotiating permissions *during* an outage.
5. **Route diversity** — which economic clustering actively fights, since no operator is motivated to pay for the diverse route.

The author's closing frame: none of this is technologically difficult — it is **institutionally and economically** difficult, which is harder. The "global cloud" rests on the solidity of the seabed, and is no more reliable than the conventions we collectively adopt to look after it.

## Key takeaways

- **86% of faults are maritime (fishing/anchoring), and only ~2% happen on the high seas** — cable resilience is largely a jurisdictional and enforcement problem, not an engineering one.
- **Choke points concentrate risk**: Bab al-Mandab (16 cables, 25% Asia–Europe–Middle East capacity disrupted in Sept 2025), Singapore Strait (35 systems), Luzon Strait (18 cables; 49 days to restore after 2006).
- **Repair is slow and permission-gated**: ~60 pooled vessels, response times doubled in a decade, a 947-day worst case, and a fleet whose two-thirds retires by 2040 while cable kilometres grow 48%.
- **The industry's cheapest structure (pooled, cost-optimized repair agreements) is precisely what prevents fleet renewal** — the funding gap (~$3B, ~15 ships) has no obvious owner.
- **Resilience moved from cable operator to network operator** when ISPs started buying non-backed-up capacity across many systems and failing over via routing.
- **Route diversity is the effective response, and economics works against it** — every operator optimizes the shortest, cheapest route through the same straits.

## Related notes

- `cloud-infrastructure/networking/explanation-proxmox-cluster-heartbeat-wrong-network-corosync-link0.md` — single-path dependency as a latent failure, at cluster scale
- `cloud-infrastructure/incident-response/explanation-telstra-ntp-timing-loop-incident.md` — latent infrastructure weakness becoming an incident
- `cloud-infrastructure/networking/howto-design-network-monitoring-with-sentinel.md`

## References

- [Submarine cable resilience (APNIC Blog, October 2026)](https://blog.apnic.net/2026/10/14/submarine-cable-resilience/)
- [Submarine Cable Map (Telegeography)](https://www.submarinecablemap.com/)
- [International Cable Protection Committee](https://www.iscpc.org/)
