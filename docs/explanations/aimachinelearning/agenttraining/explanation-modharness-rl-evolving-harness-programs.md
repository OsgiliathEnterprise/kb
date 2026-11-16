---
title: 'ModHarness-RL: Recasting Harnesses as Learnable and Evolving Programs for
  Agentic RL'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.18533
date: '2026-11-16'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# ModHarness-RL: Recasting Harnesses as Learnable and Evolving Programs for Agentic RL

## Overview
Agentic RL systems normally train only the policy weights while the surrounding *harness* — control flow, tools, memory, feedback loops, context assembly — stays frozen as hand-written scaffolding. ModHarness-RL reverses that asymmetry: it treats each harness component as an independent, editable **executable program** (a module contract plus implementation) maintained by an LLM evolver, while the target model's weights are never touched. Harness variants compete on the training split and only "champions" survive, so the control layer evolves under the same selection pressure as a policy would.

## Problem Statement
The harness encodes behavioural priors as rigid engineering, which limits controllability and transparency. If scaffolding is fixed at design time, you cannot inspect *why* an agent behaves a certain way, nor adapt it per-task. The open question: can harness quality be optimized reliably without ever updating model weights?

## Key Contribution
- **Modular harness as code**: each component (control flow, tools, memory, feedback, context assembly) is exposed through a module contract; an LLM evolver proposes new implementations as executable programs.
- **Champion selection**: candidate programs are scored on the training split; only champions are retained — an explicit evolutionary loop over scaffolding.
- **Cross-model transfer**: a harness evolved for one backbone can be plugged into a different backbone and still improve it (Qwen3-4B-Instruct, MiniCPM-4.1-8B).
- **Behaviour as readable artefacts**: learned control patterns surface as *selective vision refinement*, *redundant-action suppression*, and *cross-turn evidence accumulation* — inspectable code rather than opaque weights.

## Technical Approach
The evolver proposes program variants per module; variants are evaluated on the training split and ranked; champion programs are composed into the active harness. Because everything is Python-level programs behind contracts, the same evolved harness generalizes across backbones. Evaluation spans seven task domains: search, math, math-visual, knowledge QA, web browsing, SQL and programming.

## Results
- Avg@8 accuracy gains over the strongest fixed-harness baseline on **all seven evaluated task domains**, across all three backbone LLMs.
- Gains persist without any weight updates — an order of magnitude cheaper than policy training.

## Relevance to Our Domain
For agent infrastructure teams, this reframes "prompt + scaffolding engineering" as a trainable artefact: harness code becomes a versioned, benchmarked, evolvable component. The champion-selection pattern maps directly onto CI-style evaluation pipelines we already run for agents.

## References
- Paper: https://arxiv.org/abs/2611.18533
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18533
