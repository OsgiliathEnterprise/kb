---
title: Intent-Aware Protection of AI Agents from Harmful Outcomes
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.16122
date: 2026-11-14
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Intent-Aware Protection: Judging Agent Actions by the Task, Not by the Words

## Overview

LLM agents are exposed to hostile inputs — prompt injections, data poisoning, poisoned tools — and defenders today try to intercept harmful requests *before* they reach the model. The paper's key insight is that the same instruction can be benign or harmful **depending on the user's actual goal**, so content-level filtering is fundamentally under-determined. It proposes **intent-aware protection**: a framework that infers the user's goal from the task context, uses that to decide whether a request is harmful, and deploys the protection accordingly — instantiated as two complementary defenses: an **Intent-Aware Guardrail** and **Intent-Aware Reinforcement Learning**.

## Problem Statement

Static guardrails classify inputs by surface content. But harmfulness is contextual: "delete all records in this table" is legitimate for a DBA doing cleanup and catastrophic under a prompt injection telling an office assistant to wipe data. Content classifiers either over-block (breaking legitimate work) or under-block (missing injection payloads that look ordinary). The missing variable is *intent*.

## Key Contribution

- **Concept**: operationalizes *intent* as the decision basis for agent safety — harmfulness is a property of (request, inferred user goal, task context), not of the request text alone.
- **Systematic characterization**: reviews real-world AI-agent attacks and organizes them by the intent structure each attack exploits (goal hijacking, goal confusion, delegated authority abuse, etc.), building a bridge from security engineering to agent safety.
- **Two deployable forms of protection**:
  1. **Intent-Aware Guardrail** — a screening layer that reconstructs the user's goal from task context and flags requests misaligned with that goal (catching injections whose content alone appears innocuous).
  2. **Intent-Aware RL** — trains the agent itself to reason about whether an incoming instruction serves the user's actual goal before acting, baking intent checks into the policy.
- Argues the framework is **systematic, extensible, and deployable across a wide range of agent risks**, rather than a patch per attack type.

## Technical Approach

The pipeline is: (1) *intent inference* — build a task-context model of what the user is trying to accomplish, from the session, declared objectives, and prior actions; (2) *harmful decision* — evaluate each incoming instruction/tool call for consistency with that intent, rather than against a static list of forbidden content; (3) *protection deployment* — either block/escalate at the guardrail layer or let an RL-trained policy self-check before execution. Attacks are mapped onto the intent structure they exploit, so new attack classes slot into the taxonomy instead of requiring new bespoke filters.

## Relevance to Our Domain

Our environment runs autonomous agents with tool access (terminal, file writes, messaging) — precisely the setting where indirect prompt injection pays off. Intent-aware guardrails are a strong complement to our existing allow-listing and visibility rules: an action that is syntactically permitted but inconsistent with the user's stated task should be the thing we catch. The intent taxonomy is also useful for threat-modeling our own agent stacks.

## References

- Paper: https://arxiv.org/abs/2611.16122 (cs.CR, submitted 2026-11-12)
- Related: earlier content-level guardrail work and agent-trace tampering notes in this KB (explanations/securityprivacy/aiagentsecurity/)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16122
