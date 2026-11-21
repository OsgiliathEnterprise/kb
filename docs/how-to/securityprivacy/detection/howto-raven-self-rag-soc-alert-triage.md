---
title: 'RAVEN: A Self-RAG Based Agent for Threat Classification and Response'
diataxis: How-to Guide
domain: security-privacy
topic: detection
source: arXiv
source_url: https://arxiv.org/abs/2611.25832
date: '2026-11-21'
keywords:
- knowledge-base
- detection
- security-privacy
- how-to
---
# Building a Self-RAG SOC Triage Agent: RAVEN's Threat Classification and Response Workflow

## Overview
RAVEN (Francesco Aurelio Pironti, Luigi Arena, Francesco Blefari, Matteo Lupinacci et al., arXiv:2611.25832, submitted 2026-11-19) is a retrieval-augmented **agentic system for Security Operations Centre alert triage**. Its two design commitments: (1) triage decisions must be **traceable to authoritative knowledge sources**, and (2) the **human analyst stays in the loop** through the entire classification-and-mitigation process. This note distils its architecture into a reproducible procedure.

## Problem It Solves
Security Operation Centres drown in alert volume; first-line triage is repetitive, time-critical, and error-prone. Plain LLM triage lacks provenance, and static RAG lacks the interactive correction an analyst needs.

## Procedure (RAVEN's Architecture as a How-To)
1. **Ingest the alert** — take the raw IDS/web-attack alert as the agent's trigger input.
2. **Initial classification with Self-RAG** — retrieve from curated security knowledge sources and classify the threat using **self-reflective RAG**: the agent assesses the relevance/sufficiency of its own retrieved evidence and reasoning before committing to a label, so the initial classification is grounded and traceable.
3. **Open the analyst loop** — present the classification *with retrieved evidence*; support **interactive queries** so the analyst can challenge or refine the classification. The agent re-reasons with the analyst's feedback rather than restarting.
4. **Generate context-aware mitigation suggestions** — for the confirmed threat class, propose response measures that account for the **target enterprise's infrastructure context** (not generic playbook text).
5. **Evaluation discipline** — RAVEN's prototype was validated on **three balanced test sets of 400 carefully selected web payloads each, covering SQL injection, XSS, and Server-Side Template Injection**, plus a **qualitative case study on mitigation generation**. Full alert-based evaluation against **Snort and Suricata** IDS rules and a **user study** were reported as in progress — treat end-to-end efficacy as not yet published.

## Design Decisions Worth Copying
- **Self-RAG over vanilla RAG** for triage: the self-reflection pass is what makes the classification defensible to an analyst.
- **Analyst-in-the-loop as a first-class stage**, not a post-hoc review: refinement queries reshape classification and mitigation together.
- **Per-threat-class balanced payload sets** (SQLi/XSS/SSTI, 400 each) as the minimum credible unit-test suite for a web-attack triage agent.

## Caveats
The paper is early-stage: the headline components are implemented and payload-tested, but IDS-scale alert evaluation and the analyst user study were still pending at submission. Adopt the *architecture*, not performance claims.

## Relevance to Our Domain
A concrete blueprint for agent-assisted SOC operations — connects our self-evolving static-analysis triage note and agent-observability work to security detection workflows, and demonstrates self-RAG + human-in-the-loop as the defensible pattern for high-stakes classification.

## References
- Paper: https://arxiv.org/abs/2611.25832
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25832
- Related: [[howto-self-evolving-static-analysis-llm-pseudo-labeling]], [[reference-small-decision-model-vuln-campaign]]
