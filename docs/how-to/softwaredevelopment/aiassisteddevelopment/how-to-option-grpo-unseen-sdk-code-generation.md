---
title: 'Option-GRPO: Hierarchical RL Against AI Slop in Code Generation for Unseen
  SDKs'
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.23633
date: 2026-11-19
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# Option-GRPO: Hierarchical RL Against AI Slop in Code Generation for Unseen SDKs

## Overview
"AI slop" — verbose, redundant, non-idiomatic code that passes functional checks yet bloats codebases — gets worse when the target SDK postdates the model's training cutoff, since the model has neither idiomatic priors nor compositional understanding. Option-GRPO (arXiv:2611.23633) is a hierarchical RL framework that adapts a code LLM to an **unseen SDK from its source code alone** — no human-written examples or test cases — optimizing both correctness and elegance. This note turns the paper's method into a reproducible procedure.

## When to Use This
You need a fine-tuned code model that calls a brand-new internal or third-party SDK idiomatically and concisely, and all you have is the SDK's source code.

## Procedure
1. **Mine compositional structure from SDK source.** Parse the SDK's source code and extract reusable code patterns ("code options") whose hierarchy reflects the SDK's compositional structure.
2. **Build the option hierarchy as curriculum + action space.** The same options serve dual duty: levels of a training curriculum and the macro-action space for policy optimization.
3. **Verify the semi-MDP.** Confirm the option set induces a valid semi-Markov decision process, so hierarchical RL theory applies.
4. **Use description-length bounds as an elegance proxy.** Under the paper's conditional bounds, shorter option description length implies more concise and, in expectation, more API-efficient programs — reward accordingly.
5. **Train with GRPO at every curriculum level.** Run Group Relative Policy Optimization with **execution-based rewards** at each level: discover SDK idioms → compose them into patterns → assemble patterns into complete programs.
6. **Measure slop, not just pass@1.** Track API-call count and program length alongside correctness — that is how the paper separates real improvement from bloated passers.

## Why It Works
The option hierarchy improves credit assignment by a factor of √(T/K) under stated assumptions: fewer, longer-horizon actions mean the reward signal reaches the right decisions.

## Expected Results
On 12 unseen SDKs with a 32B base model: **61.4% pass@1** — +8.7 over flat GRPO, +11.2 over ExploraCoder, +6.3 over ReCode — with **34.7% fewer API calls** and **27% shorter** solutions than flat-GRPO outputs.

## Verification
Check that solutions use fewer API calls and are shorter than your flat-RL baseline while keeping pass@1 equal or higher; if correctness rose but length/API-count did not fall, the option hierarchy is not capturing idioms.

## References
- Paper: https://arxiv.org/abs/2611.23633
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23633
- Related: [[explanation-muscle-context-compression-coding-agents]]
