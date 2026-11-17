---
title: 'Dependable Long-Horizon LLM Agents: A Trajectory-Centered Empirical Study
  of Where Errors Enter and Which Controls Reach Them'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.13254
date: '2026-11-17'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Dependable Long-Horizon LLM Agents: A Trajectory-Centered Empirical Study of Where Errors Enter and Which Controls Reach Them

## Overview
A trajectory-centered **empirical reliability study**: the authors read each failed agent trajectory in full from two public corpora — **Who&When** and the **MAST/MAD traces** (Cemri et al., 2025) — and answer three questions: where does the error *originate*, what is the observable *symptom*, and which reliability control would actually have intercepted it.

## Study Design (lookup material)
- Unit of analysis = the whole execution trace, not the final outcome; full manual reading, with MAST failure modes assigned as **symptom** labels (**2.9 modes per run on average**).
- **Origin vs symptom separation**: the causal origin is located and compared against the corpus's own decisive-step labels; **in 37 of 88 Who&When traces the true origin is earlier than the human-labeled decisive step**, at a **median origin→symptom gap of 0.67 of the run** (origins cluster early, ~0.18 into the run, as wrong decisions or fabrications over task/reasoning/knowledge state).

## Main Empirical Findings
1. **Agents ignore their own contradicting evidence**: **in 72% of failed runs a contradicting observation appears before the failure, and the agent ignores the large majority of them** — failures are visibly foreshadowed in the trace.
2. **State-restore controls reach less than assumed**: restoring the agent's own state (local checkpoint) would have sufficed in only **35 of 95 runs**; in **56 runs the fault sat in a plan or policy that a restore would simply replay** — checkpoint/rollback is not a general-purpose control.
3. **Harness-level failures hide behind attribution labels**: **26 of 58** hand-crafted Who&When failures ended in a **provider content-filter crash after which the harness emitted a final answer no agent produced** — a harness bug misattributed to the model; a text scan shows **45% of hand-crafted Who&When failures** belong to this class.

## How To Use This
- **Control-placement audit**: map your controls (checkpoints, retries, output validation) onto origin-vs-symptom positions — a control that only fires at the symptom step misses origins a median 0.67 of the run earlier.
- **Blame the harness first**: check for provider-filter/harness-injected final answers before concluding the model failed; label taxonomies that attribute harness failures to model decisions systematically mislead.
- The ignore-your-own-evidence statistic argues for controls that react to mid-trajectory contradicting observations (evidence monitors), not just end-of-run validation.

## References
- Paper: https://arxiv.org/abs/2611.13254
- Related: [[Agents, Think Only When it Helps]], agent guardrail stack notes in this topic
