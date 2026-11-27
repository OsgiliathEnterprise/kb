---
title: 'CrossEnv: Synthesizing Verifiable Cross-Environment Tasks for Long-Horizon
  Agent Training'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.22777
date: '2026-11-19'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- how-to
---
# CrossEnv: Synthesizing Verifiable Cross-Environment Tasks for Long-Horizon Agent Training

## Overview
**Authors:** Zhengfeng Yu, Tian Lan, Zhijing Wu, Enbo Zhao, Xuannan Liu, Feihu Jiang, Qianghuai Jia, Longyue Wang, Zhao Xu, Weihua Luo, Xian-Ling Mao (arXiv:2611.22777, cs.AI/cs.CL, submitted 17 Nov 2026, 23 pages, CC-BY-4.0).

Yu et al. observe that real work spans **multiple services** — actions in one service depend on information obtained from another — yet existing environment-synthesis methods generate tasks *within individual environments*, so trained agents never practice cross-service coordination. **CrossEnv** synthesizes executable, verifiable **cross-environment** tasks: an **entity-tool graph** identifies connections between environments, and task-specific data is aligned across environments so interactions stay consistent, executable, and verifiable. **CrossEnv-Curriculum** then trains in stages: single-environment tool use → coordination across more environments and business domains → user interaction.

## When to Use This
You're training (SFT or RL) a tool-using / GUI / embodied language agent and its performance collapses on environments that differ from the training ones — different tool APIs, entity formats, or interaction protocols — despite the underlying skills being the same.

## Steps (the CrossEnv procedure)
1. **Build an entity-tool graph** over your environments — entities shared across services and the tools that read/write them reveal where cross-environment tasks can exist.
2. **Identify cross-environment task opportunities** where an action in one service depends on information obtained from another.
3. **Align task-specific data across environments** so the shared state stays consistent — this is what makes the synthesized tasks executable *and* verifiable (the main synthesis challenge).
4. **Instantiate and validate tasks** by interaction-based rollouts — discard instances that don't check out when actually executed, so training isn't poisoned by unsolvable tasks.
5. **Train with CrossEnv-Curriculum** — staged schedule: single-environment tool use first, then coordination across more environments and business domains, and finally user interaction.
6. **Evaluate cross-environment**: expect transfer to new environment combinations, tasks less similar to training data, and longer workflows — not just higher in-distribution success.

## Concrete Results
- Across **four external benchmarks**, combining cross-environment training data with the curriculum achieves **competitive performance with fewer training examples**.
- Analyses support transfer benefits to: **new environment combinations**, external tasks **less similar** to the training data, and **longer workflows**.

## Relevance to Our Domain
A practical blueprint for de-risking the "trained on our harness, breaks on a new one" failure mode in agent development — the entity-tool graph doubles as a checklist for designing eval environments that genuinely stress cross-service transfer. The interaction-based validation step is the key to scaling synthesis without poisoning training with unsolvable instances. Related: [[explanation-modharness-rl-evolving-harness-programs]], [[reference-rsi-prime-training-models-to-train-models]].

## References
- Paper: https://arxiv.org/abs/2611.22777
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22777
