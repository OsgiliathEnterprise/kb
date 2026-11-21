---
title: 'A CPU Inside an LLM: Zero-Gradient Compilation of Exact Circuits into Pretrained
  Weights'
diataxis: Explanation
domain: ai-machine-learning
topic: dl-architectures
source: arXiv
source_url: https://arxiv.org/abs/2611.26450
date: 2026-11-21
keywords:
- knowledge-base
- dl-architectures
- ai-machine-learning
- explanations
---
# A CPU Inside an LLM

## Overview
This paper (arXiv:2611.26450, Sreenivas) asks how much **deterministic computation** can be installed into the frozen weights of a pretrained LLM without any gradient training. It introduces **Circuit Grafting**: using weight-algebra primitives, the authors compile a complete 8-bit instruction-set computer — registers, program memory, ALU, program counter — directly into the MLP blocks of Llama-3.2-1B. The compiled CPU executes user programs **exactly**, verified over roughly 10^4 cycles with zero error, and requires **zero gradient updates**.

## Problem Statement
The boundary between "statistical" neural computation and "exact" symbolic computation has been an open question: can a frozen Transformer be repurposed into a faithful digital computer? Prior work on arithmetic in Transformer weights demonstrated limited operations; a fully deterministic, general-purpose execution unit inside a real pretrained model had not been demonstrated.

## Key Contribution
- **Weight-algebra primitives + compiler**: a compilation procedure turns an ISA specification into MLP weight modifications — no training, no fine-tuning, no gradient step.
- **Exact execution guarantee**: an end-to-end simulator verifies the compiled ISA executes exactly under model dynamics.
- **Verified capacity budget** — how much circuitry fits per layer:
  | Component | Capacity |
  |-----------|----------|
  | Registers | 2 per layer |
  | Program memory | 25 entries per layer |
  | ALU | full 8-bit with adder and barrel shifter in a single MLP block |
  | Program counter | 16-bit counter in one head |
  | Sparse readout | 17 of 24 expert MLPs untouched (Mixture-of-Experts headroom) |
- **Deterministic inference**: at temperature 0, accuracy is 100.0% with zero variance across 10 runs.

## Interpretation
Two implications stand out. First, for **mechanistic interpretability**: MLP blocks have enough unused structure to host hand-compiled digital logic — the "capacity budget" is a measurable, quantitative statement about what pretrained weights contain. Second, for **neuro-symbolic systems**: exactness can be *compiled in* rather than approximated by training, suggesting a hybrid design where a small deterministic kernel is grafted into a language model for guaranteed behaviors (counters, state machines, protocol logic) while the rest of the model stays statistical.

## Caveats
The CPU is tiny (8-bit, 16-bit PC, 2 registers/layer) — this is a possibility proof and capacity study, not a practical processor. The model retains its language abilities only insofar as grafted layers are otherwise unused (the sparse readout preserving 17/24 expert MLPs hints at coexistence, but dual-use was not the headline claim).

## Relevance to Our Domain
Feeds our interpretability and architecture coverage: quantified headroom in frozen weights, a constructive toolchain (compiler rather than learner) for installing guaranteed computation, and a fresh angle on reliability — deterministic temperature-0 execution by construction rather than by sampling discipline.

## References
- Paper: https://arxiv.org/abs/2611.26450
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26450
- Related: Transformer arithmetic circuits, grokking/circuit literature, neuro-symbolic hybrid architectures
