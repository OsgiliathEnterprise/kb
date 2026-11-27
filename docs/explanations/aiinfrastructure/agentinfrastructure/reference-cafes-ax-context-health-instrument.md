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
Coding agents succeed or fail based on the context humans provide, yet evaluations measure only outputs. Teams therefore have no structured way to tell whether an agent struggled because the task context was defective — or because the model was. The economic stakes come from DX's State of AI Impact in Engineering Q3 2026 report (500+ orgs): AI spend per developer rose **$63 → $1,314 over four quarters** while median innovation ratio moved only 57% → 59% — that gap motivates measuring context quality as delivery friction. Authors are Gratiana Fu, Josh Beitler, Brian Houck (DX, Salt Lake City); the paper builds on DevEx/SPACE/EngThrive measurement traditions, CAFE(S) from Houck et al. 2026b, and LLM-as-a-judge (Zheng et al., MT-Bench). Closest precedent: ProofAgent-Harness, a seven-criterion rubric scored by multiple model jurors.

## Instrument Specification
- **Dimensions (CAFE(S))**: Clarity (unambiguous interpretation), Actionability (objectives, constraints, completion criteria support proceeding), Fidelity (accurate, current, consistent), Efficiency (usable without unnecessary context or search) — 1–5 each; Security scored as a gate, out of scope for friction scoring. Each dimension maps to a different fix: ambiguous term → disambiguation; missing definition of done → objective; wrong reference → correction; bloated context → selective provision.
- **Scorer**: rubric-guided language model rates each dimension on a session transcript and explains the missing human input. The scoring evaluator may differ from the model that executed the task.
- **Unit of analysis**: the agentic session transcript (what the human provided), not the final diff.

## Validation Studies (headline numbers)
| Study | Finding |
|---|---|
| Stack Overflow Developer Survey | Respondents reporting context problems were 12–28% less likely to rate AI "very useful" across all seven activities examined |
| 882 rated sessions (pilot of 1,000) | Actionability scored worst (59.6% of ratings ≤3, vs 26.6% for Fidelity); ratings drop in longer sessions; unblinded spot-check of 15 sessions found all scores reasonable |
| Controlled defect injection (12 runs of a data-analysis task: clean baseline + 4 single CAFE defects + 6 defect pairs + all-four) | Every injected context defect raised token use vs clean baseline (mean **+91%**); five evaluator models flagged 50–85% of targeted dimensions and 14–36% of non-targeted ones; Fidelity detected most consistently (22/25 targeted assessments), Actionability least (13/25 — partly because completion criteria were supplied later in the session in those conditions) |

Authors flag the injection study as exploratory (interventions imperfectly isolated).

## Measurement Behaviour (what to copy, what to watch)
- **Sample reality check**: 1,000 pilot transcripts yielded 968 distinct sessions but only **882 numerically rated** on each dimension — 86 dropped (73 "insufficient evidence", 13 non-numeric). Any real deployment will lose ~9% of sessions to unratable evidence.
- **Ratings fall as sessions grow** — Spearman ρ vs message count: Clarity −0.213, Actionability −0.344, Fidelity −0.396, **Efficiency −0.529** (longest sessions are where context bloat bites hardest).
- **Scale design matters**: a 3-point anchored version concentrated 79.5% of Actionability ratings in the middle category (vs 14.2% top) — use 5-point, not 3-point. Rank correlation between prompt/scale variants was only **0.48–0.55**, so scores are not comparable across rubric versions; record evaluator model + prompt version with every score.
- **Repeatability is not yet demonstrated**: the three baseline runs had identical recorded scores, but provenance of independent calls was unestablished — agreement ≠ repeatability.
- **Evaluator models used** (five, same transcripts): Claude Haiku 4.5, Claude Haiku 5.5, GPT-6 Luna, GPT-6.1 Terra, Claude Opus 5.5. Evaluator choice moved targeted-detection from 50% to 85% — the instrument is evaluator-sensitive.
- **Diagnostic rule (exploratory, not prespecified)**: flag if score &lt; 3 **or** ≥ 2 rubric categories below that evaluator's CLEAN score. CLEAN itself always rated 4–5.
- **Dimension confusion to expect**: Clarity↔Actionability co-flagging dominated non-targeted flags — 13 of 38 non-targeted flags (31.6%), asymmetric (Actionability flagged in 11/15 Clarity-targeted runs; reverse only 2/15). The rubric permits one event to deduct on two dimensions if evidence supports both.
- **Token result caveat**: every defect condition beat the clean baseline (mean +91%), but totals are input-dominated including repeated cache reads. Output alone can move the other way: the Efficiency-defect condition produced **4,002 output tokens vs baseline 5,078** despite +50.7% total tokens. Billed cost and elapsed time were not estimated.

## Limits the authors state
One execution per condition (12 runs, 1 per condition) — five evaluator passes are repeated assessments, not replications. Automated checkpoint scores were not manually adjudicated (they measure agreement with an implemented checklist, not validated task accuracy). AX diagnoses the information environment, **not individual developers** — it must not be used to rank people. Intended scenario labels are insufficient where interventions overlap or later dialogue repairs an initial problem; blinded reference assessments are the stated next step.

## How to Use
Adopt AX as a *complement* to output/outcome metrics when evaluating agentic dev workflows: score transcripts along CAFE(S), track Actionability first (weakest observed dimension and the least reliably detected defect class), and treat persistent low scores as context-engineering backlog for the humans driving agents — the instrument's explanations name what to supply next time.

## Relevance to Our Domain
Our agent-infrastructure coverage needs input-side quality metrics: prompt/context health directly drives token spend (+91% with defects) and success. AX gives a concrete, rubric-based scoring design teams can replicate, and the CAFE(S) dimensions are a checklist for agent session instrumentation.

## References
- Paper: https://arxiv.org/abs/2611.33480
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33480
- Related in KB: `explanation-agent-kernel-fork-for-agents.md` (same topic), `explanation-contexture-runtime-context-eviction-agent-serving.md`
