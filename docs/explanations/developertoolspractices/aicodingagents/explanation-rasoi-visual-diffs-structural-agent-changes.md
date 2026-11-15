---
title: 'Rasoi: Visual Diffs for Evaluating Structural Changes Made by Coding Agents'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.16293
date: 2026-11-15
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Rasoi: Visual Diffs for Evaluating Structural Changes Made by Coding Agents

## Overview

Rasoi is a design probe that renders **architecture-level visual diffs** of the edits a coding agent makes: after each agent edit, developers can inspect which architectural elements and relationships were added, modified, or removed, across multiple levels of abstraction. The paper reports a week-long deployment with 12 developers working on their own real codebases, and lands an intriguing conclusion — oversight tools earn their keep not by making developers trust the agent, but by making developers confident in *their own evaluation* of agent changes.

## Problem Statement

Coding agents now take on large, natural-language-driven changes, and developers lose thread of how the codebase evolves. A text diff shows *what lines changed* but not *how the system was restructured*: logic quietly duplicated, modules outside the requested scope touched, functionality removed that the developer meant to keep, slow architectural drift. These changes "look correct on the surface," so line-level review — even diligent review — systematically misses structural regressions.

## Key Contribution

- **Rasoi**, a tool that maps architectural evolution after each agent-made edit, exposing added/modified/removed elements and relationships at several abstraction levels.
- A one-week in-the-field study (12 developers, own codebases, varied technical domains) providing empirical evidence on how developers use structural visual diffs.
- Observed benefits: developers could check whether changes stayed **within scope**, notice **unexpected restructuring**, and relate modified parts to the whole system.
- A reframing for the field: the design goal of agent-oversight tooling should be **developer confidence in their own evaluation**, not trust calibration toward the agent.

## Technical Approach

Rasoi works as a probe over the codebase: it extracts an architectural representation (elements + relationships) before and after each agent edit, computes a structural diff, and presents it visually at multiple zoom levels — from module-level down to finer-grained elements. Developers drive it after each agent interaction, using it as a review instrument rather than an approval gate. Findings come from qualitative deployment study rather than benchmark scores.

## Results

- Visual structural diffs helped developers detect scope violations and unplanned restructuring that line diffs obscured.
- Developers reported stronger confidence evaluating agent changes themselves; the tool shifted effort from "should I trust this agent?" to "I can see what this change did."
- Positions human-oversight tool design toward code-comprehension aids over agent-trust dashboards.

## Relevance to Our Domain

Directly applicable to our AI-assisted development practice: our agent workflow notes emphasize verification habits (`howto-verify-agent-generated-code-before-accepting-it`, `howto-maintainability-sensors-for-coding-agents`) that all operate at file/line granularity. Rasoi argues the missing layer is structural: pair text-diff review with an architecture-diff pass to catch out-of-scope module edits and duplicated logic. Candidate improvement for our agent code-review checklist.

## References

- Paper: https://arxiv.org/abs/2611.16293
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16293
- Related KB notes: `developer-tools-practices/ai-coding-agents/howto-maintainability-sensors-for-coding-agents.md`, `developer-tools-practices/ai-coding-agents/explanation-ai-slop-pull-requests-oss-study.md`
