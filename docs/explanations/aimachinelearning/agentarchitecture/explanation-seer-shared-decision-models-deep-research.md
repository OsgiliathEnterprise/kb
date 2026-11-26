---
title: 'Seer: Guiding Small Deep-Research Agents with Shared Decision Models'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.26423
date: 2026-11-19
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Seer: Guiding Small Deep-Research Agents with Shared Decision Models

## Overview
Deep-research agents spend most of their budget repeatedly deciding *what to search, what to read, what to verify* — a job usually delegated to a large cloud LLM. Seer (arXiv 2611.26423, Zhou et al., Nov 2026) attacks the on-device version of this problem: how to make **small** local models decide well without training them per-agent. The trick is to factor the decision loop into two roles — *action proposal* (still done by the agent LLM) and *learned consequence prediction + value estimation* (done by two small auxiliary models trained **once, offline, on a shared corpus of real research trajectories**, then reused across agents). The auxiliary models let the agent mentally try several candidate actions, but only ever *execute* the selected one, so discarded candidates cost no real tool calls.

## Problem Statement
Running research agents locally (privacy, control) forces small models with weak judgment, and inference-time guidance for them hits three obstacles:
1. **Exploration by real execution** (trying alternatives for real) burns tool calls and budget.
2. **Prompted self-evaluation** is bounded by the same weak model's judgment — it grades its own homework.
3. **Model-specific guidance** (fine-tuned critics per agent) incurs repeated adaptation costs as agents/models change.

## Key Contribution
- An inference-time framework that **separates action proposal from consequence prediction and value estimation**, so guidance is learned, shared, and model-agnostic.
- Two reusable offline-trained components from a shared corpus of real research trajectories:
  - a **tool-response simulator** trained on observed call–response pairs (imagines what a tool call would return), and
  - a **value estimator** trained on interaction histories labeled with discounted terminal correctness (scores candidate trajectories).
- **Zero-waste execution**: only the selected action is executed; only real tool responses enter the committed history — discarded candidates are evaluated purely in imagination, with no extra tool-call cost.

## Technical Approach
At each decision step the agent LLM proposes candidate actions; the simulator rolls them forward by predicting tool responses offline (no real calls), and the value estimator scores the imagined continuations. The highest-value candidate is committed and executed for real. Because both guidance models are trained on a shared trajectory corpus and never retrained per agent, they function as drop-in "decision models" that any agent can consult with extra local compute.

## Results
- GAIA accuracy: **13.6% → 41.7%** for Qwen3.5-4B and **22.3% → 50.5%** for Qwen3.5-9B — small local models approaching mid-tier performance.
- Improvements hold across multiple deep-research benchmarks and several base LMs.
- Analysis: **broader candidate coverage compensates for imperfect simulation**, but simulation and scoring errors cap the benefit of very wide imagined search — i.e., there is a practical width limit.

## Relevance to Our Domain
This is a concrete recipe for the agent-infrastructure problem of *cheap agent runtimes*: instead of scaling the actor, add a small learned world-model + critic beside it. The "shared, offline-trained, reusable decision models" pattern maps directly onto our agent harness work (see [[explanation-actor-judge-teacher-decision-models]] and the sandboxed-execution runtime notes) — the simulator/critic pair is infrastructure, not model-specific tuning.

## References
- Paper: https://arxiv.org/abs/2611.26423
- Related context: Deep Research Agents survey, https://arxiv.org/abs/2506.18096
