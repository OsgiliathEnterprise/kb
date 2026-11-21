---
title: 'Signed but Unbound: The Authority Gap Between Agent Commerce Mandates and
  Crypto Wallet Signatures'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25821
date: 2026-11-21
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Signed but Unbound: The Authority Gap Between Agent Commerce Mandates and Crypto Wallet Signatures

## Overview
Agentic commerce protocols (AP2, ACP, Google's Agent Payments Protocol) authorize an agent to spend on a user's behalf via signed **mandates** — intent, receipt, and refund records. Meanwhile, agent-operated crypto wallets authorize value transfer by **signing transactions**. This paper (arXiv:2611.25821, Kim & Park, arXiv preprint submitted to Pattern Recognition) shows these two authorization planes are **semantically independent**: the same agent operation is checked against different fields by each plane, producing exploitable **authority gaps**.

## Problem Statement
A transaction can be valid to a blockchain (correctly signed, nonce valid, gas covered) while violating the user's spending mandate, and conversely a mandate-compliant intent can be rendered ineffective at the wallet layer. When the two planes interpret the *same* operation with *different* required fields, neither detects what the other misses.

## Key Contribution
- **Failure taxonomy**: characterizes 9 exploit classes from real-world incidents, spanning 7 platforms — e.g., **sign-to-death** (user signature binds the wrong payload), **phantom mandate**, **nonce replay**, **delegate escalation**, **gas-bound bypass**, **multi-sig threshold miscalibration**.
- **Cross-implementation study**: 497 source files and 11 test suites across five implementations: Google A2A/AP2 reference, Skyfire, Coinbase AgentKit, OpenAI ACP reference, Ethereum EIP-712 tooling.
- **Formal model**: a three-condition authority test — *field binding* (signature covers the fields that define authority), *semantic alignment* (mandate and transaction mean the same operation), *revocation coherence* (withdrawal propagates to both planes). Each exploit class violates at least one condition.
- **Empirical findings**: 7 of 9 classes (77.8%) need no cryptographic forgery — they exploit binding/interpretation gaps; mean attack success rate 89.2% (range 75–100%); the most vulnerable component is **delegate authorization** (mean success 93.1%).

## Why It Matters (Explanation)
The "authority gap" is an architectural insight, not a bug list: signatures prove *who* approved *a payload*, not that the payload means what the mandate says. Field-binding failures (wrong payload signed, fields omitted from the hash) are logic bugs, invisible to cryptography. For any system pairing human/agent approvals with on-chain execution — payment agents, DeFi bots, treasury automation — the three-condition test is a concrete audit checklist.

## Relevance to Our Domain
As LLM agents gain payment and procurement capabilities (a growing area of our AI agent security coverage), mandate-vs-execution separation becomes a primary attack surface. Findings apply equally to API-key scopes vs. OAuth consent mismatches in non-crypto agent systems.

## References
- Paper: https://arxiv.org/abs/2611.25821
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25821
- Related: Google Agent Payments Protocol (AP2), Coinbase AgentKit, EIP-712 typed structured data hashing
