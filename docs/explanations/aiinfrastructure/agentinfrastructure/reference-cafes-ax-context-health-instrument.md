---
title: 'DevEx is for Humans, AX is for Agents: Measuring Context Health in Agentic
  Software Work'
diataxis: Explanation
domain: ai-infrastructure
topic: agent-infrastructure
source: arXiv
source_url: https://arxiv.org/abs/2611.33480
date: 2026-11-24
keywords:
- knowledge-base
- agent-infrastructure
- ai-infrastructure
- explanations
---
# DevEx is for Humans, AX is for Agents: Measuring Context Health in Agentic Software Work

## Overview
Agent Experience (AX) is an instrument that scores coding-agent *session transcripts* on the quality of the context humans gave the agent — the input side that output/outcome metrics ignore. It operationalizes the **CAFE(S)** framework — Clarity, Actionability, Fidelity, Efficiency, with Security handled as a gate rather than a friction dimension — via a rubric-guided LLM rating (1–5 per dimension) that also explains what the human could have provided. (Reference-type note: specification of the instrument, its dimensions, and the headline statistics from its three validation studies.)

## Problem Statement
Coding agents succeed or fail based on the context humans provide, yet evaluations measure only outputs. Teams therefore have no structured way to tell whether an agent struggled because the task context was defective — or because the model was.

## Instrument Specification
- **Dimensions (CAFE(S))**: Clarity, Actionability, Fidelity, Efficiency (1–5 each); Security scored as a gate, out of scope for friction scoring.
- **Scorer**: rubric-guided language model rates each dimension on a session transcript and explains the missing human input.
- **Unit of analysis**: the agentic session transcript (what the human provided), not the final diff.

## Validation Studies (headline numbers)
| Study | Finding |
|---|---|
| Stack Overflow Developer Survey | Respondents reporting context problems were 12–28% less likely to rate AI "very useful" across all seven activities examined |
| 882 rated sessions (pilot of 1,000) | Actionability scored worst (59.6% of ratings ≤3, vs 26.6% for Fidelity); ratings drop in longer sessions; unblinded spot-check of 15 sessions found all scores reasonable |
| Controlled defect injection (12 runs of a data-analysis task) | Every injected context defect raised token use vs clean baseline (mean **+91%**); five evaluator models flagged 50–85% of targeted dimensions and 14–36% of non-targeted ones; Fidelity defects detected most consistently, Actionability least |

Authors flag the injection study as exploratory (interventions imperfectly isolated).

## How to Use
Adopt AX as a *complement* to output/outcome metrics when evaluating agentic dev workflows: score transcripts along CAFE(S), track Actionability first (weakest observed dimension and the least reliably detected defect class), and treat persistent low scores as context-engineering backlog for the humans driving agents — the instrument's explanations name what to supply next time.

## Relevance to Our Domain
Our agent-infrastructure coverage needs input-side quality metrics: prompt/context health directly drives token spend (+91% with defects) and success. AX gives a concrete, rubric-based scoring design teams can replicate, and the CAFE(S) dimensions are a checklist for agent session instrumentation.

## References
- Paper: https://arxiv.org/abs/2611.33480
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33480
- Related in KB: `explanation-agent-kernel-fork-for-agents.md` (same topic), `explanation-contexture-runtime-context-eviction-agent-serving.md`
