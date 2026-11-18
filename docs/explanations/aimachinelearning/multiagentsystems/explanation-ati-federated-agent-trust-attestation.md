---
title: 'Agent Trust Infrastructure (ATI): A Federated Identity, Trust, Attestation,
  and Accountability Architecture for Cross-Organization Autonomous AI Agents'
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.23202
date: '2026-11-18'
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# Agent Trust Infrastructure (ATI): A Federated Identity, Trust, Attestation, and Accountability Architecture for Cross-Organization Autonomous AI Agents

## Overview
ATI is a framework-independent security architecture for AI agents that collaborate across organizational boundaries. The authors observe that current agent frameworks handle planning and coordination but offer no common mechanism to verify a remote agent's *identity*, *execution integrity*, and *authorization*. ATI fills that gap by composing three established ingredients — PKI, Zero Trust Architecture, and remote attestation — into a federation where no shared root authority is required.

## Problem Statement
When agents invoke tools or interact with agents operated by independent entities, each side needs to answer: is this really the agent it claims to be, is it running the approved model/tools/system prompt, and is it authorized for this request? Existing stacks answer none of these jointly, leaving cross-organization agent traffic effectively trusted-by-default.

## Key Contribution
- **Federated trust via peer organizational certificate authorities (AgentCAs)** — mutual trust between organizations without a shared root CA.
- **Pre-execution verification pipeline** — agent certificate validation, verification of approved model/tool/system-prompt configurations via Entity Attestation Tokens (EAT), and authorization enforced through three policy checks.
- **Drop-in deployment** — ATI runs as an external security enforcement layer around existing agent frameworks; no model or framework modification.
- Open-source, framework-independent package built on IETF WIMSE workload token formats for identity and request verification.

## Technical Approach
The architecture composes PKI (AgentCA-issued agent certificates), ZTA (every request re-authorized; three policy checks before execution), and remote attestation (EATs proving the running model, tools, and system prompt match the approved configuration). Evaluation: a simulated federation of eight organizations, six agent frameworks, five-agent teams; security experiments across two organizations covering 14 attack scenarios and six benign tasks, five attack variations × three repetitions, scored by a panel of judge models.

## Results
- Attack containment rises from **43% to 84%** with all enforcement enabled (40% → 80% for the 11 scenarios evaluated consistently across configurations).
- Enforcement overhead is roughly **174 µs per request**.

## Relevance to Our Domain
A concrete blueprint for our agent infrastructure: rather than baking trust into each framework, deploy an external enforcement layer combining WIMSE tokens + EAT attestation. The 174 µs overhead figure is a useful budget anchor for inter-agent gateway design.

## References
- Paper: https://arxiv.org/abs/2611.23202 (published 2026-11-17)
- Authors: Viet K. Nguyen, Mohammad I. Husain
- Standards context: IETF WIMSE workload tokens; Entity Attestation Tokens (EAT)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23202
