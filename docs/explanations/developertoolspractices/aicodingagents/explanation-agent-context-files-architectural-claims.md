---
title: Does the Agent's Map Match the Territory? Architectural Claims in AI Agent
  Context Files and Their Fit with the Code
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.29916
date: '2026-11-25'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Does the Agent's Map Match the Territory? Architectural Claims in AI Agent Context Files and Their Fit with the Code

**Authors:** Bachan Ghimire, Daniela Damian

## Overview
Ghimire & Damian (arXiv:2611.29916, cs.SE, submitted 2026-11-23) audit whether the architectural descriptions embedded in **AI agent context files** (CLAUDE.md, AGENTS.md and similar repo-level instruction files) still match the code they claim to describe. Across **3,602 context files in 3,346 open-source projects**, they check **41,090 file path claims** and **184 file-to-file dependency rules** — motivated by the fact that coding agents load these files into their model context before any tool call, so an out-of-date file can mislead the agent into navigating to the wrong places.

## Problem Statement
Context files are written by humans and maintained outside the repository's validation regime — no tests, no CI, nothing enforces that their architectural claims match the code. They extend the classic documentation-drift problem (stale README/docs) with a new operational stake: agents consume them *pre-emptively*, before seeing any code. The paper asks how stale these files actually are and what stale content means for agent navigation.

## Method
- Corpus: 3,602 agent context files from 3,346 open-source projects, with **LLM-assisted claim extraction and human adjudication** of all flagged findings.
- Two claim classes audited: *file path claims* (references to files/directories) and *file-to-file dependency rules* (asserted dependencies between files).
- Exploratory commit analysis over **7,480 commits** (new rule-break rates, agent-assisted vs. other commits).

## Key Findings
- **Path claims mostly resolve, and failures are mostly benign**: ~5% of path claims fail to resolve, but only **2.2%** are true errors — the rest are alternative file references. For comparison, ~**3.5%** of README path claims are broken.
- **Stale paths get repaired**: when code moves, **61%** of claims that became stale are fixed, most of them in the *same* commit.
- **Dependency rules rot silently**: **33 of 184 (18%)** asserted file-to-file dependency rules were already broken at the time of writing — high-value cross-file claims are neither validated nor repaired.
- **Agent-assisted rule breaks: early signal only**: in an exploratory comparison over 7,480 commits, new rule breaks were rare; agent-assisted commits broke rules about **1.8× as often** as other commits (0.29% vs 0.16%), but with only **14 breaks total** this is *not significant* — an early signal, not evidence of a difference or of its absence.

## Interpretation
The authors' synthesis: agent context files are **good maps, not reliable rulebooks**. File-level orientation content (where things live) is accurate and self-correcting; cross-file dependency assertions are neither validated nor repaired, so they should not be trusted as ground truth — agents navigating by them can confidently walk to the wrong place.

## Relevance to Our Domain
Actionable for our own agent workflows (this KB's agent setups rely on context files too): (1) keep CLAUDE.md/AGENTS.md-style maps — the path layer is trustworthy; (2) don't encode asserted file-to-file dependency rules in context files as verified facts — roughly 1 in 5 is already wrong; (3) a cheap lint resolving every path claim would catch the residual true errors; (4) extends documentation-drift literature to the new artifact class agents read verbatim.

## References
- Paper: https://arxiv.org/abs/2611.29916
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.29916
