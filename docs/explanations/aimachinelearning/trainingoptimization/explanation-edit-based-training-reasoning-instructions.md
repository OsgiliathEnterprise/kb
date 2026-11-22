---
title: Training LLMs to Follow Reasoning Instructions with Minimal Edits
diataxis: Explanation
domain: ai-machine-learning
topic: training-optimization
source: arXiv
source_url: https://arxiv.org/abs/2611.26342
date: 2026-11-22
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- explanations
---
# Training LLMs to Follow Reasoning Instructions with Minimal Edits

## Overview
This paper (arXiv 2611.26342, Yakovleva et al., Nov 2026) proposes **edit-based training**: learning from a model's *own* sampled trajectories by supervising only **localized textual corrections** instead of whole completions. An editor finds the first point where a completion fails a criterion, proposes a minimal replacement span, and the model is trained only on that edited span. The authors instantiate it on *reasoning instruction following* (making a model adhere to how you asked it to reason — e.g., verbosity, structure, style of the trace) with Qwen3-32B on the ReasonIF benchmark.

## Problem Statement
Training signals for shaping extended reasoning traces are coarse at both ends:
- **SFT on full trajectories** forces imitation of an entire demonstration, over-constraining the output distribution and risking degradation of unrelated skills.
- **Trajectory-level RL** gives weak credit assignment — a scalar reward for a whole completion tells the model nothing about *where* it went wrong.

Both treat the completion as an atom. Failures in long reasoning traces are, in practice, *local*.

## Key Contribution
- A general **edit-based training** framework: sample → editor locates first failure point under a criterion → editor proposes a **minimal replacement span** → supervised loss only on the edited span.
- Supervision concentrates exactly where reasoning first breaks down; the rest of the model's reasoning behavior is left untouched by construction.
- Works **offline** (pre-built edits) and **online** (edits continually adapt to the model's evolving failure modes as it improves).

## Technical Approach
Given a sampled completion, an editor (a scripted verifier, an LLM editor, or a hybrid) evaluates it against a specified failure criterion, pinpoints the earliest failure, and rewrites the smallest span that fixes it. The training target is not the whole trajectory but that span — a middle ground between imitation (too much signal) and outcome RL (too little signal). The online variant re-runs the editing loop against current samples, so the supervision distribution tracks the model's current failure frontier.

## Results
- On ReasonIF with Qwen3-32B, edit-based training **substantially improves compliance with the reasoning instruction** compared to full-trajectory imitation and trajectory-level RL baselines.
- Skill preservation: untargeted tasks are largely unaffected — the property full-trajectory SFT typically fails.

## Relevance to Our Domain
For anyone operating RL/SFT post-training pipelines (our Training Optimization topic), this reframes "where does the gradient come from" for reasoning-shape control: localized correction is a cheap complement to both SFT and RLVR. It also pairs naturally with judge-based harness work — the "editor finding the first failure point" is essentially a trained judge emitting a patch instead of a score. See [[explanation-group-standard-deviation-identity-grpo-drgrpo-dapo]] for the trajectory-level RL side of the same credit-assignment spectrum.

## References
- Paper: https://arxiv.org/abs/2611.26342
