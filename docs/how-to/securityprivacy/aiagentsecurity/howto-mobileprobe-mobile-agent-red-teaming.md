---
title: MobileProbe — Red-Teaming Mobile GUI Agents Against Environmental Injection
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.16693
date: 2026-11-15
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# MobileProbe — Red-Teaming Mobile GUI Agents Against Environmental Injection

## Overview

MobileProbe is an adaptive red-teaming framework for mobile GUI agents (phone agents that read the screen and operate apps on the user's behalf). The threat it targets is the **environmental injection attack (EIA)**: an attacker plants malicious instructions in ordinary UI content — a banner, a product page, a message — and the agent, which acts on whatever the screen shows, follows them. MobileProbe replaces fixed-payload benchmarks with a trajectory-aware, evolutionary testing loop and ships a benchmark of 83 long-horizon attack instances across 12 apps, each annotated with a Confidentiality/Integrity/Availability goal.

## When to Use This

Use this procedure before deploying any mobile/GUI agent, or whenever you need an evidence-based security posture report for one. Fixed-point benchmarks (one hand-crafted payload, one fixed task step) systematically **underestimate** risk for two reasons MobileProbe fixes: payloads don't transfer across apps without manual redesign, and agents that never visit the injected screen are scored "safe" without ever being tested.

## Procedure

1. **Enumerate attack surface via automated pentesting.** Drive the target app suite and discover which UI content surfaces are attacker-controllable (anything rendered from external data: listings, reviews, messages, ads).
2. **Trace agent trajectories.** Run the agent on long-horizon tasks and record the routes it actually takes; different architectures take different paths for the same task, so coverage must follow the real trajectory, not an assumed one.
3. **Localize vulnerable decision points.** Identify steps along observed trajectories where injected content would be consumed by the agent's next action.
4. **Generate context-aware payloads.** Craft injection text tailored to the app, screen, and task context rather than generic prompt-injection strings.
5. **Refine iteratively through a surrogate-filtered evolutionary loop.** Evolve payload candidates; use a surrogate model to filter unpromising variants cheaply before spending real agent-execution budget.
6. **Score against CIA goals.** Tag each attack instance with its Confidentiality, Integrity, or Availability objective so results map to standard security categories and coverage gaps are visible.
7. **Compare against baselines.** Benchmark attack success rate against human-written payloads, zero-shot LLM-generated payloads, and adapted automated red-teaming baselines; higher ASR means your fixed benchmarks were undercounting risk.

## Expected Outcome

The paper's benchmark: **83 long-horizon instances × 12 mobile apps**, CIA-annotated. Across three representative agent architectures, MobileProbe achieved higher attack success rates than all compared baselines — treat any lower fixed-benchmark score as a coverage artifact, not a safety guarantee.

## Caveats

- Coverage is bounded by the apps and tasks in your trajectory corpus; new app versions require re-running surface discovery.
- Evolutionary refinement costs real executions — budget for it; the surrogate filter exists precisely because unfiltered evolution is too expensive.

## References

- Paper: https://arxiv.org/abs/2611.16693
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16693
