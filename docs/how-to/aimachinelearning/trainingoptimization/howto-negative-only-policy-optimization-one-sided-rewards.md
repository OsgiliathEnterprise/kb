---
title: NOPO — Training LLMs with One-Sided Verifiable Rewards (Negative-Only Policy
  Optimization)
diataxis: How-to Guide
domain: ai-machine-learning
topic: training-optimization
source: arXiv
source_url: https://arxiv.org/abs/2611.17287
date: '2026-11-13'
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- how-to
---
# NOPO: Negative-Only Policy Optimization for One-Sided Verifiable Rewards

## Overview
Standard RL with verifiable rewards (RLVR) presumes a verifier that can both confirm and reject solutions. In practice many cheap verifiers only *falsify*: unit tests that fail prove wrongness, but passing them does not prove correctness (weak tests, spec gaps). NOPO (Xu et al., NeurIPS 2026 Spotlight) formalizes this "one-sided verifiability" regime and gives a training procedure that stays sound when positives are untrustworthy.

## Problem Statement
Under one-sided verifiability (OSV), verified negatives are reliable counterexamples; "verified" positives are merely non-falsified and can be riddled with false positives. Naïvely reinforcing verified positives rewards shortcut answers that squeak past partial checks — the classic reward-hacking failure of weak-test RL.

## How to Train Under One-Sided Rewards (Recipe)
1. **Classify your verifier.** Confirm the asymmetry: trusted failure signal, untrusted success signal (unit-test subset, constraint checkers, LLM self-verifiers).
2. **Treat verified positives as unlabeled.** Never place a positive advantage on them — this is the core deviation from GRPO/RLVR.
3. **Build the negative-suppression loss.** Apply a reference-relative loss that only *suppresses* policy mass on responses the verifier confidently rejected, anchoring updates against the reference model to avoid drift.
4. **Add the group-level adapter.** For each sampled group, scale the update by the proportion of non-falsified responses — groups where almost everything fails get stronger corrective pressure; groups where nothing is falsified get attenuated updates (no false-positive reinforcement).
5. **Evaluate pass@k without oracle rewards** on code, logic and math benchmarks; compare against RLVR baselines that (wrongly) reinforce verified positives.
6. **Stress-test robustness:** re-check gains under inference-time scaling (best-of-n) and cross-benchmark transfer, which NOPO retains.

## Technical Approach
NOPO keeps GRPO-style group sampling but replaces the two-sided advantage computation with asymmetric handling: suppression-only gradients from trusted negatives, unlabeled treatment of survivors, and an adaptive group scaling factor. No reward model, no human labels — only the falsification oracle.

## Results
Improved pass@k over RLVR baselines across code, logic and math when oracle rewards are unavailable, with gains persisting under inference-time scaling and transfer to unseen benchmarks, using unit-test, constraint-check and LLM self-verifier setups.

## Relevance to Our Domain
Most teams fine-tuning coding or agent models have exactly this asymmetry: CI tests are cheap falsifiers, correctness oracles are not. NOPO gives a concrete, implementable alternative to GRPO-style objectives when your reward signal is a test suite rather than a judge.

## References
- Paper: https://arxiv.org/abs/2611.17287
- Related: explanation-grpo-standard-deviation-identity (GRPO family), how-to-swe-prime-trajectory-selection-for-coding-agent-sft
