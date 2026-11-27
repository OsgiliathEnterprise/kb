---
title: 'Evaluating More with Less: Black-Box Test Selection for AI Agents'
diataxis: How-to Guide
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.34617
date: '2026-11-27'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- how-to
---
# How to Select Agent Test Cases Black-Box (Evaluating More with Less)

## Overview
Asgari, Olsthoorn, van Deursen & Panichella (arXiv:2611.34617, submitted 2026-11-25) run the **first empirical study of black-box Test Case Selection (TCS) for agentic software systems**. Agentic stacks change constantly (model, prompt, scaffold, tools, environment), so they need repeated regression testing — but full benchmark runs are expensive. Prior TCS work (DNNs, LLM code models) needs model internals, unavailable for proprietary agents. The authors select tasks *without executing the target agent and without past results*.

## Procedure
1. **Treat each benchmark task as a test case.**
2. **Build selection criteria from black-box artefacts only**: task descriptions, metadata, code fragments, and embeddings.
3. **Optionally estimate task difficulty** with (a) heuristic features or (b) **independent LLM-as-judge assessments** — a separate judge model, not the agent under test.
4. **Pick the strategy per objective** — the study's central finding is that *no single strategy dominates* both Success-Rate estimation and early failure detection:
   - **Success-Rate estimation** → adapted black-box regression-testing strategies, best: **Category Partition** (lowest median error on 5 of 10 benchmarks at a 20% task budget).
   - **Early failure detection** → **LLM-as-judge selection**.
5. **Validate on realistic scale**: the study covers **14 selection strategies** (+ random sampling and a historical-data baseline) across **10 AI agent benchmarks** with 12–101 agents per benchmark.

## Concrete Numbers
- **GPT 5.2 Codex on SWE-bench Verified**: Category Partition selects **100 instead of 500 tasks**, cutting execution cost from **$225 to $47**, with Success-Rate estimation error of **0.8 percentage points**.
- At the same 20% budget, **LLM-as-judge selection reveals failures in 53.0% of selected tasks vs 27.4% for random sampling** — nearly 2× failure-finding efficiency.

## When to Use
CI for agentic products on proprietary models: cheap task-metadata/embedding features for regression dashboards (SR estimation); a judge model for release-gating failure hunts.

## Relevance to Our Domain
Turns benchmark spending into an engineering decision with measured trade-offs; pairs with Harbor's Oracle/NOP proof discipline ([[tutorial-harbor-coding-agent-evaluation-oracle-nop]]).

## References
- Paper: https://arxiv.org/abs/2611.34617
