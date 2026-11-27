---
title: 'Make the Adversary Spend More: Stateful Deception as a Cost-Exchange Primitive
  for AI-Era Cyber Defense'
diataxis: Explanation
domain: security-privacy
topic: security-principles
source: arXiv
source_url: https://arxiv.org/abs/2611.34770
date: 2026-11-25
keywords:
- knowledge-base
- security-principles
- security-privacy
- explanations
---
# Make the Adversary Spend More: Stateful Deception as a Cost-Exchange Primitive for AI-Era Cyber Defense

## Overview
This paper reframes cyber deception for the LLM era: the right metric is not how *realistic* a decoy is or whether it *detects* the attacker, but the **cost exchange** it imposes — how much adversary effort it burns per unit of defender compute. LLMs cut the attacker's cost of scanning and adapting while tempting defenders into unbounded compute, so the primitive that keeps the exchange favorable is **adversary-specific persistent state**: each recognized adversary re-enters a coherent, isolated fake world consistent with its own past actions, while the LLM is used only as a constrained *renderer* of explicit state — never as its store.

## Problem Statement
LLM-assisted intrusion changes the economics on both sides: attackers scan and adapt cheaply; defenders risk paying unbounded LLM compute per decoy session. Stateless or session-merging honeypots break the illusion for a patient, adaptive adversary, forcing defenders to choose between realism (expensive) and silence (useless).

## Key Contribution
- **Cost-exchange evaluation criterion**: deception should be judged by the exchange rate it imposes, formalized as the **Deception Exchange Rate (DER)** — mission-weighted adversary effort burned divided by defender resources spent.
- **Stateful deception primitive**: per-adversary persistent state; a returning adversary re-enters the world it believes it compromised, kept coherent with *its own* action history and isolated from every other adversary's world.
- **Strict LLM discipline**: the language model only renders state explicitly held outside the model (deterministic state layer), bounding hallucination risk and cost; the LLM never stores state.
- **Defender-side cost engineering**: across five open-weight models, deterministic-layer and prompt optimizations cut per-session defender cost by **~63%** versus a naive all-LLM decoy.

## Technical Approach
The instantiation pairs **Cowrie** (SSH honeypot) with a **local open-weight LLM**. Architecture: an explicit, deterministic state store per adversary; the LLM renders responses conditioned on that state under prompt constraints; session recognition maps returning adversaries back to their isolated world. The paper specifies (but does not yet measure) per-adversary state and the adversary-side of the DER; the evaluation delivered here is defender-side cost across five open-weight models. Accepted at AD&D 2026 workshop (co-located with ESORICS 2026, Rome).

## Results
- ~63% per-session defender cost reduction vs naive all-LLM decoy, via deterministic-layer + prompt optimizations, across five open-weight models.
- DER formalization links mission-weighted attacker effort to defender spend; adversary-side measurement is future work.
- 20 pages, 4 figures, 4 tables.

## Relevance to Our Domain
Active defense and honeypot design sit in our security-principles coverage; the paper is also a case study in *cost-bounded LLM deployment* — a pattern (LLM as renderer, explicit state as store) reusable across agent infrastructure where unbounded LLM spend is the main operational risk.

## References
- Paper: https://arxiv.org/abs/2611.34770
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34770
- Related in KB: `explanation-five-principles-cybersecurity.md` (same topic)
