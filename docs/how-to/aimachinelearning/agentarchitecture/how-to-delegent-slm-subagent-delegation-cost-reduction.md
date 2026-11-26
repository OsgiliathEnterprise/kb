---
title: 'Delegent: A Multi-Agent Harness That Reduces Cost without Sacrificing Performance'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.33098
date: 2026-11-24
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Delegent: A Multi-Agent Harness That Reduces Cost without Sacrificing Performance
**Authors:** Lingwei Gu, Jimmy Lin
## Overview
Frontier-model agents are expensive because at every step the big model re-reads its whole context and personally executes every subtask, easy or hard. Delegent tests the thesis that most of that spend is avoidable: keep the frontier model in charge of the task, but hand *focused, easy* subtasks (investigating code, running tests, searching a corpus) to a small language model running on hardware you already own. With a 27B FP8 SLM as subagent, frontier cost drops 67% on long-horizon coding and 59% on agentic search at no measured performance loss.
## Problem Statement
Agentic workloads mix decisions that genuinely need frontier capability with mechanical legwork (grep, read, test-run, search). Model routers and cascades pick one model for the *whole* task, so they either overpay (frontier everywhere) or underperform (small model everywhere). Neither exploits the subtask structure of an agent trajectory.
## Key Contribution
- **Subtask-level delegation instead of task-level routing**: the frontier model always leads execution and dispatches scoped subtasks to SLM subagents; no router or extra model is trained, and either model can be swapped freely.
- Built as a simple harness on top of Claude Code, demonstrating the pattern is implementable today with existing agent frameworks.
- Quantified savings: **−67% frontier cost on long-horizon coding, −59% on agentic search** with a 27B FP8 SLM; even a laptop-sized **2B SLM cuts coding cost by 66%**.
- Design insight: savings scale with how much legwork the frontier model would otherwise do itself, and **one short instruction** — telling the main agent to keep core coding tasks itself — accounts for most of the saving and stops the 2B subagent from losing tasks.
## How-to: Cut Agent Cost with SLM Subagent Delegation
1. Start from your existing agent harness (the paper builds on Claude Code); keep the frontier model as the orchestrator of every task.
2. Identify delegable subtask archetypes in your trajectories: code investigation/reading, running tests, corpus search — bounded, verifiable, low-judgment steps.
3. Expose these as focused subagent tools that route to a locally hosted SLM (the paper uses a 27B FP8 model; a 2B laptop model already captures most coding savings).
4. Add a short system instruction to the frontier agent: delegate investigation/legwork but **retain the main coding/decision work**. This single guardrail carries most of the savings and prevents quality collapse with tiny subagents.
5. Keep both models swappable: because nothing is trained, you can upgrade either side independently — re-benchmark delegation aggressiveness after swaps.
6. Measure frontier-token spend and task success separately; the expected regime is large frontier-cost reduction with flat task performance.
## Results
- Long-horizon coding: frontier cost −67% (27B FP8 SLM), no loss in task performance.
- Agentic search: frontier cost −59%.
- Laptop-class 2B SLM: −66% coding cost; the delegation-discipline instruction is what keeps it from losing tasks.
## Relevance to Our Domain
This is directly actionable for the KB's agent-infrastructure and FinOps coverage: subtask-level SLM delegation is a cheaper and more robust control than router-style model selection, and the "one instruction" finding means teams can adopt it without retraining or complex orchestration. Code is public (github.com/castorini/delegent).
## References
- Paper: https://arxiv.org/abs/2611.33098
- Code: https://github.com/castorini/delegent
- Related: [[explanation-anatomy-of-an-agent-harness]], [[explanation-decentralized-multi-agent-attacks-defenses-hop-by-hop-delegation]]
