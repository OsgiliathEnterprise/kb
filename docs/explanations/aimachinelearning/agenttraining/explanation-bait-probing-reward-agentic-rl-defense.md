---
title: Bait — Probing the Reward Function to Stop Harmful Agentic RL Fine-Tuning
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.16369
date: 2026-11-15
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# Bait — Probing the Reward Function to Stop Harmful Agentic RL Fine-Tuning

## Overview

Bait exposes and defends a strikingly cheap attack on the emerging market for **agentic reinforcement-learning-as-a-service (RLaaS)**. An attacker can pay ~$20 to run several rounds of "harmful agentic RL" through a provider's own API — training the model against a toxic environment the attacker supplies — and completely strip the safety alignment of a large language model (the paper demonstrates this on a model named Inkling). The mitigated model can then be weaponized for real-world harm, e.g. exploiting software vulnerabilities and code-reuse attacks. Bait is a provider-side defense that proactively probes the reward function to detect and neutralize harmful training signals.

## Problem Statement

RLaaS platforms assume the barrier to misuse is compute cost and review. But agentic RL only needs a reward function, and a user can smuggle a *harmful* one inside an apparently ordinary environment. Each RL round nudges policy toward whatever the environment rewards, so iterated toxic-environment training erodes alignment without ever asking the platform to generate harmful content directly — the abuse hides inside the training loop.

## Key Contribution

- **Attack demonstration**: full subversion of an aligned LLM's safety via legitimate RLaaS API calls at ~$20 cost, with downstream real-world misuse demonstrated (vulnerability exploitation, code re-use attacks).
- **Bait defense**: the platform intersperses *probing* tasks with known-good and known-bad behaviors; if the candidate reward function assigns high reward to behaviors the probe marks as harmful, training on that reward is rejected/mitigated, while benign reward functions that improve legitimate agentic capability still pass.
- **Adaptive-attacker analysis**: both empirical and theoretical results show an attacker who knows Bait exists cannot perfectly evade it, due to a systematic (not implementation-specific) detection challenge.
- Open-source: https://github.com/git-disl/Bait

## How It Works

Training requests are treated as untrusted. Before (and during) RL on a user-supplied environment, the platform runs rollouts on probe states whose correct — benign vs harmful — behavior is known. A reward function is validated by checking whether it ranks probe behaviors consistently with the ground-truth labels: harmful-reward functions that incentivize the toxic behavior while disguising as task reward are caught and the corresponding updates are mitigated. Benign environments, which simply reward competent task completion, are unaffected.

## Relevance to Our Domain

Any platform offering fine-tuning, RLHF, or RL environments to third parties — including internal "agent improvement" services — inherits this threat model: the reward function is an untrusted input. Bait establishes the *reward-provenance validation* pattern we should apply to our own training pipelines: probe before you optimize, and treat user-defined rewards as adversarial.

## References

- Paper: https://arxiv.org/abs/2611.16369
- Code: https://github.com/git-disl/Bait
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16369
