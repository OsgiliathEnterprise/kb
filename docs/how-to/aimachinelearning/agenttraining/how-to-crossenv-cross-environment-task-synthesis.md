---
title: 'CrossEnv: Synthesizing Verifiable Cross-Environment Tasks for Long-Horizon
  Agent Training'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.22777
date: '2026-11-18'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- how-to
---
# CrossEnv: Synthesizing Verifiable Cross-Environment Tasks for Long-Horizon Agent Training

## Overview
Zheng, Li, Xu et al. (HKUST) observe that agent environments are **modularly structured** — tool schemas, entity formats, interaction styles, state transitions — yet training tasks overwhelmingly come from a handful of hand-designed environments. That pins policies to surface patterns of a single design. **CrossEnv** is an end-to-end framework that synthesizes large-scale training tasks that vary systematically across these structural axes, and a staged curriculum that exploits them.

## When to Use This
You're training (SFT or RL) a tool-using / GUI / embodied language agent and its performance collapses on environments that differ from the training ones — different tool APIs, entity formats, or interaction protocols — despite the underlying skills being the same.

## Steps (the CrossEnv procedure)
1. **Parameterize the environment space** along five axes: tool interface, observation format, entity structure, interaction pattern, and state dynamics.
2. **Derive task schemas** from a base environment that explicitly separate *structural variation* (what the environment looks like) from *skill-intrinsic difficulty* (what the task requires).
3. **Instantiate schemas** via LLMs — generate concrete task instances across environment configurations — and validate each candidate instance by **interaction-based rollouts** (discard instances that don't check out when actually executed).
4. **Train with the CrossEnv curriculum** — a staged schedule that introduces structural variation progressively.
5. **Evaluate cross-environment**: expect policy generalization to new tool schemas, interface formats and interaction protocols, not just higher in-distribution success.

## Concrete Results
- **10K validated training instances** across **15 environments**.
- Both SFT and RL with the CrossEnv curriculum improve in-environment success *and*, critically, cross-environment transfer (new tool schemas, interface formats, interaction protocols).

## Relevance to Our Domain
A practical blueprint for de-risking the "trained on our harness, breaks on a new one" failure mode in agent development — the five-axis parameterization doubles as a checklist for designing eval environments that genuinely stress transfer. The interaction-based validation step is the key to scaling synthesis without poisoning training with unsolvable instances. Related: [[explanation-modharness-rl-evolving-harness-programs]], [[reference-rsi-prime-training-models-to-train-models]].

## References
- Paper: https://arxiv.org/abs/2611.22777
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22777
