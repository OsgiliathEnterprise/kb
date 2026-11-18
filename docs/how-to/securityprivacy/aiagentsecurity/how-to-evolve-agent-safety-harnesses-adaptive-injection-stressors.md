---
title: 'Evolution Under Fire: Evolving Agent Safety Harnesses with Adaptive Injection
  Stressors'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.22583
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# Evolution Under Fire: Evolving Agent Safety Harnesses with Adaptive Injection Stressors

## Overview
Tool-using LLM agents must act on untrusted emails, webpages, and documents — malicious instructions and legitimate directives arrive through the *same channel*. Existing defenses are hand-designed and static, so every improvement requires manual redesign. Evolution Under Fire automates defense design: it evolves complete, executable safety harnesses using execution evidence, driven by an adaptive adversary that keeps finding utility-preserving injections.

## Problem Statement
How do you keep improving an agent's safety harness as prompt-injection attacks evolve, without a human redesigning the harness each time?

## How-To: Evolve an Agent Safety Harness (the paper's staged procedure)
1. **Fix the evaluation frame** — hold the task model, benchmark, tools, and evaluator constant so all progress is attributable to the harness.
2. **Evolve harnesses from execution evidence** — run a utility-constrained, Pareto-scheduled tree search over *complete executable safety harnesses*, scoring candidates on real execution traces (security vs utility is treated as a Pareto frontier, not a single objective).
3. **Evolve the stressors** — run adaptive stressor evolution to discover prompt-injection attacks that preserve task utility (hard to block by simply refusing).
4. **Alternate the two loops** — newly discovered attacks feed the next stage of harness evolution; the harnesses that survive push the adversary to escalate.
5. **Test transfer before deployment** — evaluate whether the evolved harness ports to other models without re-evolving.

## Key Contribution
- First staged framework coupling *safety-harness evolution* with *adaptive stressor evolution* for prompt-injection defense.
- Fully automated harness design: the output is executable code, not a hand-written policy.

## Results
| Benchmark | Model | Attack success |
|---|---|---|
| AgentDyn | GPT-4o-mini | 50.4% → **3.0%** (with improved clean & attacked utility) |
| Agent-SafetyBench | Qwen2.5-7B-Instruct | 82.6% → **62.0%** (helpfulness & runtime validity retained) |
| Transfer (no re-evolution) | Qwen3.5-35B-A3B | 32.1% → **0.9%** (attacked-task utility improved) |

Evolved harnesses offer a stronger security–utility trade-off than reproduced baseline defenses.

## Relevance to Our Domain
Actionable for our agent gateway hardening: instead of maintaining hand-written injection filters, instrument execution traces and run search-based harness evolution with an internal adaptive attacker; the zero-shot transfer result suggests one evolved harness can protect a multi-model fleet.

## References
- Paper: https://arxiv.org/abs/2611.22583 (published 2026-11-17)
- Authors: Yujun Wang, Yilun Liu, Jinhe Bi, Krishna Kanth Nakka, Xuebing Zhou, Hinrich Schütze, Yunpu Ma
- Benchmarks: AgentDyn, Agent-SafetyBench
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22583
