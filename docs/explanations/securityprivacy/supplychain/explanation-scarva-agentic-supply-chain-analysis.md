---
title: 'SCARVA: Interpretable Agentic Reasoning in Software Supply-Chain Analysis'
diataxis: Explanation
domain: security-privacy
topic: supply-chain
source: arXiv
source_url: https://arxiv.org/abs/2611.26131
date: 2026-11-19
keywords:
- knowledge-base
- supply-chain
- security-privacy
- explanations
---
# SCARVA: Interpretable Agentic Reasoning in Software Supply-Chain Analysis

## Overview
SCARVA (Supply-Chain Agentic Risk & Vulnerability Analyzer) is a framework for deciding whether a known vulnerability in a dependency actually endangers the application that imports it. A vulnerable dependency is not automatically exploitable — the vulnerable code may never be reachable. SCARVA combines LLM agents with an evidence-collection methodology so that the verdict arrives as an *interpretable, evidence-backed report* rather than an opaque agent conclusion.

**Paper metadata**: Tim Barsch, Bruno Nogueira, Tobias Wienand, Jan Fopma, Flavio Toffalini — arXiv:2611.26131 [cs.CR], submitted 2026-11-19, CC-BY 4.0, DOI 10.48550/arXiv.2611.26131.

## Problem Statement
Existing SCA tools flag dependencies associated with public vulnerabilities; more advanced ones analyze the call graph to assess whether vulnerable code is reachable — but are limited to specific languages and ecosystems. LLM agents generalize across ecosystems, yet they **hallucinate, take shortcuts, and reward-hack**; because their reasoning is opaque, their conclusions cannot be trusted for security triage.

## Key Contribution
- **ANALYST / JUDGE architecture**: an ANALYST agent performs the software-security assessment while SCARVA records *every* tool call, file access, and web request; one or more independent JUDGE agents then inspect the ANALYST's result and produce an evidence-backed report.
- An **evidence-collection methodology** that audits the agent's analysis and thereby improves trustworthiness — interpretability as an anti-hallucination control, not just a UX feature.
- Empirical characterization of the most common agent failure modes on supply-chain vulnerability assessment.

## Evaluation
- **54 manually curated cases**, balanced across exploitable, non-exploitable, and vulnerability-free projects; open-weight and frontier models both tested.
- Best ANALYST model: **Qwen 3.8 at 82% balanced accuracy**, surpassing the evaluated proprietary models.
- JUDGE validation against human annotation: **Claude Opus 5.5 best, agreeing with annotators on 94% of claim checks**.

## Relevance to Our Domain
Dependency triage at our scale means answering "is this CVE reachable in *this* app?" across polyglot stacks where call-graph tools fall short. SCARVA's record-everything + independent-judge pattern is a directly reusable design for trustworthy agentic security review — the same audit-the-agent principle we apply to agent evaluation generally (cf. faithfulness of agent work reports in this KB).

## Practical Takeaways
- **Audit-the-agent is the trust mechanism, not the model choice**: an open-weight ANALYST (Qwen 3.8) beat proprietary models on balanced accuracy, but the paper's credibility rests on recording *every* tool call, file access, and web request so independent JUDGEs can verify claims — adopt the trace-first design before optimizing model selection.
- **Judge-as-annotator is nearly human-grade**: Claude Opus 5.5 agreed with human annotators on 94% of claim checks, suggesting automated evidence auditing can be productionized for triage queues rather than being a research-only scaffold.
- **Baseline gap**: call-graph reachability tools are language-locked; SCARVA's LLM-agent approach targets exactly the polyglot cases where they go silent — treat its 82% balanced accuracy as the current reference point for agentic reachability on a 54-case balanced benchmark.

## References
- Paper: https://arxiv.org/abs/2611.26131
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26131
- Related in KB: `explanation-sbind-behavioral-containment-1-day-detection.md`, `software-development/ai-assisted-development/explanation-unfaithful-work-reports-coding-agents.md`
