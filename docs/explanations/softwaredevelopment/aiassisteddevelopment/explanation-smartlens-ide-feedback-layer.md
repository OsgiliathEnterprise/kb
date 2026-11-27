---
title: 'SmartLens: Turning AI Agent Changes into Learning, Review, and Risk Signals
  in the IDE'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.34377
date: '2026-11-27'
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# SmartLens: AI-Attributed Pending Changes as Learning, Review, and Risk Signals in the IDE

## Overview
Etemadi & Robles (arXiv:2611.34377, submitted 2026-11-25) reframe the developer's role: developers increasingly **manage AI coding agents**, then must understand, verify, ship, and *learn from* what the agents produce. Existing tooling can show which *committed* lines were AI-written, but does **not attribute pending (uncommitted) changes from external agents**, and does not use attribution to support review, learning, or risk judgement. **SmartLens** is an **IntelliJ IDEA plugin** that fills both gaps.

## Problem Statement
Agent-authored pending changes are invisible as such until committed. The developer reviews them blind to provenance, cannot compare them against their own competence map, and cannot flag long-term risk from AI-written code they don't understand.

## Key Contribution — Three Goals from One Signal (attribution + Git history)
SmartLens attributes each pending change to **the AI agent, the developer, or both**, then derives:
1. **Learn** — compares the *skills* (APIs, language features, annotations) the agent used against skills the developer has used in their own commits: surfacing what the agent knows that you don't. Feature extraction is **lexical** (must work on unparseable diff fragments) and covers imported APIs, annotations, and language features (records, sealed types, pattern matching, streams, try-with-resources); the view reports V_agent ∖ V_dev ordered by agent usage frequency. The authors call this **reverse learning**.
2. **Understand** — ranks pending changes by **review priority**: `p = 100·(0.5·o + 0.3·σ + 0.2·(1−k_f))`, where `o` = origin score (Agent 1.0, Mixed 0.6, Developer 0.0, Unknown 0.3), `σ` = log-normalized changed-line count, `k_f` = developer familiarity (share of added lines they wrote).
3. **Risk** — surfaces **hotspots**: files that change often, are mostly AI-written, and the developer barely knows: `r = 100·χ_f·(0.4 + 0.3·s_f + 0.3·(1−k_f))·α_f` with normalized churn χ_f, agent-authored line share s_f, and ownership-scattering factor α_f.

**Attribution signals (combined, none sufficient alone):** external disk changes → Agent (Git operations filtered via a 5-s quiet period after HEAD/state-file changes); editor typing → Developer; **agent hook log** (one-line lifecycle hook writing JSON per edit) → Agent, most precise; commit author / `Co-authored-by` trailer matching configured agent identities → Agent (history). The developer model comes from Git e-mail + aliases over the latest 300 commits.

**Implementation notes:** Java IntelliJ plugin (IDEA 2025.1+), ~2.3k LOC / 49 classes; attribution kept in the IDE per-user workspace file — **no network access, no LLM**; scoring is IDE-independent and unit-tested, plus a headless-IDE end-to-end test. Open source: https://github.com/vahidetemadi/smartlens.

## Results (preliminary evaluation)
- Attribution: **8 of 12 scripted IDE scenarios** correct (7/12 without the 5-s Git quiet period); all failures were in expected blind spots — developer typing inside the 3-s reload window after an agent edit, in-IDE assistants that write through the editor (look like the developer; a hook entry upgrades them to Mixed), and external formatters (look like agents).
- On **8 OSS repositories** (Java/Kotlin repos with `Co-Authored-By: Claude` trailers) with agent co-authored commits, agents introduced **up to 253 skills absent from the main developer's own commits** — the learning gap is real and large.
- The Risk ranking predicted later bug fixes **as well as or better than plain churn**, though part of the gain traces to recency.

## Relevance to Our Domain
Concrete IDE-side mechanism for the "developer as agent manager" workflow: provenance-aware review and long-term comprehension-risk visibility, complementing CI-side validation ([[tutorial-harbor-coding-agent-evaluation-oracle-nop]]).

## References
- Paper: https://arxiv.org/abs/2611.34377
