---
title: 'IS-IS vs OSPF: Same Link-State Core, Different Transport, Hierarchy, and Extensibility'
diataxis: Explanation
domain: cloud-infrastructure
topic: networking
source: DEV.to Tech News
source_url: https://dev.to/packetpath12/is-is-vs-ospf-which-one-should-you-learn-and-run-23f2
date: 2026-11-07
keywords:
- knowledge-base
- networking
- cloud-infrastructure
- explanations
---
# IS-IS vs OSPF: Same Link-State Core, Different Transport, Hierarchy, and Extensibility

Both are interior gateway protocols (IGPs) that keep every router holding the same map so each can compute shortest paths; BGP is the exterior counterpart. An engineer who truly knows one already knows ~80% of the other — mostly vocabulary changes, not ideas. What genuinely separates them is **three** things: how messages travel, how the map is partitioned, and how new features are added.

## The shared link-state core

1. Neighbors introduce themselves with **hello** messages and form an **adjacency**.
2. On any change (link up/down), the witnessing routers flood short update notes — **LSAs** (OSPF) or **LSPs** (IS-IS) — until every router has them.
3. Each router keeps its pile of notes in an identical **link-state database**, assigns each link a **cost**, and runs **Dijkstra SPF** to pick cheapest routes.
4. Re-running SPF after a change and settling on new routes is **convergence**.

Corollary that kills the usual argument: **neither protocol is magically faster in a normal design.** Convergence speed is set by failure detection time, flood speed, SPF timers, and map size — design and tuning choices, not properties printed on the box. If a network recovers slowly, the fix is almost never "swap the protocol".

## Difference 1 — message transport (IP vs the wire itself)

- **OSPF rides inside IP**, protocol number **89** — "the normal postal system".
- **IS-IS runs directly over the data link**, hop by hop, without IP at all. Its routers don't identify themselves by IP address but by a **NET** (Network Entity Title) from the older CLNS addressing family, e.g. `49.0001.1921.6800.1001.00`.

Why care? On the worst day of the year — when IP addressing on a link is broken or mistyped — OSPF's own messages can't cross that link: the system you'd use to fix addressing is cut off by the addressing failure. IS-IS hellos don't need IP to reach the next hop, so the adjacency stays up and the network can heal itself. The price: you must learn to read NET name tags.

## Difference 2 — partitioning the map (areas vs levels)

- **OSPF: city districts around one central station.** The map is cut into **areas**; the strict rule is that **every area must attach directly to the backbone, Area 0**, and inter-area traffic crosses it. Done well, routers keep street-level detail only for their own district. Done carelessly on day one, you've added border crossings a small network never needed.
- **IS-IS: local streets feeding one ring road.** It partitions by **level**: L1 routers know their local area in detail, L2 routers route between areas, L1/2 routers do both. The backbone is not one special area — it's simply the **unbroken chain of L2/L1-2 routers**, wherever they sit. Crucially you can skip L1 almost entirely and run one **huge flat Level 2** map; the OSPF equivalent (one giant Area 0) is tolerated far less gracefully. This is a big reason carrier backbones prefer IS-IS.

## Difference 3 — extensibility (TLVs vs new protocol versions)

Almost everything IS-IS carries is a **TLV** (type-length-value): a labelled slip — "here's what I am, how long I am, here's the fact". New facts in the world (IPv6, traffic-engineering parameters, segment-routing labels) were just **new TLV kinds**; the folder never changed. One IS-IS instance carries IPv4 and IPv6 in a single map.

OSPF's paperwork was historically bound to its numbering system: **IPv6 came as OSPFv3, a separate sibling protocol to OSPFv2**, usually run as a second parallel instance — two adjacencies, two databases, two of everything. (OSPFv3 *can* carry IPv4 on paper, but the two-instance pattern is what engineers meet in the field.) At backbone scale, IS-IS's single dual-family instance is a real operational saving.

## Smaller operational differences

- **LAN chair election:** on a shared cable, OSPF elects a **Designated Router** with a **BDR** backup; the DR is sticky once elected. IS-IS elects a **DIS** with **no backup** — and a stronger router joining later **can preempt** the DIS. Slightly different behaviour when the chair fails.
- **Learning path:** learn OSPF first (most enterprises run it, most certifications cover it); IS-IS second if you aim at carriers, cloud backbones, or HFT. Modern leaf-and-spine data centres often run neither (BGP unnumbered is the third option).

## Quick reference

| Aspect | OSPF | IS-IS |
|---|---|---|
| Transport | IP protocol 89 | Directly on the data link (CLNS) |
| Router ID for adjacency | IP address | NET (e.g. `49.0001.1921.6800.1001.00`) |
| Update unit | LSA | LSP |
| Partitioning | Areas, strict Area-0 backbone | Levels; flat Level-2 allowed |
| IPv6 | OSPFv3 (separate instance) | Native TLV, one instance |
| LAN chair | DR + BDR (non-preemptive) | DIS (no backup, preemptible) |
| Typical home | Enterprise networks | Carrier/cloud backbones |

## References

- [DEV.to: IS-IS vs OSPF — Which One Should You Learn and Run?](https://dev.to/packetpath12/is-is-vs-ospf-which-one-should-you-learn-and-run-23f2)
- [Original at Packet Path: IS-IS vs OSPF](https://allaboutitinfrastructure.com/articles/isis-vs-ospf/)

## See also in this KB

- Why ping/ICMP is a poor availability signal — the data-plane control-plane distinction that also underlies why IGP hellos are not ICMP.
