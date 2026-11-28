---
title: 'DéjàVu: Plurality Consensus by First Repetition'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.34534
date: 2026-11-28
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# DéjàVu: Plurality Consensus by First Repetition

**Authors:** Niccolò D'Archivio, George Giakkoupis, Frédéric Giroire, Emanuele Natale

## Overview
DéjàVu (arXiv:2611.34534) is a strikingly minimal protocol for *plurality consensus* — getting a population of agents to agree on the initially most-popular opinion. In each synchronous round an agent samples one uniformly random peer and adopts the first opinion it sees **twice**, then wipes its memory. No counters, no population size, no knowledge of how many opinions exist — just repetition detection, a capability the authors note exists even in single neurons and mirrors the psychological mere-exposure effect.

## Problem Statement
Classical opinion-dynamics protocols (e.g. $h$-majority) require agents to count sampled opinions or know parameters of the population. The question: how much coordination machinery is actually necessary to converge on the plurality opinion, and how does a purely memory-based adoption rule compare?

## Key Contribution
- A protocol whose only primitive is "adopt the first opinion observed twice, then reset memory."
- A high-probability convergence bound: with $n$ agents, $k$ initial opinions, plurality count $M_0$ and bias $\Delta_0$, if $\Delta_0 = \Omega(\sqrt&#123;M_0 \log n&#125;)$ then consensus on the plurality is reached in $O(\sqrt&#123;n/M_0&#125;\,\log(eM_0/\Delta_0) + \log\log n)$ rounds.
- A comparison result: in that bias regime DéjàVu is asymptotically never slower than $h$-majority collecting its $h$ samples one per round, for any fixed (even per-configuration-optimal) $h$ — and for some initial configurations it is asymptotically faster for every $h$.
- A technical novelty: opinion counts alone don't determine the dynamics, because each adoption depends on a hidden memory accumulated across rounds while the population changed. The authors derive the exact law of memories conditioned on the opinion/reset history and track how the plurality's advantage is distributed across *memory ages*, weighting recently-reset agents more (they are less likely to reset again soon).

## Technical Approach
The analysis treats agent memory as a hidden state coupled to the opinion process: agents with older, fuller memories reset sooner, so an advantage concentrated in "old" agents can evaporate. The proof machinery conditions the memory distribution on the observable history and follows the plurality margin through memory-age classes — one of the few rigorous multi-opinion convergence results of this kind (prior rigorous results cover only two opinions).

## Relevance to Our Domain
Population-protocol theory underpins practical gossip-based coordination, eventually-agreement heuristics, and lightweight leader/decision propagation in large fleets (service discovery, config convergence, cache invalidation broadcasts). DéjàVu shows a surprisingly weak primitive — "remember until you see it twice" — suffices for plurality decisions, which is a useful design point when agent state must stay near-zero.

## References
- Paper: https://arxiv.org/abs/2611.34534
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34534
