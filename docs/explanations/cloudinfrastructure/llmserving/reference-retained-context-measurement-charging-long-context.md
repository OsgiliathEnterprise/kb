---
title: Measuring and Charging for Retained Context in Long-Context LLM Services
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.24071
date: 2026-11-19
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Measuring and Charging for Retained Context in Long-Context LLM Services — Technical Reference

## Overview
Long-context LLM services bill for repeated context, but billing weights rarely reflect what that context actually contributes to answer quality. Lu, Lin, Yang & Wang provide a **three-layer measurement-and-accounting framework** and a set of hard **measured deployment constraints** for pricing retained context — explicitly *not* a validated utility estimator, but a bounded per-token accounting rule plus the physics of what discounts are sustainable.

## The Framework (lookup)
Three separated layers:
| Layer | Role |
|---|---|
| Content relevance | ground truth of what context contributes to answer quality |
| Observable proxies | what systems can actually measure (position, cache behavior…) |
| Auditable positional weights | the billing rule you can defend to customers |

## Measured Findings
- **Relevance dominates position**: context-ablation experiments show distance-decay billing families **do not beat a relevance-only baseline** — positional discounting is mostly cargo-cult.
- **Cache economics**: in a measured serving stack, cache hits cut repeated-prefix compute cost by **over two orders of magnitude at 65,536 tokens**; **cold resends constrain how deep sustainable discounts can go**.
- **Cross-provider caution**: measurements separate true cache value from **tokenisation and list-price differences** — two providers' "cheap cached tokens" may just be different tokenizers/pricing pages.
- **Billing simulations**: calibrated simulations reduce the **99th percentile of session charges by 31–42%**; however, revenue-matched nonlinear tariffs achieve similar reductions **and median charges increase** — p99 relief can be paid for by the median customer.

## Use This Reference When
- Designing or auditing long-context pricing (cached-token discounts, per-position weights).
- Deciding whether positional discount schedules have any empirical basis (this paper: they don't, vs relevance-only).
- Modeling the compute economics of prompt caching before promising customers deep cached-token discounts.

## Related
- [[explanation-kv-cache-bit-flip-silent-task-failures]] — what lives inside those cached prefixes
- [[reference-serverbench-coding-agents-serving-systems]] — serving benchmark context
- [[explanation-where-the-tokens-go-software-thermodynamics]] — what tokens actually buy, from the agent side

## Industry Pricing Anchor (enriched 2026-11-19)
Anthropic's published prompt-caching economics are the canonical real-world instance of the "auditable positional weights" layer above: **cache write costs 125% of base input price, cache read costs 10%** (a 90% discount on repeated prefix), with up to 85% latency reduction on long prompts (e.g., a 100K-token "chat with a book" prompt: 11.5s → 2.4s TTFT, −90% cost). Two sanity checks this gives the framework: (i) the 10× read discount is economically sustainable because, consistent with the paper's >100× measured prefix-compute saving at 65,536 tokens, the write surcharge (25% premium) pre-pays the expensive first pass — the paper's "cold resends constrain discount depth" is exactly why providers charge *more* for cache writes rather than making caching free; (ii) providers advertise a **flat** per-token cached discount, not positional weights — matching the paper's finding that positional discount families don't beat a relevance-only baseline, so nobody has shipped defensible position-based pricing.

## References
- Paper: https://arxiv.org/abs/2611.24071
- Primary class: cs.PF (also cs.CL)
- Key numbers: >100× prefix compute saving at 65,536-token cache hits; p99 charge −31–42% in simulation
- Industry anchor: Anthropic prompt caching (GA Dec 2024) — cache write +25% / cache read −90% vs base input; https://www.anthropic.com/news/prompt-caching
