---
title: Actor, Judge, or Teacher? — Decision Models in Long-Horizon Agents
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.17167
date: '2026-11-13'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Actor, Judge, or Teacher? Understanding Decision Models in Long-Horizon Agents

## Overview
A "decision model" reads a situation and emits a typed output — a choice among options with a probability per option — instead of free text. The same kind of model can therefore serve three very different roles in an agent system: pick actions (actor), evaluate actions (judge), or score every action to train a policy (teacher). This paper's headline finding is that these roles are not interchangeable in ability: a model that acts poorly can still teach very well, because judging a completed episode reveals consequences that acting must anticipate.

## Problem Statement
Prior work treats decision models mainly as actors and gauges their usefulness by acting quality. But agent stacks increasingly use the same LLM for action selection, trajectory evaluation, and reward annotation for RL. If practitioners assume "weak actor ⇒ weak judge ⇒ useless teacher," they may discard models that are excellent at precisely the roles that are hardest to staff — reliable reward signals for small-policy RL training.

## Key Contribution
- A systematic comparison of three decision models and three general LLMs across the actor, judge and teacher roles on ALFWorld and WebShop.
- **Actor failure mode**: all six models get pulled away from a prerequisite sub-goal by an easier adjacent one while acting.
- **Judge recovery**: the same models, judging whole trajectories, correctly credit steps toward the deferred sub-goal — but only when asked *whether each action helped*, rather than whether the task will succeed. The framing of the judge question separates useful from useless actions.
- **Teacher transfer**: using JEV as a reward teacher lifts a Qwen2.5-1.5B policy trained with GRPO from 72.8% to 82.9% on ALFWorld and from 56.8% to 71.4% on WebShop.

## Technical Approach
Decision models emit typed, scored choices in one pass. The authors evaluate each model as (1) actor: interacting with the environment; (2) judge: presented with the full trajectory and asked per-action credit or global success prediction; (3) teacher: providing dense per-action scores to GRPO training of a small policy. The key design choice is the judge prompt — local ("did this action help?") versus global ("will the task succeed?").

## Results
- Judge framing dominates: per-action helpfulness questions recover correct credit assignment that global success prediction misses.
- Teacher role: +10.1 points (ALFWorld) and +14.6 points (WebShop) success for a 1.5B student policy over the GRPO baseline.
- Conclusion: "a poor actor can still teach well" — evaluate roles separately before retiring a model.

## Relevance to Our Domain
This is directly actionable for agent platform teams building RL post-training or LLM-as-judge pipelines: (1) don't benchmark a reward/judge model by its acting ability; (2) design judge prompts around per-step credit, not episode success; (3) small typed-output decision models can serve as cheap dense-reward oracles for GRPO-style training of even smaller deployed policies. It connects to our notes on JEV executors and trajectory-selection methods (SWE-Prime) in the agent-infrastructure stack.

## References
- Paper: https://arxiv.org/abs/2611.17167
- Code: https://github.com/ZJU-REAL/decision-agents
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17167
