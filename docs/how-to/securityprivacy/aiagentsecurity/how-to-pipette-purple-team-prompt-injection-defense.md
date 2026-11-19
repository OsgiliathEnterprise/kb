---
title: 'PIPETTE: Prompt Injection Purple-Teaming for Robust LLM Agents'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.24362
date: 2026-11-19
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# PIPETTE: Prompt Injection Purple-Teaming for Robust LLM Agents — How to Turn Red-Team Findings into Actual Robustness

## Overview
PIPETTE (He, Wang, Zhang, Asokan) is a **purple-teaming framework for indirect prompt injection (IPI)** that fixes a counterintuitive failure: red-teaming that achieves high attack success rate (ASR) does **not** automatically make adversarial training improve agent robustness. State-of-the-art RL red-teamers (RL-Hammer, PISmith) suffer **mode collapse** — they rediscover near-identical attacks whose extra successes teach the defender nothing new. PIPETTE closes the discovery→robustness loop.

## Problem Statement
Automated RL red-teaming generates high-ASR IPI attacks used for pre-deployment adversarial training. But if the attack distribution is narrow (mode collapse), adversarial training plateaus: high ASR ≠ robustness gains. Purple teaming needs *diverse* attacks, not just *successful* ones.

## How to Run a PIPETTE Purple-Teaming Cycle
1. **Red-team with a diversity-aware reward**: run RL attack generation with a **dictionary-learning-based reward** that pays for coverage of new attack strategies, not just repeat successes — this counters the RL-Hammer/PISmith mode collapse.
2. **Collect the diverse attack set** discovered in step 1 as the training corpus for the defender.
3. **On-policy adversarial training** tailored to IPI: train the agent against its *current* attack distribution (not a stale corpus), optimizing to resist hijacks **while still completing legitimate user tasks**.
4. **Evaluate on agentic benchmarks AgentDojo and ASB**, measuring both:
   - ASR under static attacks and under **adaptive attacks** (attacker aware of the defense),
   - benign task utility vs. the undefended baseline.
5. **Gate deployment** on near-zero static ASR + resilience to adaptive attacks + utility close to undefended baseline.

## Results
- Defenders trained via PIPETTE reach **near-zero ASR on static attacks** and **withstand strong adaptive attacks**, while **benign utility stays close to the undefended baseline** (AgentDojo, ASB).

## When to Use
- Before deploying tool-using agents that ingest untrusted content (email, web, docs).
- Whenever your red-team reports "high ASR found, defense trained" — verify attack *diversity*, otherwise the defense is likely trained on redundant samples.

## Related
- [[explanation-plain-data-indirect-injection]] — an IPI class any red-team corpus should include
- [[explanation-skillcfi-control-flow-integrity-agent-skills]] — runtime/architectural defense complementing training-time hardening

## References
- Paper: https://arxiv.org/abs/2611.24362
- Primary class: cs.CR (also cs.AI)
- Benchmarks: AgentDojo, ASB
- Baselines analyzed: RL-Hammer, PISmith
