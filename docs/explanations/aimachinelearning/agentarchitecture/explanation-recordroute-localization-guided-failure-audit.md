---
title: 'RecordRoute: Auditing Agent Failures with Localization-Guided Diagnosis'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.33022
date: '2026-11-25'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# RecordRoute: Auditing Agent Failures with Localization-Guided Diagnosis
**Authors:** Yifan Duan, Lihuan Li, Chao Xue, Siyuan Zheng, Du Yin, Flora D. Salim
## Overview
Auditing a failed agent run means answering three coupled questions: **who** (responsible actor), **where** (earliest decisive step), and **what** (error mode). RecordRoute couples two stages instead of treating them separately: a *localization* stage ranks execution records via within-trajectory comparisons to pin actor and step, then a *diagnosis* stage predicts the error mode from just that record's text and metadata. The separation is the point — feeding the whole trace to a general reasoner dilutes the signal.
## Problem Statement
Agent trajectories interleave decisions across agents, tools and environments, and failure evidence concentrates on a few decisive records. General-purpose LLM diagnosis over the full trace is unfocused, while pure localization methods (e.g. StepFinder) stop before naming the error mode. The two tasks are structurally coupled — the best evidence for the mode is the record identified by localization — yet existing pipelines don't exploit the coupling.
## Key Contribution
- Problem formulation for **agent auditing** as the joint triple: responsible actor + earliest decisive step + error mode.
- **Comparative localization**: execution records are encoded with word- and character-level features and ranked via *within-trajectory comparisons*, so the decisive record stands out against its own context.
- **Local diagnosis**: the selected record's text plus metadata drive error-mode prediction — no full-trace reasoning.
- Consistent wins on both synthetic and natural failures, including transfer to benchmarks it wasn't tuned on.
## Technical Approach
Records (steps/events in the trajectory) get dual-granularity encodings (word + character features). Ranking is comparative inside each trajectory rather than absolute scoring. The top record fixes actor and step; its content and metadata (tool identity, environment, status) feed the mode classifier. Evaluation spans controlled injections and natural failures: **Who&When Pro** (official multi-metric benchmark, controlled injections) plus **TraceElephant** and **CatchBench POST** (natural failures).
## Results
- Who&When Pro: state of the art on **all four official metrics**, beating StepFinder and ASCon.
- Decisive ablation: with actor/step fixed, local diagnosis reaches **77.47% pooled joint accuracy vs 69.28%** for full-trace diagnosis — the evidence-focused design wins outright.
- Natural failures: outperforms StepFinder, ASCon and three open LLMs on TraceElephant and CatchBench POST.
## Relevance to Our Domain
Agent observability tooling in this KB (failure recovery, trajectory analysis, production agent reliability) needs exactly this: cheap, targeted post-mortems for failed runs in CI and production. The 8-point gap between local and full-trace diagnosis is a design lesson for anyone building agent-eval dashboards — localize first, then diagnose the pinpointed record.
## References
- Paper: https://arxiv.org/abs/2611.33022
- Related: [[explanation-coding-agent-failure-prediction-confounds]], [[howto-diagnose-agent-failure-mode-before-fixing]], 
