---
title: 'SheetAlign: Grounded Interaction and Stage-Isolated Learning for Spreadsheet
  Agents'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.26069
date: '2026-11-22'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# SheetAlign: Grounded Interaction and Stage-Isolated Learning for Spreadsheet Agents

## Overview
SheetAlign is a framework for building spreadsheet-manipulation agents on top of **locally deployed open-weight LLMs** (cheap, private deployment). Its core idea is to split the agent's job into three isolated stages — *where to operate*, *what to change*, *how to implement* — ground each stage in real workbook observations and the available API surface, and train each stage separately with edit-progress rewards.

## Problem Statement
Automating spreadsheet analysis must protect sensitive data and control cost, which favors local small models. But spreadsheet tasks demand both **task reasoning** and **workbook understanding**, and predefined operation interfaces add further **tool-selection and invocation** burdens. Small models fail when all these demands are entangled in one monolithic generation step.

## How-To: Build a Stage-Isolated Spreadsheet Agent
Follow the SheetAlign recipe:

1. **Decompose the task into three decision stages** and handle them separately:
   - *Where to operate*: identify target sheets/ranges via **task-guided inspection** of the workbook;
   - *What to change*: decide the semantic modification;
   - *How to implement*: generate code against the API.
2. **Anchor generation in observations (grounding).** Feed the code generator both real workbook state (via inspection tools) and the catalog of **available operations (API grounding)** so generated programs use only calls that actually exist. In the paper this alone lifts Qwen3-4B from 13.5% → 29.2% average accuracy on SpreadsheetBench *without any training*.
3. **Train stages in isolation (stage-isolated policy learning).** Optimize program *generation* and program *review* as separate stages using **edit-progress rewards** (reward is shaped by measurable progress toward the target workbook state), rather than one end-to-end outcome reward.
4. **Add execution consistency at inference.** Execute candidate programs and **select the program whose resulting workbook states agree** across runs/candidates — agreement among realized states is the selection signal, not self-reported confidence.

## Results
- **32.8%** average accuracy on SpreadsheetBench and **30.1%** on Domain-Spreadsheet with a 4B-class local model, outperforming comparable baselines.
- Ablation order matters: grounding (+15.7 pts) provides most of the win; learning and execution consistency add the rest.

## Relevance to Our Domain
A concrete, reproducible pattern for **tool-using agents with operation interfaces**: stage isolation, edit-progress rewards, and execution-consistency voting are directly reusable for any code-generation agent that mutates external state (config files, IaC, dashboards). Also a data point that small local models become viable agents once the interaction scaffolding is right.

## References
- Paper: https://arxiv.org/abs/2611.26069 (arXiv:2611.26069, submitted 2026-11-19; code promised upon publication)
- Benchmark: SpreadsheetBench
