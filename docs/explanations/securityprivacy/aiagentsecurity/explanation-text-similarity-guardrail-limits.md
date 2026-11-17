---
title: 'Safe Resemblance, Silent Propagation: Limits of Text-Similarity Guardrails
  for AI Agent Safety'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.21520
date: 2026-11-17
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Safe Resemblance, Silent Propagation: Limits of Text-Similarity Guardrails for AI Agent Safety

## Overview

When AI agents relay information to each other, a dangerous injected instruction can keep propagating even after its wording changes, while innocent quotation and template reuse can look textually identical to an attack. This paper shows empirically and formally that text-similarity guardrails (BLEU/ROUGE-style overlap detectors) cannot separate the two, and argues for behavioral, policy-grounded evaluation instead.

## Problem Statement

Multi-agent pipelines need to catch injected procedures that survive paraphrasing ("functional" propagation), but legitimate outputs — quoted emails, reused templates — produce high textual overlap with their source. A detector built on surface similarity must conflate these cases.

## Experimental Setup

- **DonkeyRail**: a public classifier combining BLEU, ROUGE-L and METEOR features, deployed in a controlled three-agent email relay.
- **Behavioral ground truth**: an output counts as *functional* only if the injected procedure induces fresh computations in the two subsequent agents — independent of the detector's similarity score.
- **Legitimate controls** explicitly authorize quotation and template reuse.

## Key Results

- At the default threshold, the classifier **misses 8 of 19 functional outputs** while **flagging 70 of 192 legitimate replies**; every completed quotation and template-reuse reply triggers a false alert.
- **Calibration does not transfer**: a threshold tuned for low false positives on one template set detects only one functional output and still produces 15 false alerts on new templates.
- **Operating-point error found in all 21 published classifier configurations**: ROC interpolation was used where direct threshold application was required.
- **Formal gap**: high AUC against a surface-level text criterion gives no distribution-free guarantee of high AUC against the behavioral target, and existing evaluation labels lack the joint observations needed to even estimate the gap.
- **Authorization analysis**: identical visible transcripts can require different safety decisions depending on the governing policy — a distinction no observation-only classifier can resolve.

## Relevance to Our Domain

Direct guidance for designing multi-agent guardrail stacks: similarity-based propagation filters are the wrong layer. Detection should target downstream *behavior* (did the injected procedure induce new computations?) and decisions must be grounded in the authorization policy, not in transcript text alone.

## References

- Paper: https://arxiv.org/abs/2611.21520
- Related KB note: [[explanation-agent-guardrail-stack]] (agent-architecture)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21520
