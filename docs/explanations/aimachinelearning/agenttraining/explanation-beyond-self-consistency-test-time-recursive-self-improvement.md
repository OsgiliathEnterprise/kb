---
title: 'Beyond Self-Consistency: Recursive Self-Improvement at Test Time'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.30965
date: '2026-11-25'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# Beyond Self-Consistency: Recursive Self-Improvement at Test Time

## Overview
Wu, Wang, Su et al. (arXiv:2611.30965, cs.CL/cs.AI/cs.LG, submitted 2026-11-23) argue that the dominant test-time improvement recipe — self-consistency with majority voting — wastes the reasoning already produced, and propose **TT-RSI** (Test-Time Recursive Self-Improvement), a label-free framework where the model iteratively re-solves each question using its *full previous solution* as reference, and then distills those successive refinements back into its own weights.

## Problem Statement
Test-time self-improvement methods operate on unlabeled questions and rely on self-consistency: generate independent solutions, take a majority vote to select an answer or build training targets. Two structural flaws follow: (1) earlier reasoning traces are discarded at inference instead of being built upon, and (2) during training, voting can *reinforce an incorrect majority* — if the model's first attempts agree on a wrong answer, more samples entrench the error. Humans instead preserve useful partial reasoning from earlier attempts, correct mistakes incrementally, and refine strategy.

## Key Contribution
- **In-Context RSI**: each question is repeatedly re-solved with the complete previous solution as reference; the model itself decides whether and how to reuse it, so inference compute *accumulates* instead of sampling i.i.d. candidates.
- **In-Weight RSI**: successive refinements are distilled into the model's weights, which lets the model break past an initially wrong majority and theoretically pulls the *first attempt* toward the model's infinite-step refinement limit.
- **Virtuous cycle**: the updated model answers better *and* refines more effectively, producing stronger references for the next training round.
- **Results**: +13.89% average accuracy over the base model and +4.79% over the strongest self-consistency baseline under an equal test-time scaling budget.

## Technical Approach
The two components are mutually reinforcing. At inference, refinement is sequential and reference-conditioned rather than parallel and independent — an analogy to iterative code review rather than n-way best-of voting. The distillation step converts behavioral refinement trajectories into weight updates, so gains persist across attempts rather than being re-paid on every inference call. The theoretical claim (first attempt → infinite-step refinement limit) gives the weight-update loop a principled role beyond empirical boosting.

## Results
Extensive experiments show +13.89% average accuracy vs the base model; +4.79% over the strongest self-consistency-based method at matched test-time compute budgets.

## Relevance to Our Domain
This is directly relevant to agent training pipelines: it challenges the default "sample k, vote" pattern used in most synthetic-data and test-time-scaling loops for agents, and offers a label-free data flywheel (model generates its own refinement supervision). Complements prior KB notes on recursive self-improvement (Experience-Handoff RL, RSI-Prime, "Do LLM Agents Still Need to Be Told How to Self-Improve?").

## References
- Paper: https://arxiv.org/abs/2611.30965
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30965
