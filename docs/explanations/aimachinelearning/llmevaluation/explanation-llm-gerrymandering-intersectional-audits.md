---
title: 'LLM GerryMandering: Separating Interactions from Additive Effects in LLM Audits'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.26538
date: '2026-11-22'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# LLM GerryMandering: Separating Interactions from Additive Effects in LLM Audits

## Overview
This paper shows that most "intersectional bias" flagged by current LLM audits is a statistical artifact: subgroups defined by combinations of marginalised identities look anomalous simply because single-attribute effects add up. The authors quantify the failure of the standard criterion, introduce **ADDIS** (Additive Intersectional Screen) which compares each subgroup against an *additive* baseline, and audit 13 open LLMs on 10,000 synthetic Indian personas (**IndiPersona**).

## Problem Statement
Auditing intersectional subgroups (e.g. gender × caste × class) faces two obstacles: subgroup count grows **quadratically** in the number of attributes, and there is no agreed baseline for what *independent* attributes would predict. Existing audits typically flag a subgroup when its disparity exceeds each attribute's individual disparity — a condition that attributes acting **independently already satisfy**, so the criterion over-flags by construction ("gerry-mandering" the subgroup space).

## Key Findings
1. **The standard criterion is broken.** On 150 synthetic datasets generated with *no* interaction, it flags **66.1 false subgroups per dataset** on average under the raw shuffle null (at least one in every dataset); with planted interactions of known size it recovers only **32%** of them — and that 32% is measured under the *repaired* null, the same calibrated null under which ADDIS reaches 84%.
2. **ADDIS fixes the null.** It fits an additive model over all attributes, scores each subgroup by its **Additive Residual Distance (ARD)** from the additive prediction, and tests it against a **Freedman–Lane null**. On the same synthetic benchmark: **0.09 false subgroups/dataset** and **84% recovery** of planted interactions.
3. **A real audit, de-noised.** On IndiPersona (10,000 synthetic Indian personas, six identity attributes, 738 tested subgroups, 13 open LLMs): the standard criterion flags **7.1%** of subgroups vs **3.0%** under ADDIS.
4. **What survives correction:** gender identity × sexual orientation is the largest genuine interaction in *every* model; counterfactual personas confirm it and additionally reveal a **caste × class interaction in all but one model** — undetectable observationally due to insufficient data in that cell.

## Takeaway
Much of what LLM audits report as intersectional bias arises from independent single-attribute effects; only a small core of true interactions survives an additive baseline. Any bias-audit methodology must model additivity *before* flagging interactions.

## Relevance to Our Domain
A methodology correction for **LLM evaluation**: our KB's audit/evaluation notes should treat subgroup flags under the standard criterion as suspect, and prefer residual-vs-additive screening. The bootstrap-null machinery (shuffle null vs Freedman–Lane) is a reusable evaluation-design lesson beyond bias.

## References
- Paper: https://arxiv.org/abs/2611.26538 (arXiv:2611.26538, submitted 2026-11-19; 40 pages)
- Related: AltRA-Test (arXiv:2611.26073) — same topic area of statistically justified evaluation choices
