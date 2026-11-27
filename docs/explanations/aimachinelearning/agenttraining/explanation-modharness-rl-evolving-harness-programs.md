---
title: 'ModHarness-RL: Recasting Harnesses as Learnable and Evolving Programs for
  Agentic RL'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.18533
date: '2026-11-27'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# ModHarness-RL: Recasting Harnesses as Learnable and Evolving Programs for Agentic RL

## Overview
Agentic RL normally trains only the policy weights under a **hand-written harness** (the scaffold deciding what the model sees of its own interaction and what guidance it receives) that stays fixed throughout training — yet the right harness depends on domain, data and model, and drifts as the model trains. ModHarness-RL recasts the harness as **programs learned from data that evolve together with the model**, with no weight updates to the harness side.

## Problem Statement
A fixed harness encodes behavioural priors as rigid scaffolding chosen at design time. As the policy improves, the context-assembly and guidance logic that helped early in training becomes stale, and rewriting it by hand per domain/model is neither systematic nor inspectable.

## Key Contribution
- **Interaction recorded as structured State**: a set of typed blocks capturing the agent's trajectory, instead of an opaque message string.
- **Harness components as programs over State**: a *Compression* program assembles accumulated history into the model's context; a *Steering* program supplies guidance when behavior deviates.
- **Evolution loop during RL**: candidate programs are proposed from recent trajectories, **verified by execution**, and **replayed over past trajectories**, so the harness tracks the model's shifting behavior rather than freezing at design time.

## Technical Approach
Propose → execute-verify → replay: candidate Compression/Steering programs are generated from recent trajectories, must run without error, and are re-scored by replay over past trajectories before being adopted. Because harness logic is code over typed State blocks, it is diffable, testable and versionable independently of the policy.

## Results
Studied in depth on **CodeSearch**, with further analysis on **ALFWorld** and **BIRD SQL**, using models from **1.5B to 8B** parameters. The learned Compression and Steering mechanisms improve **held-out performance over a fixed-harness baseline in most settings** — evidence that a harness for agentic RL can be learned from the task's data and evolved with the model.

## Relevance to Our Domain
For agent infrastructure teams, this reframes "prompt + scaffolding engineering" as a trainable artefact: context-compression and steering logic become versioned, execution-verified, replay-benchmarked components — a pattern directly portable onto CI-style evaluation pipelines we already run for agents, even outside RL (e.g. offline harness regression). Related: [[explanation-experience-handoff-rl-recursive-self-improvement]].

## Enriched Details (verified from arXiv v1 full text, 2026-11-27)

**Provenance.** Zelin He, Siyu Zhu, Jacob Helwig, Yujian Liu, Li An, Rohit Jain, Shiyu Chang, Alborz Geramifard; submitted 2026-11-13 (cs.AI). Project page: https://zlhe0.github.io/ModHarness-RL/

**Representation internals.** State is a typed record (Python-class-like): each turn stores `.thought`, `.name`, `.args`, `.exec_output` (or retrieved docs with typed metadata) plus any guidance shown. A Steering "trigger" is a small program over State that fires on one detectable failure mode (e.g. a repeated tool call) and appends short guidance only on turns where it fires. Executing the harness `(compress, steer)` calls **no model and costs no tokens**, so it runs on every turn of every trajectory; the deterministic rendering also preserves prefix-cache reuse.

**Optimization loop (Algorithm 1).**
- `compress` is fit **once before training and frozen** — refitting during training scored *lower* (their Table 3). Candidates are screened for two failure modes: *unfaithful* (cuts still-needed info, detected via content the agent re-fetches) and *inert* (barely shortens history).
- `steer` is updated every round: propose failure hypotheses from **mixed-outcome task groups** → **Replay** each candidate trigger over *all stored rollouts* (no model call) to get failure-rate curves over training → **Admit** judge returns *intervene / monitor / continue* based on whether the curve is rising, unsettled, or falling (95% band) → **Gate** installs only if strictly better than the incumbent harness on held-out training tasks.
- The guiding principle: *the harness should guide only what the model cannot learn on its own* — transient failures are left to RL.

**Training setup.** GRPO, 200 steps, one 8×H100 node; K=20 steering rounds spaced evenly and run *beside* the trainer (trainer never waits). Models: Qwen3-4B/8B (CodeSearch), Qwen2.5-1.5B-Instruct (SFT warm start) & 7B-Instruct (ALFWorld), Qwen3.5-2B/4B (BIRD SQL). Every rollout-learning baseline uses the same GPT-5-mini creator.

**Numbers.**
- CodeSearch (SWE-Bench Lite/Verified/Pro, F1 over file/module/entity): **+14–24% over the fixed-harness baseline in every setting** (~19% avg; Qwen3-8B overall 0.333→0.412 context-limited, 0.403→0.460 sufficient), and **+5–12% over the strongest** of memory (EvolveR), skills (SkillRL), prompts (INSPO), harness-editing (HarnessForge) and DeepAgents baselines.
- Beats **zero-shot GPT-5-mini — the very model that wrote its harness** — in every setting, so gains are not creator distillation.
- Per-domain balance: on CodeSearch Steering (+15% avg) beats Compression (+6%); on ALFWorld context-limited Compression (+22%) beats Steering (+16%); each program alone improves over base harness in 7 of 8 ALFWorld/BIRD settings.
- vs online teacher compaction (GPT-5-mini rewriting history per episode): Compression wins 2 of 4 settings and is ≤5% lower in the other two, at **~100× fewer teacher calls/tokens** and **>1000× lower wall-clock per turn**.
- Ablations: removing hypothesis *generation* or the *judge* each lowers score in every setting — neither creator nor judge carries the result alone.

**Context regimes matter:** every environment/model is run context-limited (budget exhausts mid-episode) and context-sufficient (rarely reached); Compression's gain shows up as score under limited budgets and as prefill-token reduction (~74% fewer on ALFWorld, ~10% on CodeSearch) under sufficient ones.

## References
- Paper: https://arxiv.org/abs/2611.18533
- HTML v1 full text: https://arxiv.org/html/2611.18533v1
- Project page: https://zlhe0.github.io/ModHarness-RL/
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18533
