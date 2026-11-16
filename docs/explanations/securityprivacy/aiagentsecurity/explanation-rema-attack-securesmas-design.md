---
title: "ReMA Attacks and SecMAS — Securing LLM Multi-Agent Systems by Design"
diataxis: Explanation
domain: Security & Privacy
topic: AI Agent Security
source: "arXiv"
source_url: "https://arxiv.org/abs/2611.17883"
arxiv_id: "2611.17883"
date: 2026-11-16
keywords:
- knowledge-base
- Multi-Agent Systems
- Prompt Injection
- Security by Design
- AI Agent Security
- explanations
visibility: public
---
# ReMA Attacks and SecMAS: Security by Design for LLM Multi-Agent Systems

## Overview

This Syracuse University paper (Wenxin Zhang, Neil Gong et al.) argues that LLM-based multi-agent systems (MAS) must be secured *by design*, and backs the claim both ways: it introduces ReMA (REmediate MAS), a set of attacks showing that MAS designed without security considerations are fundamentally insecure, and SecMAS, a design framework that closes those gaps. It is one of the first works to formalise MAS security, including the inter-agent communication channels that most prior work ignores.

## Problem Statement

Existing MAS security research focuses on attacking *individual* agents (e.g. prompt injection). But in production MAS, agents exchange messages over communication channels — a much larger attack surface. Without a formal model of what "secure MAS" even means, defenders cannot tell whether a design is secure or simply unattacked yet.

## Key Contribution

- **Formalisation of MAS** as a system including the communication channels between agents, plus a rigorous threat model: what an adversary can do by affecting any agent's behaviour and any agent's received messages.
- **ReMA attacks**: two systematic attack strategies derived from the threat model — (1) injecting malicious agents into the MAS, and (2) compromising the behaviour of benign agents — with attack instantiations built on existing prompt-injection primitives.
- **SecMAS**: a design framework that defends MAS against ReMA attacks, moving protection from per-agent filters to architectural properties.
- **Prototype validation** against five ReMA attack types.

## Technical Approach

The authors model an MAS as agents plus explicit communication channels, then ask: given an adversary that can control or influence one or more agents and their incoming messages, can system-level goals still be guaranteed? ReMA attacks exploit the fact that most MAS trust internal messages by construction — a compromised or injected agent propagates malicious content that downstream agents act on. SecMAS counters with design-level mechanisms: validating agent identity/behaviour on channels and containing the blast radius of any single compromised agent.

## Results

The prototype SecMAS MAS defends against all five evaluated ReMA attack types, while unsecured MAS designs are systematically broken by the same attacks.

## Relevance to Our Domain

Multi-agent orchestration is a core KB topic (agent frameworks, tooling, orchestration). This paper gives concrete, attack-derived requirements for any MAS we build or review: treat every inter-agent message as untrusted input, and design identity/attestation into communication channels. Pairs with Soteria's verify-then-enforce pattern for single agents.

## References

- Paper: https://arxiv.org/abs/2611.17883
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17883
- Related: `explanation-soteria-verified-llm-agents.md`, `explanation-dga-jailbreak-image-tool-sets.md`
