---
title: 'Useful but Unwieldy: How Software Engineers Perceive the Design of Chain-of-Thought
  Explanations in Coding Agents'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: 'arXiv: Useful but Unwieldy: How Software Engineers Perceive the Design of
  Chain-of-Thought Explanations in Coding Agents (arXiv:2611.30894)'
source_url: https://arxiv.org/abs/2611.30894
date: 2026-11-24
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# Useful but Unwieldy: Engineer Perceptions of CoT Explanations in Coding Agents

## Overview

This empirical study (cs.SE, November 2026) asks a question benchmark papers don't answer: **what do practicing software engineers actually think of the chain-of-thought (CoT) messages that coding agents stream at them?** Some coding agents show the model's rationale as a separate message, in the name of transparency and explainability — but whether CoT works as an **explainable-AI (XAI) mechanism for SE end-users** had not been established. The authors survey software engineers and follow up with semi-structured interviews (**36 participants**), then run thematic analysis. The title delivers the verdict: engineers find the explanations **useful but unwieldy**.

## Problem Statement

As coding agents take on more tasks and responsibilities, engineers need to understand the rationale behind agent decisions. Some agents expose the CoT as a distinct user-facing message intended to provide transparency — yet its effectiveness as an XAI tool in real software-engineering workflows was an open question in the literature, and UIs were shipping on intuition rather than evidence.

## Key Contribution

- **Empirical perception data**: survey + semi-structured interviews with 36 software engineers, analyzed thematically, on the CoT message as an XAI tool.
- **The "indispensable but unwieldy" finding**: the CoT message is valued as an **indispensable** aid for **transparency, scrutability, and trust** toward the coding agent — but three concrete failure modes undercut it:
  1. **Over-verbosity** — too much undifferentiated reasoning;
  2. **Expertise mismatch** — technical content that doesn't match the reader's expertise level;
  3. **Detachment** — the message reads as the "agent talking to itself," disconnected from the conversation.
- These problems cause **comprehension difficulties and selective use or outright abandonment** of the CoT feature.
- **Design synthesis**: the paper distills the findings into guidance for designing CoT messages that actually serve engineers' explainability needs.

## Technical Approach

Mixed qualitative methods standard in HCI-for-SE research: a survey of software engineers with semi-structured follow-up interviews, analyzed via thematic analysis, to characterize lived experience with CoT messages as a separate transparency surface in coding-agent interactions.

## Relevance to Our Domain

Directly informs the harness- and verification-layer designs we document: if engineers won't read undifferentiated CoT, agent harnesses should treat explanation rendering as a first-class interface — progressive disclosure of reasoning, evidence-linked claims, summaries with drill-down — rather than dumping raw traces. It also supports our position that verification (tests, diffs, checks) must carry the audit load that verbose reasoning fails to carry in practice.

## References

- Paper: https://arxiv.org/abs/2611.30894
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30894 (not yet indexed at time of writing)
- Related in vault: [[explanation-harness-design-coding-agents]], [[explanation-progressive-disclosure-on-demand-skills]]
