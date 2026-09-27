---
title: Steelhead — Interleaving Partially Synchronous and Asynchronous Commit Rules
  on a Shared DAG
diataxis: Explanation
domain: system-design
topic: Distributed-Systems-Foundations
source: arXiv
source_url: https://arxiv.org/abs/2609.30163
date: 2026-09-27
keywords:
- knowledge-base
- Distributed-Systems-Foundations
- system-design
- explanations
---
# Steelhead: Interleaving Partially Synchronous and Asynchronous Commit Rules on a Shared DAG

## Overview

Dual-mode consensus protocols get the best of both worlds in theory — fast when the network is partially synchronous, still live under full asynchrony — but existing designs typically switch between modes coarsely. Steelhead (Danezis et al., UCL / ETH) composes a partially synchronous and an asynchronous commit rule **over one shared DAG**: every k-th round commits via the asynchronous rule (whose leader is revealed by a common coin *after* votes), all other rounds via the partially synchronous rule. Validators periodically replay the committed DAG under each candidate period, adopt whichever shows fewest expected message delays, and fall back to k=1 when output stalls — while the async rule on coin-rounds alone keeps the protocol live throughout.

## Problem Statement

Partially-synchronous BFT protocols (e.g., Mysticeti) are fast but stall when network conditions degrade; asynchronous ones (e.g., Mahi-Mahi) stay live but pay a latency cost even in healthy networks. Prior dual-mode designs switch between them at coarse granularity or require extra coordination traffic to agree on the mode. The question: can you interleave both commit rules round-by-round on a single DAG with **no additional messages beyond the DAG blocks themselves**?

## Key Contribution

- **Round-level interleaving**: every k-th round uses the asynchronous rule (hidden leader revealed by a common coin after votes); all other rounds use the partially synchronous rule. No message is sent to agree on the period — not even that.
- **Adaptive period selection**: each interval, validators replay the committed DAG under candidate periods and adopt the one with fewest expected message delays; k=1 fallback when output stalls. The async coin-rounds alone preserve liveness regardless of adaptation.
- **Generic composition**: works over any pair of DAG commit rules sharing a committee — instantiated with Mysticeti + Mahi-Mahi at n ≥ 3f+1, and two BlueBottle variants at n ≥ 5f+1.
- **Mechanized proofs**: safety and liveness are proven in Lean 4 (formal verification of the protocol logic).
- **Zero overhead messaging**: the only messages are the DAG blocks; coins open only on rounds that need a hidden leader.

## Technical Approach

The design layers two commit rules onto one uncertified DAG structure. The partially synchronous rule handles the common case (fast, low-latency commits when the network is healthy). Every k-th round switches to the asynchronous rule: votes are collected first, then a common coin reveals which validator leads that round — preserving liveness even if messages arrive in arbitrary order. Period adaptation is purely local: each validator simulates the committed DAG under candidate periods and picks based on observed message-delay expectations, so no coordination protocol is needed. The safety argument composes the two rules' individual guarantees; liveness follows from the async rule's coin rounds being independent of network timing assumptions.

## Results

- Simulation shows Steelhead matches the partially synchronous protocol in healthy networks (no overhead for adaptation).
- When network conditions stall the PS path, performance stays close to the pure asynchronous baseline and adapts quickly in both directions as conditions change.
- Safety and liveness established with mechanized Lean 4 proofs.

## Relevance to Our Domain

For distributed-systems foundations coverage, Steelhead is a clean example of **adaptive consensus design**: rather than picking one network model assumption, the protocol continuously estimates which regime it's in and blends commit rules accordingly — with formal (mechanized) verification that the blending doesn't break safety. Two patterns worth noting:

1. **Local adaptation without coordination** — each validator independently infers the best period from the committed DAG; no extra consensus round is needed to change modes. This "replay-and-compare" pattern generalizes to other adaptive distributed algorithms (e.g., backpressure-aware scheduling).
2. **Mechanized proofs as a deliverable** — Lean 4 proofs of safety/liveness are increasingly practical for BFT protocols; this paper's approach (proofs over the generic composition, instantiated per protocol pair) is a template worth citing when evaluating consensus implementations in production infrastructure.

## References

- Paper: https://arxiv.org/abs/2609.30163 (Danezis, De Angeli, Jovanovic, Kokoris-Kogias, Legner, Sonnino — 2026)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.30163
