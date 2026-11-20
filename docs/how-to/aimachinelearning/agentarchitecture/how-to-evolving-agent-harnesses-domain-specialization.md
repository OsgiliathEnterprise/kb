---
title: 'Beyond Weight Updates: Evolving Agent Harnesses for Domain Specialization'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.25380
date: 2026-11-20
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Beyond Weight Updates: Evolving Agent Harnesses for Domain Specialization — How-to

## Goal
Adapt a general-purpose LLM agent (Claude Code-style coding agent, here "Codev") to a new vertical domain **without touching model weights**, by treating the agent harness as the optimisation target. Use when GPU training is unavailable, too slow to iterate, or when you need per-vertical adapters that compose with a shared base policy.

## When to use this
- You need per-domain specialisation but the base model must stay frozen (licensing, serving constraints, multi-tenant shared checkpoint).
- You want fast iteration: harness adapters are text artefacts, loadable per vertical, no retraining pipeline.
- You plan to combine with weight-based RL later — harness evolution is non-destructive and composes.

## Procedure
1. **Define the harness surface.** Enumerate the four mutable components: (a) system prompt, (b) tool schemas, (c) skill library, (d) planning scaffolding. Everything model-side stays frozen.
2. **Cast harness evolution as an RL-style outer loop.** Each candidate harness is a "policy" evaluated by running the frozen agent on domain tasks; scores feed the outer optimiser.
3. **Instantiate the optimiser with GEPA** (Genetic-Pareto reflective prompt evolution): mutate/combine harness components, use reflective LLM analysis of execution traces to propose targeted edits, keep the Pareto front of candidates rather than a single incumbent.
4. **Evaluate on representative benchmarks** — the paper uses SWE-bench Verified, OfficeBench, and Terminal-Bench. Track both task success and reasoning-chain health (see pitfall below).
5. **Package the winner as a harness adapter** per vertical domain; keep adapters loadable independently so one deployed model serves many domains.
6. **Optionally combine with a weight-update path.** The paper's pattern: weight updates give the strongest single-path gains; harness evolution recovers *most* of that gain at a small fraction of the compute; **both paths combined is best overall**.

## Pitfalls
- **SFT truncation failure mode:** the paper analyses SFT-based specialisation producing *shortened reasoning chains and increased truncation*. Harness adapters avoid this by construction since the policy is untouched — if your fine-tuned agent suddenly reasons less, suspect training-induced truncation, not prompt drift.
- Harness evolution alone underperforms strong weight updates on raw score; budget for the combined path when the benchmark ceiling matters.

## Verification
- Adapter loads per vertical without redeploying the model.
- Benchmark scores on your domain set approach the RL/SFT path within a small margin at far lower compute.
- No increase in truncated reasoning chains vs the frozen baseline.

## References
- Paper: https://arxiv.org/abs/2611.25380
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25380
