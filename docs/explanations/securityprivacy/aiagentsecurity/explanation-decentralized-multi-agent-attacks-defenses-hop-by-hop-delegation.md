---
title: Attacks and Defenses in Decentralized Multi-Agent Systems with Hop-by-Hop Task
  Decomposition and Delegation
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25056
date: 2026-11-21
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Attacks and Defenses in Decentralized Multi-Agent Systems with Hop-by-Hop Task Decomposition and Delegation

## Paper Metadata
- Authors: Matthew D. Laws, Maria Lazou, Alina Oprea, Cristina Nita-Rotaru (security group at Northeastern University)
- Submitted: 2026-11-18 (v1, 948 KB) · Categories: cs.CR (primary), cross-listed cs.MA · License: CC-BY 4.0
- Format: 17 pages, 5 figures, 7 tables
- Study design (stated threefold goal): (1) demonstrate existing hop-by-hop systems are vulnerable to a range of attacks; (2) develop a protocol producing an irrefutable verified execution trace; (3) build an auditor that analyzes traces to detect and attribute malicious behavior.

## Overview
A systematization of threats in decentralized multi-agent LLM systems, where independently administered agents (own operator, model, memory, configuration) collaborate without central coordination: each agent decomposes tasks, executes subtasks, and delegates remaining work to peers. The paper quantifies how much damage one malicious agent can do and proposes a cryptographic trace protocol plus an auditor to catch it.

## Problem Statement
Decentralization removes single points of failure but also removes any entity with complete visibility into task execution or authority to enforce correct behavior. When agents recursively delegate hop-by-hop, a malicious peer sits inside the trust path of every task that transits it.

## Key Contribution
- Threat model and evaluated attacks against integrity, availability, and confidentiality in decentralized agent networks.
- Quantified blast radius of a **single** malicious agent: up to 100% task failure, token consumption inflated up to 7.7×, runtime up to 3.2×, and exfiltration of up to 94% of relevant content from prior tasks of benign agents.
- A cryptographic protocol producing an irrefutable, verified execution trace of every action taken in the system.
- An auditor that analyzes verified traces to detect and attribute malicious behavior — including attacks that comply with the protocol's surface rules.

## Technical Approach
The defense is twofold: (1) every agent action is bound into a cryptographically verifiable trace so that later attribution is irrefutable, and (2) an offline auditor inspects these traces for anomalies and misattribution patterns. Evaluation ran on HiddenBench using gpt-6.1-sol and Qwen3.8-27B-FP8 as the agent substrate.

## Results
Negligible latency overhead from the trace protocol, and 98% detection with correct attribution of attacks — including compliant-looking ones that the protocol alone would not reject.

## Relevance to Our Domain
Directly applicable to our agent infrastructure: open agent meshes and marketplace-style delegation need trace-everything architectures from day one. The 94% cross-task exfiltration figure argues for strict task-scoped memory isolation between delegations, and the verified-trace pattern is a concrete design target for orchestration layers.

## References
- Paper: https://arxiv.org/abs/2611.25056
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25056
