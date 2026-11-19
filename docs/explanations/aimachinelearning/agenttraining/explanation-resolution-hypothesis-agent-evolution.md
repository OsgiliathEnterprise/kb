---
title: 'The Resolution Hypothesis: Agent Evolution''s Key Is Identifying Improvements'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.23068
date: '2026-11-18'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# The Resolution Hypothesis: Agent Evolution's Key Is Identifying Improvements

## Overview
Zeng, Lan, Lu et al. (11 authors: Yuanhao Zeng, Shaocheng Lan, Ao Lu, Kuang Yan, Heng Lin, Xinang Xu, Yuan Luo, Yueting Wang, Yexin Li, Ruo Shan, Kan Ren; arXiv:2611.23068, cs.AI/cs.CL, submitted 2026-11-17, 38 pages / 12 figures / 13 tables, CC BY 4.0) challenge the dominant agenda in **agent evolution** research (self-improving agent harnesses that rewrite their own prompts, skills and memories). Standard methods run a loop: a frozen *proposer* writes artifact candidates, *selection* accepts those with higher evaluation scores. When methods trade wins on benchmarks, the field typically blames candidate quality or proposer design. The paper's **resolution hypothesis** says the real bottleneck is **evaluation resolution**: noisy evaluations fail to identify improvements.

## Problem Statement
If selection cannot reliably tell a beneficial candidate from a harmful one, evolution stalls regardless of proposer quality. The hypothesis: **stagnation is caused by failure to identify true improvements, not by their absence.**

## Key Contribution
An empirical study of **seven evolution methods across six models — over 10M LLM calls** — yielding two findings:
1. **Candidate-level**: beneficial candidates exist but are **not identified** — selection mistakes them for harmful ones at a rate **indistinguishable from random guessing**, and these mistakes **compound across rounds**.
2. **Method-level**: typical leaderboard gaps of **a few percentage points are smaller than the run-to-run score variability of a single method** — so **published rankings reflect luck, not method quality**.

Implication: progress depends less on better proposer systems and more on **making true improvements detectable and accumulating them**.

## Relevance to Our Domain
Directly applicable to our own agent-harness and self-improvement experiments (ModHarness-RL, ERL, self-authored improvement algorithms): before crediting a harness change, check that the eval's signal-to-noise can resolve the claimed effect size — otherwise you're ranking noise. Practical rule: require run-to-run variance estimates and repeated-seed selection budgets before accepting any agent-evolution result. Related: [[explanation-modharness-rl-evolving-harness-programs]], [[explanation-do-llm-agents-still-need-to-be-told-how-to-self-improve]], [[explanation-optimistic-verifiers-reward-hacking]].

## Related Literature
- **On the Fragility of Self-Improving Agents: Variance, Task Order...** (arXiv:2608.18066) — independent support for the same concern: self-improving methods *increase* run-to-run variance (variance grew in 17 of 24 cases, >50% relative increase in 11), because stateful memory construction is conditioned on prior stochastic outcomes. Compounding noise, exactly as the resolution hypothesis predicts. https://arxiv.org/abs/2608.18066
- **Evaluation and Benchmarking of LLM Agents: A Survey** (arXiv:2507.21504) — taxonomy of agent-evaluation objectives (behavior, capability, reliability, safety) and processes; useful checklist when designing a selection eval with sufficient resolution. https://arxiv.org/abs/2507.21504

## References
- Paper: https://arxiv.org/abs/2611.23068
- Project page: https://lineshogan.github.io/resolution-hypothesis/
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23068
