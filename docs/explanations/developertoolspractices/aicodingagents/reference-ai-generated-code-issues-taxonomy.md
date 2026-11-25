---
title: 'AI-Generated Code Issues: A Taxonomy from Repository Histories, AI Conversations,
  and Developer Interviews'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.32676
date: '2026-11-25'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# AI-Generated Code Issues: A Taxonomy from Repository Histories, AI Conversations, and Developer Interviews

**Authors:** Rosalia Tufano, Nargiz Humbatova, Daniele Bifolco, Gunel Jahangirova, Fiorella Zampetti, Massimiliano Di Penta, Paolo Tonella, Gabriele Bavota


## Overview
An ICSE 2027 mixed-methods empirical study that builds an **evidence-grounded taxonomy of 87 types of developer-attributed quality issues in AI-generated code**, going beyond functional bugs. The purpose is practical: let teams adapt code review and testing to the defect classes that are *more common in AI-generated than in human-written code*.

## Scope & Method (the three evidence sources)
| Source | Collection | Analysis |
|---|---|---|
| **Repository histories** | GitHub commits whose messages explicitly attribute a fix to a problem in AI-generated code | 914 matched commits manually inspected — false positives removed, corrected quality issue classified |
| **AI conversations** | Developers' shared conversations with AI coding tools | Conversations containing source code + textual signals of model mistakes; 299 manually analyzed and classified |
| **Interviews** | 20 practitioners and researchers who use AI coding tools | Enrich and validate the catalog of quality issues |

## The Taxonomy (lookup summary)
- **87 distinct issue types** attributed by developers to AI-generated code — deliberately extending past functional bugs (the abstract does not enumerate the category labels; consult the paper for the full tree).
- Triangulation across three independent evidence bases makes each category *developer-attributed* rather than researcher-imposed.
- Explicit design goal: issues that may be **more common in AI-generated code**, so QA effort (review checklists, test generation, CI gates) can be targeted rather than generic.

## Known Gaps / Limitations
- Attribution relies on commit messages naming AI as the cause — undercounting AI code fixed without attribution.
- The 914-commit, 299-conversation, 20-interview samples bound the taxonomy's coverage; long-tail ecosystems may exhibit uncovered categories.

## Relevance to Our Domain
This is the empirical backbone our AI code-review guidance has been missing: instead of guessing which defects to screen in agent-authored PRs, teams can adopt the paper's **87-type developer-attributed taxonomy** as a checklist seed for review prompts, AGENTS.md guardrails and CI policies. It also gives QA teams a defensible baseline for evaluating coding assistants — measure against issue classes, not just pass rates. Directly supports our AI-slop pull-request study note.

## References
- Paper: https://arxiv.org/abs/2611.32676
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32676
- Related in KB: explanation-ai-slop-pull-requests-oss-study.md, explanation-agent-context-files-architectural-claims.md
