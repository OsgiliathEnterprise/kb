---
title: 'Anatomy of an Agent Harness: Decisions, Invariants and Corner Cases'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.19960
date: 2026-11-17
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Anatomy of an Agent Harness: Decisions, Invariants and Corner Cases

## Overview

The *agent harness* is the program wrapped around a language model that turns replies into actions: it builds each request, executes requested tools, decides what the model may do without asking, persists the conversation, recovers from failures, and reports what happened to the human. Most of these decisions live silently in code, so every harness team rediscovers the same corner cases. This paper writes them down — as **testable invariants** — derived from building one desktop harness (Crewroom), manually testing ten others, and studying open-source harnesses.

## Problem Statement

Harness engineering knowledge is tacit and scattered. Without a written catalogue of decisions and invariants, the same classes of failure (tool-execution races, permission-gate bypasses, lost conversation state, silent recovery divergence) recur across every agent product.

## Key Contribution

- A **system model with explicit trust boundaries** between model, harness, tools, and user.
- **30 decision cards** in six groups — each with options, costs, an invariant, the corner cases that break it, a test, and an evidence tag.
- **Six cause classes** for harness failures.
- A **test method** built on scripted providers, recorded behaviour, and planted changes (mutation-style).
- A practical **checklist** — applied to the author's own harness as one worked example.

## Evidence Discipline

Of 83 invariant clauses: **56 Tested, 12 Believed, 15 Open**. On the checklist applied to Crewroom by its builder (single rater): 11 of 30 items hold, 14 do not, 5 untested. The paper is explicit that this is *not* a ranking: it makes no claims about answer quality, cost, or other platforms, and does not evaluate competing harnesses. Because some card patterns were adopted from open-source harnesses, the catalogue is not independent of them.

## Relevance to Our Domain

Our platform runs coding agents and custom harnesses daily; this is effectively a peer-review checklist for our own agent runtime. The decision-card format (invariant + corner case + test + evidence tag) is a good template for codifying our own harness conventions — e.g. approval gates, idempotent tool execution, and session-state persistence already covered in adjacent notes.

## References

- Paper: https://arxiv.org/abs/2611.19960 (cs.CL, cs.SE — Resham Joshi; 33 pp., 8 tables, 30 decision cards)
- Related: `explanation-harness-design-coding-agents.md`, `explanation-evox-agent-harness-runtime-policy.md`, `explanation-human-in-the-loop-approval-gates.md`
