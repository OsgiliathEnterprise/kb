---
title: Pandora's Toolbox Or Why Agent Safety Cannot Be Verified
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25325
date: 2026-11-20
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Pandora's Toolbox Or Why Agent Safety Cannot Be Verified

## Overview
This paper establishes formal impossibility results for AI agent safety. Modern agents are a *coupling* of a fixed language model with a general-purpose computing device (tool use, code execution). That coupling is enough to make safety — "will this agent ever run this dangerous program?" — undecidable in the Turing/Rice sense, with direct consequences for how we design and market guardrails and certifications.

## Problem Statement
Agent-safety practice assumes safety is a verifiable property: run an audit, issue a certificate, ship the agent. The paper asks whether the *decision problem* "does agent A execute dangerous program P?" is even computable once the agent can call a general computing substrate.

## Key Contribution
- **Undecidability:** given some dangerous program, no algorithm can predict whether an agent will run a program *semantically equivalent* to it. Reduces to the classical undecidability of behaviour for general computing devices.
- **Consequence for the guardrail industry:** guardrails, blacklists, whitelists, and safety certifications can only ever yield *imperfect* safety solutions — no finite verification procedure can be both sound and complete for this class of agents.
- **Bounded regimes are still hard:** under finite constraints (bounded context, bounded values, bounded running time) safety becomes decidable but **PSPACE-complete**, even when the agent's full description is known. Practical verification is therefore either approximate or resource-bounded.
- **Non-compositionality:** safety is not compositional — individually provably-safe agents can compose into unsafe multi-agent behaviour. Modular safety proofs do not lift to agent teams.
- Discusses **relaxed safety notions** that remain usable in practice despite the impossibility results.

## Technical Approach
The argument models an agent as LLM + general computing device and leverages semantic equivalence of programs: any predictor of "will execute P or something equivalent" would decide an undecidable property of the device's behaviour. The bounded variant analyses the finite-state version and pins its complexity at PSPACE-complete. Non-compositionality follows because interaction channels between safe agents create a larger combined state space with emergent reachable unsafe states.

## Relevance to Our Domain
This is the theoretical foundation for the KB's recurring practical findings: guardrail stacks are defence-in-depth, never guarantees (`explanation-agent-guardrail-stack`), certification regimes like AIBOM are risk-management artefacts (`howto-genai-program-office-governance-inventory-aibom`), and multi-agent systems need system-level rather than per-agent safety cases. It also predicts the limits of "verified agent" platforms: verification must either restrict the compute substrate or settle for bounded-resource guarantees.

## References
- Paper: https://arxiv.org/abs/2611.25325
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25325
