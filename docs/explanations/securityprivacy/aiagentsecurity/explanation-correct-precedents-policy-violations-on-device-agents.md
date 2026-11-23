---
title: Correct Precedents Induce Policy Violations in On-Device LLM Agents
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27216
date: 2026-11-23
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Correct Precedents Induce Policy Violations in On-Device LLM Agents

**Authors:** Chong Tian, Yu Wang, Steve Liu, Qirong Ho, Xiuying Chen — arXiv:2611.27216 (November 2026)

## Overview
A new, adversary-free failure mode for **local-cloud agent systems** (a cloud model paired with a small on-device agent that acts on private data, often as the last check before an irreversible action): the on-device agent is led into a violation **by its own correct decisions within a session**. After correctly releasing an item whose restriction was lifted, it becomes more likely to release the *next* item, which is still restricted. The authors call this **correct-precedent generalization**.

## Problem Statement
The on-device agent is the final gate before irreversible actions on private data. Prior failure modes assume a faulty step (bad instruction, injected content, misclassification). Here, **a history with no faulty step can still end in a violation** — the trigger is a *correct* decision — so audits that look for an error upstream will find none.

## Key Contribution
- **First identification of correct-precedent generalization**: correct in-session decisions transfer into policy violations on subsequently restricted items.
- **Prevalence study**: found in **13 open-weight models from 9 developers**; a single correct precedent can roughly **halve the safe rate** of the most affected agent.
- **Compounding effect**: risk grows when a refused request is simply resent in a new session.
- **Mechanism evidence**: history interventions show the agent carries its decision on the released item over to the restricted one, **instead of re-checking the restricted item's status**.
- **Mitigation — Paired Decision Distillation (PDD)**: distills decisions of a weakly affected teacher into a **LoRA adapter**; restores safe rate to **nearly 100% in every distilled model**, with no extra prompt text or model calls at inference.

## Technical Approach
Session-level intervention experiments: construct histories where a restricted release is correctly permitted (restriction lifted), then probe the next, still-restricted request. Intervening on the history isolates the transferred decision as the causal factor. PDD then packages the robust decision pattern (release/restrict pairs) from a weakly affected teacher model into a LoRA adapter for the vulnerable on-device student.

## Results (paper-reported)
- Failure present across 13 open-weight models from 9 developers.
- Single correct precedent → up to ~50% drop in safe rate (most affected agent).
- PDD-distilled adapters: safe rate restored to nearly 100% for every distilled model.

## Relevance to Our Domain
On-device/edge agent gatekeeping is exactly the pattern used before irreversible tool calls (payments, deletions, sends). This vector needs **no adversary at all** — it changes how we should order agent actions, cache decisions across sessions, and evaluate last-check agents; PDD-style adapter distillation is a practical mitigation worth trialing in agent stacks.

## See Also
- [[Who Grades the Agent? Privilege Separation for Coding-Agent Benchmarks]] (reference)
- [[Subverting Tool Arguments: Graft-style MCP Metadata Poisoning]]

## References
- Paper: https://arxiv.org/abs/2611.27216
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27216
