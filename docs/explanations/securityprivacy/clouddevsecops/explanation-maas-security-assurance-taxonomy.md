---
title: 'From Models to Services: Systematizing Security Assurance for Model-as-a-Service'
diataxis: Explanation
domain: security-privacy
topic: cloud-devsecops
source: arXiv
source_url: https://arxiv.org/abs/2611.34623
date: '2026-11-25'
keywords:
- knowledge-base
- cloud-devsecops
- security-privacy
- explanations
---
# From Models to Services: Systematizing Security Assurance for Model-as-a-Service
**Authors:** Jianming Zhou, Yang Luo, Guangpu Chen, Zhaoyu Chen, Yifeng Gao, Qingni Shen, Zhonghai Wu

## Overview
LLMs are overwhelmingly consumed as cloud services, where assets of multiple principals (customer data, provider models, third-party pipelines) are coupled inside one service pipeline, while the security literature is scattered across fields with incompatible threat models. This SoK-style paper rebuilds that literature from a *service* perspective: a layered stack with explicit trust boundaries, adversary classes, and security goals, used to code 120 studies and grade 50 defenses.

## Problem Statement
MaaS security research is fragmented — prompt-injection work, privacy attacks, model-extraction, availability/DoS, and supply-chain studies each use different threat models, making it impossible to see what is actually covered and what is neglected across the whole service.

## Key Contribution
- A **five-layer decomposition** of MaaS with **five trust boundaries**, plus a taxonomy of **six adversary classes** and **six security goals**.
- Systematic coding of **120 studies** and evaluation of **50 defenses** under unified criteria.
- Headline coverage gaps:
  - **44.2%** of studies concentrate on *behavioral integrity* (jailbreaks/injections), while *service integrity, availability & cost*, and *accountability* together get only **13.3%**.
  - Defenses are evaluated on production services at **less than half** the rate of attacks.
  - **No** cryptographic or hardware mechanism that protects a customer *against the provider* can be adopted unilaterally by customers — provider-side cooperation is mandatory for that whole defense class.
- A research agenda derived by comparing the taxonomy against current standards and regulations.

## Technical Approach
The method is classic systematization-of-knowledge: define architectural layers and trust boundaries first, define adversaries and security goals, then map every study and defense onto that grid. Coverage statistics fall out of the grid, exposing blind spots that field-by-field literature reviews hide.

## Relevance to Our Domain
For anyone operating or consuming MaaS platforms, this is the threat-modeling map: it tells us which security goals our vendor assessments likely miss (availability/cost integrity, accountability, service integrity), warns that provider-trust defenses (e.g., confidential computing attestations) can't be self-serve, and gives a standards/regulation comparison baseline for compliance work.

## References
- Paper: https://arxiv.org/abs/2611.34623
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34623
