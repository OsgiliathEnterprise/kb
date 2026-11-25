---
title: 'Fresh Keys, Stale Secrets: Numeric Leakage across Linked LLM Prompts'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.32864
date: '2026-11-25'
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# Fresh Keys, Stale Secrets: Numeric Leakage across Linked LLM Prompts
**Authors:** Jian Li, Qinglin Zhao, Shuoyao Wang, Jincheng Cai, Zhifeng Hao, Naiqi Wu
## Overview
Small businesses repeatedly ask cloud LLMs about the same confidential numbers — prices, unit costs, margins — usually "disguised" by per-query transformations. This paper shows the disguise literature's blind spot: protections are evaluated **one prompt at a time**, but the provider sees the whole query history, and each fresh disguise of the same underlying number gives an attacker another independent view of it. Against an honest-but-curious provider that knows the disguise algorithm and holds sector-level price/margin statistics, linking a firm's queries dramatically amplifies recovery.
## Problem Statement
Numeric prompt-disguise schemes (order-preserving substitutions, Prϵmpt-style sanitizers) claim safety per prompt. But repeated consultations about stable business economics create a longitudinal privacy risk the per-prompt evaluations never measure — and real costs aren't public, so the attack needs a synthetic-firm measurement methodology.
## Key Contribution
- **Cross-query attack model**: honest-but-curious provider that knows the disguise algorithm, holds sector priors, and links a firm's query history.
- Measurement on **synthetic firms with known ground-truth values** — since real confidential costs aren't observable.
- Per-prompt vs. linked-query contrast: a single fixed-axis scaling keeps the attacker's margin-hit advantage within −0.6 to +4.4 points over a prior-only guess; after **16 linked queries with fresh secrets**, every tested disguise leaks significantly more — under the order-preserving substitution, margin recovery jumps from **25.0% to 59.4%**.
- **Mechanism explained theoretically**: one *reused* secret bounds all queries by a single full-precision view of each field, whereas *fresh* scaling keys are themselves identifiable — the same attacker recovers **29.4 points more margins with fresh maps than with one reused map**. "Freshness" of the disguise is actively harmful.
- Robustness: except Prϵmpt at ϵ = 0.5, gains persist when the attacker's prior comes from a different population model and when true values drift up to 5% between queries; prose-cue extraction adds at most 2.5 points on weak-cue firms.
## Technical Approach
The evaluation constructs synthetic firms with known prices/costs/margins, applies each disguise scheme (Zhang et al.-style order-preserving substitution, Prϵmpt sanitizers at various ϵ, per-field scaling), and measures an attacker pipeline that combines sector statistics with linked-query evidence. The theoretical analysis separates the reused-key regime (single full-precision view bounds all leakage) from the fresh-key regime (keys identifiable across queries → independent views compound).
## Results
- Single prompt: disguise advantage over prior-only guess: −0.6 to +4.4 pp (essentially no protection).
- 16 linked queries, fresh secrets: order-preserving substitution margin recovery 25.0% → 59.4%.
- Fresh vs. reused maps: +29.4 pp margin recovery with fresh maps.
- Only Prϵmpt at ϵ = 0.5 resists the prior-transfer and drift stress tests.
## Relevance to Our Domain
For the KB's LLM-privacy coverage, this kills a natural intuition — "rotate the masking key each request" — and reframes numeric confidentiality as a *trajectory-level* DP problem. Any "private LLM gateway" product doing per-query numeric tokenization should be evaluated against linked-query recovery, not single-prompt tests. Code and data are public (github.com/Jamli58/fresh-keys-stale-secrets).
## References
- Paper: https://arxiv.org/abs/2611.32864
- Code/data: https://github.com/Jamli58/fresh-keys-stale-secrets
- Related: [[explanation-together-ai-prompt-leakage-agent-credential-incident]], [[explanation-dp-spd-dummy-augmented-shuffling-private-inference]], [[explanation-synthesis-smuggling-steganographic-privacy-leaks]]
