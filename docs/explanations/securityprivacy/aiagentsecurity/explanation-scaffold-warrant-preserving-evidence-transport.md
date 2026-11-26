---
title: 'SCAFFOLD: Toward Warrant-Preserving Evidence Transport for Reusable LLM-Agent
  Skills'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.23990
date: 2026-11-22
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# SCAFFOLD: Toward Warrant-Preserving Evidence Transport for Reusable LLM-Agent Skills

## Overview

An agent skill that succeeded yesterday can be executed today **without being justified for reuse today**. SCAFFOLD argues the right unit of *prospective* trust is a **Warranted Reuse Claim (WRC)** — a defeasible, claim-specific authorization — and proposes **Warrant-Preserving Evidence Transport (WPET)**, a discipline for deciding which historical evidence remains *admissible* after the context changes.

## Problem Statement

Between validation and invocation, everything that justified a skill can rot: tests may cover only observable contract clauses; outcome oracles may be absent; evaluations may inherit the same erroneous specification; permissions or dependencies may change. Execution rights currently follow *availability* ("the skill runs") rather than *warrant* ("the evidence still licenses this use in this context").

## Key Concepts

- **Warranted Reuse Claim (WRC)**: a defeasible authorization tied to a *specific claim*, bound to five things — versioned skill, target context, evidence, assumptions, and identified defeaters. Trust attaches to the claim, not the code blob.
- **Evidence admissibility ≠ truth**: WPET separates *whether old evidence may still count* after context change from *whether the supported safety/effectiveness claim is true*. A true claim can rest on inadmissible evidence, and vice versa.
- **Conditional preservation result** (and its limits): states when evidence transports across context change, and explicitly where it cannot.
- **Three-valued applicability** and **asymmetric context-transfer judgments**: transferring warrant from context A→B is not symmetric; applicability is yes / no / undetermined.
- **Provenance dependence & policy-invalidating changes**: certain changes (permission grants, dependency versions, policy updates) invalidate authorization regardless of behavioural equivalence.

## Positioning & Evaluation Plan

The paper explicitly relates WRC/WPET to **assurance cases, contracts, and skill-library maintenance** without claiming novelty for those ingredients, and proposes a **falsifiable longitudinal evaluation**: compare WRC-guided reuse policies against strong version-aware baselines at matched coverage, utility, and review cost. It is upfront that it contributes a formalized problem statement, testable design obligations, and a reporting protocol — **not** an implemented verifier or an empirical superiority result.

## Relevance to Our Domain

Our agent infrastructure already curates reusable skills (see skill-library workflows); WRC/WPET gives a governance model for *when a saved skill may run again* — version pinning plus evidence transport — and a concrete evaluation protocol before building enforcement.

## References
- Paper: https://arxiv.org/abs/2611.23990 (cs.AI, cs.MA, cs.SE — Nami Cho, Shailja Gupta, 2026-11-18)
- Related in vault: [[explanation-verification-transport-llm-agent-evaluation]], skill-library maintenance notes under ai-llm/agent-architecture
