---
title: 'When Every Rollout Fails: Splicing Learner-Conditioned Options into Long-Horizon
  Agent RL'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.34777
date: 2026-11-25
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# When Every Rollout Fails: Splicing Learner-Conditioned Options into Long-Horizon Agent RL

## Overview
SPLICE addresses the "all-fail group" pathology of group-based RL with verifiable rewards (GRPO-style): on long-horizon agent tasks, every sampled trajectory in a group can score zero reward, leaving group-relative advantage estimation with no policy-gradient signal. Rather than importing full solutions from a stronger teacher, SPLICE builds *local* training targets by splicing short, bounded "options" — generated online by a proposal model from a chosen splice point of a failed current-policy trajectory — back onto the learner's own trajectories.

## Problem Statement
In GRPO and relatives, learning signal comes from reward differences within a group of sampled rollouts. Long-horizon tasks (software engineering, deep research) produce groups where **all** rollouts fail, so group-relative advantages collapse to zero and no gradient flows. The usual remedy — a stronger model providing complete solutions — is expensive and drags the learner through long off-policy histories it did not generate.

## Key Contribution
- **Online local target construction**: for each all-fail group, a proposal model picks a splice point in a current-policy trajectory and generates several *bounded* options (short continuations) from that point.
- **Option valuation by rollout**: each option's value is estimated via repeated continuations with the *current policy*; options with positive estimated value are converted into a return-weighted local target, and the policy is fit on them.
- **Learner-conditioned**: options are anchored to the learner's own (failed) trajectories, avoiding long off-policy exposure.
- **Consistent wins**: beats GRPO and full-trajectory teacher guidance across 2 policy families × 2 long-horizon tasks, by **+2.8–9.8 points over GRPO**, while *reducing* proposal-model compute relative to full-trajectory guidance.

## Technical Approach
The pipeline per all-fail group: (1) select a splice point in a failed trajectory via the proposal model; (2) generate multiple short candidate options from that point; (3) estimate each option's value by rolling out the current policy repeatedly from the option's end; (4) keep options with positive value estimates, weight them by return, and train the current policy on them. The whole loop stays on-policy-adjacent: supervision is local and conditioned on what the learner actually did.

## Results
- Outperforms GRPO and full-trajectory guidance in all four settings (2 policy families × SWE-bench Verified and BrowseComp-Plus).
- +2.8–9.8 percentage points over GRPO.
- On initially-failed SWE tasks, GRPO's graduation rate rises **+10.8 points**.
- Lower proposal-model cost than full-solution guidance baselines.

## Relevance to Our Domain
Agentic RL training (SWE-bench-style coding agents, deep-research agents) is an active KB theme. The all-fail-group failure mode is a practical blocker for GRPO runs on hard long-horizon tasks, and SPLICE offers a cheaper, more on-policy alternative to teacher-trajectory distillation — relevant to our notes on reward hacking, self-play task synthesis, and on-policy distillation.

## References
- Paper: https://arxiv.org/abs/2611.34777
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34777
- Related in KB: `how-to-care-opd-on-policy-distillation-prefix-replay.md`, `explanation-optimistic-verifiers-reward-hacking.md` (same topic)
