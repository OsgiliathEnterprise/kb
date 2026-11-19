---
title: 'Intent Contracts: Taking Tools Away from Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.24025
date: 2026-11-19
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Intent Contracts: Taking Tools Away from Agents

## Overview
This paper proposes **intent contracts**: an authorization interface for tool-using LLM agents in which the *planning model holds no tools at all*. For each step, the planner submits a short logged contract (a goal, a verbatim quotation of the user, and scope fields). Code validates the contract, and a small trusted model checks it against the user's words and writes the tool call itself.

## Problem Statement
Today's agents let the (untrusted, prompt-injectable) planner compose tool calls directly, so permission systems can only review planner-written commands after the fact. Reviewers — whether reasoning-blind permission classifiers or humans — see a command but cannot reliably judge whether it matches user intent.

## Key Contribution
- A design in which **every executed call is written by a trusted model**; the planner's influence is confined to a contract logged *before* the call, and the trusted side decides how much of a request to actually carry out (assuming validation/dispatch code is correct).
- A controlled comparison against two reviewers of planner-written commands: one blind (only user's words + command, the boundary of a reasoning-blind permission classifier) and one intent-visible (also sees the planner's goal and a checked quotation).
- An honest negative result: **contracts do not reduce unauthorized actions** — they are indistinguishable from blind review on that axis.

## Technical Approach
Per-step flow: planner emits contract → code validates structure → trusted model cross-checks contract against the user's actual words → trusted model writes the tool call. Evaluated on three AmPermBench task families with gpt-6.1-terra as planner and GLM-5.3-Flash as trusted model.

## Results
- **Scope discipline:** under contracts, *every* object changed is named in the contract's goal; under review, planners name objects in commands but rarely in goals.
- **Unauthorized over-reach:** when the planner adds work the user never asked for, contracts complete the user's task in 27/30 runs vs 16/30 for the intent-visible reviewer (a reviewer can only refuse a whole command).
- **Unresolved failure mode:** once environment terms are clarified, every state-changing condition hits a wrong target in 40–49% of ambiguous-reference runs — the planner picks wrong objects and no trusted model can see the environment to check; instructing the executor to decline when unsure doesn't help.
- Benign over-reach was evaluated with one model pair, not adversarial planners. Plugin and run records released.

## Relevance to Our Domain
For agent infrastructure, this is a concrete architectural pattern for tool-gateway design (cf. our MCP security notes): move tool *composition* out of the planner into a trusted, contract-checked executor. The sobering takeaway is that separation of duties buys provable scope discipline but not unauthorized-action prevention — ambiguous-reference errors remain an open problem no trusted model can catch without environment visibility.

## References
- Paper: https://arxiv.org/abs/2611.24025
- Benchmark: AmPermBench (task families used for evaluation)
