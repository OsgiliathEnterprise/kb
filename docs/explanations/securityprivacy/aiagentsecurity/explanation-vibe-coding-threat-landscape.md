---
title: Threat Landscape of Vibe Coding and the Road to Secure Autonomy
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.21822
date: '2026-11-20'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Threat Landscape of Vibe Coding and the Road to Secure Autonomy

## Overview
Jha, Anand, Krishnaiah, Ahearn & Nale consolidate the fragmented security research around **vibe coding** — natural-language-driven development where AI agents write, test and deploy code. As these agents gain operational authority (executing commands, managing dependencies, touching cloud resources, talking to other agents), the risk surface expands from "incorrect code" to **consequences of actions**. The paper builds a shared foundation: a reference architecture, an autonomy ladder, a trust-boundary threat model, and a 21-threat taxonomy.

## Problem Statement
Vibe-coding security research is scattered across prompt injection, insecure code generation, supply-chain attacks and human-factors studies, with little consensus on terminology, threat assumptions or evaluation methodology — making defenses hard to compare and gaps hard to see.

## Key Contribution
- **Reference architecture** for the vibe-coding workflow.
- **Six levels of agent autonomy**, characterizing what each level can do (and therefore break).
- A **threat model organized around five trust boundaries**: developer ↔ model ↔ tools ↔ cloud infrastructure ↔ wider software ecosystem.
- A **taxonomy of 21 threats in 9 classes**, each reviewed for available evidence, proposed defenses, and defense limitations.
- **11 identified research challenges**, including enforceable limits on agent authority and shared benchmarks/methodologies for vibe-coding security evaluation.

## Key Findings
- Risk scales with **operational authority**, not model quality: the more an agent can execute and provision, the more severe every threat class becomes.
- Most current defenses lean on **model judgement** (asking the model not to misbehave) and each addresses an **isolated threat** — there is no compositional defense story.

## Relevance to Our Domain
The best current map for securing the agentic-dev pipelines in our own SDLC (coding agents with shell, package installs, cloud credentials — exactly the trust boundaries this paper formalizes). The autonomy ladder is a practical procurement/deployment rubric: match the granted autonomy level to enforceable controls, don't rely on model judgement. Pairs with our agent-permissioning and prompt-injection-defense notes; its "enforceable authority limits" challenge aligns with Cedar-policy RLVR-verifier and token-scoping work in the KB. Related: [[reference-piatlas-prompt-injection-attack-taxonomy]].

## References
- Paper: https://arxiv.org/abs/2611.21822
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21822
- HTML (experimental) full text: https://arxiv.org/html/2611.21822v1

## Enrichment (2026-11-20, zookeeper)
- **Venue & format**: 35 pages, 6 figures, 5 tables; submitted to *ACM Computing Surveys* (Nov 16, 2026). As a survey, it is well suited as an onboarding/reading-list spine for agentic-dev security — each of the 21 threats carries an evidence/defence/limitation review that can seed individual KB notes.
- **Primary categories**: cs.CR (Cryptography and Security), cross-listed cs.ET (Emerging Technologies). DOI: https://doi.org/10.48550/arXiv.2611.21822
- **Autonomy ladder in practice**: the six levels map cleanly onto our agent permission tiers — start with each threat class and ask which autonomy level makes it reachable; any threat reachable only at level ≥N is an argument for capping granted level rather than adding a model-level defence.
- **Evaluation gap to watch**: the paper's eleven research challenges include *shared benchmarks for vibe-coding security* — track follow-ups (e.g., agent-security benchmark suites in this KB such as KALIbench and Multimodal-SEA) as candidate building blocks.

