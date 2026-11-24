---
title: 'Intent-Conditioned Argument Mediation for Tool-Using LLM Agents: Blocking
  Trusted-but-Unauthorized Arguments'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: 'arXiv: Intent-Conditioned Argument Mediation for Tool-Using LLM Agents: Blocking
  Trusted-but-Unauthorized Arguments (arXiv:2611.30745)'
source_url: https://arxiv.org/abs/2611.30745
date: 2026-11-24
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# IntentFlow: Blocking Trusted-but-Unauthorized Tool Arguments (How-to)

## Overview

IntentFlow (cs.AI/cs.CR, November 2026) is a **mediation layer inserted between an unmodified planner LLM and its tools** that checks every *authority-bearing argument* of each tool call against two things: an **intent contract** (what the user actually asked for) and a **provenance policy** (where the value came from). It targets the gap that argument-level provenance alone leaves open: provenance blocks values originating from untrusted content, but happily passes a *trusted* value the user never requested — e.g., an email address from the user's own contacts that was injected into the conversation as the "correct" recipient.

## Problem Statement

A tool-using agent turns a user request plus retrieved content into tool calls, and a poisoned call can route to the wrong recipient, endpoint, file, or participant. Provenance-only defenses classify values by origin; they have no model of user intent, so any attack that reuses trusted data (or flips a field to a trusted-looking value) executes. The paper measures exactly this: on 50 trusted-but-unauthorized attacks, **provenance-only mediation executes all 50**.

## How-to: Deploy IntentFlow-style Argument Mediation

1. **Keep the planner untouched.** Deploy the mediator as a wrapper on the tool-call path, not as a prompt change — the planner emits calls as usual; the mediator intercepts them.
2. **Identify authority-bearing arguments** per tool (recipient, endpoint URL, file path, participant list — the fields that decide *who/what is affected*), using declared roles rather than trusting field names.
3. **Derive an intent contract** from the user's request: the set of recipients/endpoints/targets the user actually authorized for this task.
4. **Combine with a provenance policy**: reject values from untrusted content (standard provenance), and additionally reject any authority-bearing value not covered by the intent contract — even when it is trusted-sourced.
5. **Adjudicate hard cases conservatively**: on content/payload fields the rule can stay permissive — in the paper's benchmark, every residual attack success only alters a content or payload field, never a routing field.

## Measured Payoff (why each step matters)

- Synthetic benchmark, 200 attacks (oracle intent + injection labels): attack success falls from **50.5% with provenance alone to 12.0% [8.2–17.2%]** with IntentFlow; all survivors only touch content/payload fields.
- False positives: **0 of 200 paired benign tasks wrongly blocked**; 4 of 50 hard benign tasks blocked.
- Trusted-but-unauthorized set (50 attacks): provenance-only executes all 50; **IntentFlow executes 0**. A CaMeL-style check also blocks all 50 but rejects 16/50 benign tasks — IntentFlow matches the protection at far lower collateral.
- Offline AgentDojo-derived replay: IntentFlow blocks all 20 attacks keeping 75% benign success (CaMeL-style check same); a Progent-style allowlist blocks 19 but keeps all benign tasks.
- Live planner, 110 attacks with same oracles: mediator **blocked all 17 corrupted calls** proposed.

## When to Use Which Control

| Defense | Blocks attacks | Benign cost |
|---|---|---|
| Provenance only | misses trusted-but-unauthorized entirely | none |
| CaMeL-style check | full block on the 50-attack set | 16/50 benign rejected |
| Progent-style allowlist (replay) | 19/20 | all benign kept |
| IntentFlow (intent + provenance) | 0 successes on hard set | 0/200 benign blocked, 4/50 hard |

## Relevance to Our Domain

This gives a concrete, agent-agnostic recipe for the class of injection attacks that our guardrail-stack notes describe abstractly: intent contracts close the "trusted value, wrong purpose" hole that provenance and allowlists both leave open, at near-zero benign-task cost.

## References

- Paper: https://arxiv.org/abs/2611.30745
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30745 (not yet indexed at time of writing)
- Related in vault: [[explanation-agent-guardrail-stack]], [[explanation-schemacaps-schema-widening-authority]]
