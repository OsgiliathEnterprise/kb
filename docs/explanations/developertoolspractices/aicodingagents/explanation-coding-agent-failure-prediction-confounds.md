---
title: Coding Agent Failure Prediction — Separating Hard Issues from Bad Runs
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.08285
date: '2026-11-08'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Coding Agent Failure Prediction — Separating Hard Issues from Bad Runs

## Overview
Wu, Liu, Liu et al. (2026) stress-test a tempting operational idea for coding agents: **predict mid-run whether an agent will fail, so you can stop it early and spend compute on retries instead**. The paper's core argument is methodological — failure prediction is confounded. If you train predictors on all issues, they can simply learn *which issues are hard* rather than *what is going wrong in this run*, and look far better than they really are.

## Problem Statement
Existing early-failure predictors are evaluated without controlling for two confounds: (1) **issue difficulty** — a predictor that recognises historically-hard issues from their text can score well without observing the trajectory at all, and (2) **run-to-run variance** — the same model on the same issue succeeds or fails across seeds, so a "failure" label from a single run is a noisy target.

## Key Contribution
- An **AUROC-maximising trajectory predictor** distilled from Qwen3-32B into a compact 0.6B model, trained on 3,834 SWE-bench Verified trajectories; applied to four agent scaffolds (SWE-Agent, Mini-SWE-Agent, OpenHands, Terminus) across seven models (GPT-5, Claude Opus 4.5, Claude Sonnet 4.5, DeepSeek V3.2, Qwen3-Coder, Llama 3.3 70B, Granite 3.3 8B). Raw results: up to **3.5% savings on SWE-Gym, 1.5% on OpenHands, 1.2% on Terminus**.
- The **controlled matched-issue experiment**: for every (model, issue, scaffold) setting, four runs with different random seeds; predictors trained only on issues where behaviour is *consistent across seeds* and that share no instances with training.
- A **reduction of roughly 97% in measured savings** under those controls — most apparent predictive benefit was confound, not signal.
- Evidence that predictor behaviour depends on scaffold type, and a clear agenda for confound-free evaluation.

## Technical Approach
The distillation pipeline (32B teacher → 0.6B student) keeps prediction cheap enough to run inside the agent loop. The decisive innovation is experimental design, not architecture: matched-seed groups isolate trajectory-specific failure signals from (a) static issue difficulty and (b) label noise from stochastic runs. The gap between uncontrolled and controlled results *is* the paper's headline finding.

## Results
- Uncontrolled: up to 3.5% compute savings from early stopping.
- Controlled (matched issues, seed-consistent labels, disjoint instances): savings shrink ~97% — i.e., close to zero.
- Predictors transfer differently across scaffolds; a predictor tuned on SWE-Agent does not behave identically on OpenHands or Terminus.

## Relevance to Our Domain
Any "kill the failing agent run early" feature in our own agent orchestration must be evaluated the way this paper demands — matched issues across seeds, train/test disjoint at the issue level — or the budget savings reported in demos are largely illusory. Also a cautionary tale for interpreting SWE-bench-style agent evaluations generally: single-run labels encode both difficulty and luck.

## References
- Paper: https://arxiv.org/abs/2611.08285
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.08285
- Related KB: `explanations/developertoolspractices/aicodingagents/explanation-swebench-sota-coding-agents.md`, `explanations/aillm/llmevaluation/`
