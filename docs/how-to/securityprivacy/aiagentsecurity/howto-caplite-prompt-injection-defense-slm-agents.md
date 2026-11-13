---
title: CapLite — Defending Small Language Model Agents from Prompt Injection Without
  Model-Written Security Artifacts
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.17115
date: 2026-11-13
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# CapLite: Prompt-Injection Defense for SLM Agents without Model-Written Security Artifacts

## Overview

State-of-the-art *enforcement* defenses against indirect prompt injection (CaMeL, Progent, IPIGuard, DRIFT) share one design assumption: the agent's own model produces a security artifact — a plan program, a privilege policy, a dependency graph, a constraint list — that a deterministic layer then enforces. Xu, Liu & Nakayama (2026) show this assumption collapses for **small language models** (1.7B–12B), and present CapLite, a defense that derives its security policy entirely from tool schemas instead of from the model. CapLite achieved **zero successful attacks across 13,935 attacked AgentDojo episodes** while using only ~18% of CaMeL's tokens per episode.

## Problem Statement

SLMs are attractive for on-device and cost-constrained agents, but they are too weak to author the security artifacts that enforcement defenses rely on. If the compromised or incompetent model writes the policy, the policy itself becomes the attack surface.

## Procedure (How CapLite Works / How to Apply the Pattern)

1. **Do not trust the agent to write security artifacts.** The authors test 15 open-weight models (13 between 1.7B and 12B): agent-written policies admit attacks on 14/15 models for Progent, 13/15 for IPIGuard, 11/15 for DRIFT; CaMeL's generated programs fail to even execute in up to 68% of episodes.
2. **Derive the policy from tool schemas** (the declared signatures of available tools), not from model output. The schema is trusted, human-authored metadata.
3. **Commit write calls before any tool result is read.** The set of side-effecting operations is fixed at request time, before untrusted content can influence the agent.
4. **Admit a write only if every effect-deciding argument** (recipient, amount, object, destination) **is explicitly stated in the user's request.** Injected text can never introduce a new write nor redirect one, giving provable *write integrity*.
5. **Measure utility under attack and per-token cost**, not just attack success rate. CapLite reaches 29.0% utility under attack vs CaMeL's 27.2%, at 17.1k tokens/episode — the best utility-per-token of all enforcement defenses, cheaper than even the undefended agent.

## Key Contribution

- First systematic evidence that model-written security artifacts fail for SLM agents (14/15 models broken for Progent).
- CapLite: schema-derived policy + pre-commitment + user-stated-argument gating → guaranteed write integrity, 0/13,935 successful attacks on AgentDojo.
- Reframes agent security economics: token overhead is a first-class defense metric.

## Relevance to Our Domain

Our agent-infrastructure stack increasingly considers small models for tool-use at the edge and for cost control. CapLite's pattern — *move the trusted computing base from model output to declarative tool metadata* — is directly implementable in any agent gateway or MCP-style proxy: validate mutating tool arguments against the verbatim user request, and freeze side effects before ingestion of untrusted tool results.

## References

- Paper: https://arxiv.org/abs/2611.17115
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17115
- CaMeL (baseline defense): https://arxiv.org/abs/2503.18813 and https://github.com/google-research/camel-prompt-injection
- AgentDojo (attack/utility benchmark used): https://arxiv.org/abs/2406.13352
- InjecAgent (indirect prompt-injection benchmark for tool-using agents): https://arxiv.org/abs/2403.02691
- Related notes: PIAtlas prompt-injection taxonomy, INFUSE benchmark (`explanations|reference/securityprivacy/aiagentsecurity/`)
