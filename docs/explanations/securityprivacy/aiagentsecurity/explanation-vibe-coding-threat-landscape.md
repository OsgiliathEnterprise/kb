---
title: Threat Landscape of Vibe Coding and the Road to Secure Autonomy
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.21822
date: '2026-11-18'
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
The best current map for securing the agentic-dev pipelines in our own SDLC (coding agents with shell, package installs, cloud credentials — exactly the trust boundaries this paper formalizes). The autonomy ladder is a practical procurement/deployment rubric: match the granted autonomy level to enforceable controls, don't rely on model judgement. Pairs with our agent-permissioning and prompt-injection-defense notes; its "enforceable authority limits" challenge aligns with Cedar-policy RLVR-verifier and token-scoping work in the KB. Related: [[explanation-kosher-privileged-tool-calling]], [[reference-piatlas-prompt-injection-attack-taxonomy]], [[explanation-prompt-injection-defense-taxonomy]].

## References
- Paper: https://arxiv.org/abs/2611.21822
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21822
