---
title: 'AutoMaster: Autonomous Post-Training by Making the Same Model a Better Teacher'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.26510
date: 2026-11-21
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# AutoMaster: Autonomous Post-Training by Making the Same Model a Better Teacher

## Overview
AutoMaster tackles a subtle SFT problem: successful teacher trajectories still teach bad habits — unsupported assumptions, unproductive repetition, superficial verification. The fix is behavioral shaping rather than more data: natural-language "skills" are injected into teacher rollouts to suppress undesirable habits and elicit underrepresented effective ones, and the target model is fine-tuned on the resulting trajectories. An LLM agent autonomously designs those interventions.

## Problem Statement
Task success alone does not specify which behaviors post-training should reinforce. Filtering for successful trajectories keeps trajectories that succeed *despite* bad process, and SFT then clones the process along with the outcome.

## Key Contribution
- **Skill-FT (Skill-Guided Fine-Tuning)**: natural-language skills steer teacher rollouts at generation time; fine-tuning happens on the shaped trajectories.
- **AutoMaster**: an autonomous post-training system where an LLM agent iterates the loop — trajectory analysis → skill design → data selection → feedback from rollouts and target-model evaluation.
- Gains of **1.42–8.99 percentage points** over vanilla SFT on successful unguided teacher trajectories, across Terminal, Search, and software-engineering tasks with 4B and 9B targets — with teacher, task pool, training-set size, and SFT recipe all held fixed.
- Retention finding: **keeping the skill instructions in the SFT training data beats removing them in all six settings**, even though skills are absent at evaluation and supervised outputs are identical — suggesting skill context acts as behavioral scaffolding that aids internalization.

## Technical Approach
The agent treats post-training itself as an optimization over interventions: mine failures/habits from teacher trajectories, draft skill text that discourages or encourages specific behaviors, regenerate rollouts with skills prepended, select data, and measure target-model evaluation to close the loop — no human-written intervention scripts.

## Relevance to Our Domain
For agent-training pipelines built on SFT from agent logs: curating only successful trajectories is insufficient; process-level shaping via natural-language skills is cheap and measurable. The "keep the skill text in training demonstrations" finding is a directly usable recipe detail for anyone distilling agent behavior into smaller models.

## Metadata (verified vs arXiv, 2026-11-21)
- Authors: Guoxin Chen, Shuang Sun, Fanzhe Meng, Xinyu Tang, Ruihua Song, Wayne Xin Zhao (RUC-AIBOX / Renmin University of China group).
- Submitted 2026-11-19, arXiv:2611.26510 [cs.CL], CC-BY-4.0.
- Official artifacts: project website, code, and released checkpoints are public (see References) — the loop is reproducible end-to-end rather than paper-only.

## References
- Paper: https://arxiv.org/abs/2611.26510
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26510
- Code: https://github.com/RUCAIBox/AutoMaster
- Models: https://huggingface.co/collections/RUC-AIBOX/automaster
- Website: https://aweai-team.github.io/AutoMaster/
