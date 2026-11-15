---
title: From Signals to Structure — Memory Architecture Beats Channel Capacity in LLM
  Language Emergence
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: arXiv
source_url: https://arxiv.org/abs/2607.00233
date: 2026-11-15
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# From Signals to Structure — Memory Architecture Beats Channel Capacity in LLM Language Emergence

## Overview
Two LLM agents trying to invent a shared language from scratch (a Lewis signaling game: a sender and a receiver coordinate on a code using only interaction history) is a clean probe of what it takes for signals to become structure. This study sweeps **five memory architectures × several channel capacities** and reaches a counterintuitive verdict: the memory design matters more than the bandwidth.

## Problem Statement
Classical intuitions from information theory suggest an optimal channel capacity on the order of the number of objects to be named (an information-bottleneck argument). Prior agent-communication work implicitly treats capacity as the main lever. Neither view accounts for what agents do *between* rounds — whether learned conventions persist anywhere outside the context window.

## Key Contributions
- **Memory architecture is the dominant variable**: agents equipped with a *persistent private notebook* avoid the high-capacity collapse that stateless agents suffer, and achieve the best coordination — **0.867 ± 0.023 at capacity 25**.
- **High-capacity collapse is a memory failure, not a communication failure**: stateless agents peak at *moderate* capacity, then degrade as the vocabulary outgrows what a rolling context window can track.
- **The bottleneck is a fragility point, not the optimum**: capacity = 8 (the bottleneck-predicted sweet spot) behaves badly; surplus capacity is generally better — *for agents that can remember*.
- **The notebook's mechanism**: it externalizes learned conventions, so agents stop re-deriving codes every round; coordination accretes instead of resetting.
- Conclusion: channel capacity alone cannot predict coordination — memory architecture determines whether interaction history crystallises into stable conventions. Both dimensions are needed.

## Technical Approach
Lewis signaling-game protocol with LLM sender/receiver pairs; five memory architectures (stateless rolling context through persistent private notebook, plus intermediate variants) crossed with channel-capacity configurations. Coordination accuracy is the primary metric; vocabulary growth vs. context-window tracking capacity exposes the stateless degradation curve.

## Results
- Best cell: notebook agents, capacity 25 → 0.867 ± 0.023 coordination.
- Stateless agents: inverted-U in capacity, collapsing past moderate values.
- Bottleneck capacity (8): underperforms — contradicts the information-bottleneck prediction for LLM agents.

## Relevance
A direct empirical argument, from emergence rather than benchmarks, for externalized agent memory: memory architecture changes the *qualitative* scaling behaviour of multi-agent coordination. Design lesson for agent frameworks: give cooperating agents durable convention stores, and don't artificially throttle channels to a theoretical optimum.

## Sources
- arXiv: https://arxiv.org/abs/2607.00233
- Related: [[explanation-single-vs-multi-agent-coordination-costs]]
