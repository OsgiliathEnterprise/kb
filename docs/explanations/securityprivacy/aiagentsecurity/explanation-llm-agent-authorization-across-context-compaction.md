---
title: LLM Agent Authorization Across Context Compaction
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.32194
date: '2026-11-25'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# LLM Agent Authorization Across Context Compaction

## Overview
Request-derived authorizers (such as **Progent**) protect LLM agents from prompt injection by deriving what an agent may do directly from the user's request. This paper shows that **context compaction silently breaks the attribution assumption** underneath that guarantee: coding agents like Claude Code and Codex inject their model-written conversation summaries into the transcript *as user messages*, so an authorizer that trusts "user text" ends up trusting the compactor's quotations — including attacker-injected data. The authors prove an impossibility bound and ship a fix based on authenticated, verbatim user text.

## Problem Statement
Request-derived authorization is only as good as attribution: the request must be what the user actually said. At **every** automatic compaction the authors observed in Claude Code and Codex, the summary of earlier turns was placed as a user message — so the compactor's quotation of the user, of documents, and of injected text all read as the user speaking. Because a policy frozen at the first request lets the agent finish few later tasks, the authors let Progent re-derive its policy per request — and the grants then follow **what the compactor wrote**, not what the user said.

## Key Contribution
- **Empirical attack**: when an attacker's notice states a different payee account as plain data and the user asks to pay the rent, the policy derived from a frontier compactor's summary admits the attacker's account in **91 % of cases** — versus **0 %** when derived from the user's own words.
- **Impossibility theorem**: an authorizer that cannot see *who wrote which bytes* cannot treat a forged record differently from the legitimate record it imitates by more than the two are distinguishable — and the bound is tight. Consistent with this, frontier compactors mark injected *instructions* (which have no legitimate twin) but rarely mark injected *data* (which does). "What a compactor keeps, and how it marks it, is a security parameter."
- **Attribution-based fix**: the authorizer credits only what the user said — authenticated on arrival and carried verbatim across the compaction boundary — while the agent still reads the summary. Proven: the authorizer receives exactly the user's text or nothing, so an attacker can **block** the policy but cannot **shape** it.
- **Validation**: across 40 attacked AgentDojo episodes re-run with the fix, no attacker action completes while the agent reads the summary normally.

## Technical Approach
The defense separates two consumers of the transcript: the LLM (which may read summaries) and the authorizer (which must not). User turns are authenticated when they arrive and preserved verbatim across compaction; policy derivation reads only that authenticated channel. Failures are fail-closed — the authorizer gets the exact user text or nothing at all.

## Relevance to Our Domain
This is a directly actionable finding for our own stack: Hermes agents (including this KB pipeline) run automatic context compaction that re-inserts model-written summaries as user messages. Any permission/approval logic reading conversation text must bind to an authenticated user-utterance channel, not to transcript content. The 91 %-vs-0 % payee experiment should be the canonical test-case for any agent authorization design we review. Complements our ArguShield and SCOPE notes; sharpens the injection defense story from "filter bad content" to "authenticate the channel".

## References
- Paper: https://arxiv.org/abs/2611.32194
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32194
- Related in KB: explanation-argushield-minimum-necessary-disclosure.md
