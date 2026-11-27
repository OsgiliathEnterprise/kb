---
title: 'JET: Just-Enough Exploration Tuning for Efficient Tool-Calling Agents in Repository-Level
  Question Answering'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.22539
date: '2026-11-27'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- how-to
---
# JET: Just-Enough Exploration Tuning for Efficient Tool-Calling Agents in Repository-Level Question Answering

## Overview
Choi, Han & Lee identify **over-exploration** in repository-level QA agents: LLM agents keep invoking tools (grep, read, search) even after the gathered context already suffices to answer. Worse, standard SFT on expert trajectories *propagates* the experts' over-exploration into the student model. **JET (Just-Enough Exploration Tuning)** is a fine-tuning recipe that trains the agent to stop exploring and answer the moment evidence is sufficient — cutting tool calls by 11–33% (self-generated trajectories) or 18–28% versus SFT (expert trajectories) while retaining nearly all answer quality.

## When to Use This
You fine-tune a tool-calling agent for repo QA (or similar gather-then-answer workloads) and see wasted tool round-trips inflating latency and inference cost — especially when distilling from expert traces that themselves over-explore.

## Steps (the JET recipe)
1. **Collect trajectories** — either expert demonstrations or the agent's own rollouts on repo-level QA tasks.
2. **Locate the sufficiency step** — for each trajectory, determine the earliest step at which the accumulated tool observations already contain enough information to answer the question correctly.
3. **Truncate at sufficiency** — cut the trajectory there, discarding the redundant later tool calls.
4. **Insert a rationale** — append a short explanation at the truncation point stating *why* the gathered evidence already justifies answering now.
5. **Weighted fine-tune** — fine-tune the model on these truncated trajectories with a **higher loss weight on the rationale tokens**, so the stop-when-sufficient judgment is the strongly-learned signal.
6. **Evaluate on both regimes** — measure tool-call count and answer score separately on self-generated vs expert-derived trajectories; JET should cut calls in both while keeping score.

## Concrete Results
- Two repo-level QA benchmarks, two open-weight **8B** models.
- Self-generated trajectories: **11–33% fewer tool calls**, score largely preserved.
- Expert trajectories: **18–28% fewer tool calls than vanilla SFT**, retaining most of SFT's score gain.
- Lower inference cost in both settings.

## Relevance to Our Domain
A cheap, reproducible efficiency lever for the coding-agent stacks we cover: over-exploration is directly observable in our own agent traces (repeated identical greps, re-reads of unchanged files). The truncate-at-sufficiency + rationale-upweighting pattern is a template applicable beyond repo QA — any tool loop with a definable "enough evidence" predicate. Related: [[explanation-modharness-rl-evolving-harness-programs]].

## Enriched Details (verified from arXiv v1 full text, 2026-11-27)

**Provenance.** Yoonho Choi, Taehyeon Han, Seonghyeon Lee — School of Computer Science and Engineering, Kyungpook National University, Daegu; preprint, 13 pages, 8 figures, 5 tables; submitted 2026-11-17 (cs.CL).

**The evidence for over-exploration.** Force the agent to answer after *every* step and judge each intermediate answer: the score **plateaus while tool calls continue**. Canonical case (SWE-QA-Pro, Qwen3-8B): the answer forced after the 3rd tool call scores *higher* than the final answer after 29 calls. The plateau also appears in the expert SFT trajectories themselves — which is why vanilla SFT distills the waste.

**Recipe specifics.**
- **Golden step labeling:** sample **K=3** forced answers per step at temperature 0.6, mean judge score S̄ᵢ; golden step i* = **earliest argmax** of S̄ᵢ. When no reference answer exists (expert trajectories), the trajectory's own final answer serves as reference — so JET also works without gold answers.
- **Rationale insertion:** a stronger LLM (Qwen3.8-27B in the paper) writes a short rationale naming the files/functions examined and stating why they suffice; trajectory ends with (rationale, golden-step answer) before the `<finish>` block.
- **Halting weight:** λ=5 on the tokens of the last assistant turn before `<finish>` (the "halting span"), 1 elsewhere; weighted CE normalized by Σw_t so λ redistributes loss without inflating magnitude.
- **Training:** LoRA rank 32, lr 5×10⁻⁴, effective batch 16 trajectories, ≤4 epochs (RTX PRO 6000 + H100). Checkpoint selection: highest score *among checkpoints with fewer tool calls* than the comparison agent.

**Setup numbers.** Benchmarks: SWE-QA-Pro (260 questions) and SWE-QA (720), run on the SWE-QA-Pro scaffold (substring search, file viewer, read-only shell); models Qwen3-8B and Ministral-3-8B-Instruct; 32K context, step limit 30, temperature 0. Self trajectories = rollouts on 400 non-overlapping training questions; Expert = the 1,000 Claude-Sonnet-4.5 SFT trajectories shipped with SWE-QA-Pro. Judges: GPT-6 Sol (SWE-QA-Pro), Claude Sonnet 5.5 (SWE-QA); GPT-6 Luna for golden-step scoring.

**Headline numbers (per 1,000 questions).**
- Self, Qwen3-8B / SWE-QA-Pro: calls 18.1 → **12.19 (−33%)**, cost **$19.2 → $8.5**, score 30.88 → 30.84 (flat).
- Expert vs SFT: JET −26%/−28% calls at most of the score gain; with Ministral JET even **beats SFT on score** (36.91 vs 35.10) at −20% calls.
- **JET→JET two-stage** (train on Expert, regenerate, retrain on Self rollouts): up to **−45% calls**, e.g. Qwen3-8B SWE-QA-Pro 35.08 score at 12.87 calls.

**Baselines fail where JET succeeds.** Budget Tracker (prompt the remaining budget) *increases* calls +44% for Qwen3 Self — remaining budget doesn't reflect gathered information. The frontier-LLM Autorater cuts calls −50% but costs extra LLM calls per step and drops score up to 2.6 pts (Expert: 37.07→34.49). Truncated SFT (cut at golden step, no rationale/weighting) barely moves expert-trajectory calls (−3% vs JET's −26%) — the rationale + halting weight carry the effect. JET is the only method covering free-form answers + trained + step-sufficiency supervision; AutoSearch/DAS need binary gold-answer matching and &lt;5-call tasks, while repo QA runs >10 calls with scale-scored free-form answers (only an *implicit* correctness signal).

## References
- Paper: https://arxiv.org/abs/2611.22539
- HTML v1 full text: https://arxiv.org/html/2611.22539v1
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22539
