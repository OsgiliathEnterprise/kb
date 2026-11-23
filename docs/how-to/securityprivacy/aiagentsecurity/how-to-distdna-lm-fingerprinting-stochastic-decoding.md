---
title: 'DistDNA: Language Model Fingerprinting under Stochastic Decoding'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27831
date: 2026-11-23
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# DistDNA: Language Model Fingerprinting under Stochastic Decoding

**Authors:** Lifan Hu, Qian Yu, Zhaomin Wu, Bingsheng He


## Overview
How to fingerprint a language model through API access when the provider decodes stochastically. DistDNA represents a model by its **prompt-conditional response distributions** and compares models by **promptwise maximum mean discrepancy (MMD)**, assigning the model under examination to the known checkpoint whose reference fingerprints — collected at several decoding settings — lie nearest to its own, **without training a classifier**.

## Problem Statement
Behavioral fingerprints identify an LLM from its responses to shared prompts (verifying a deployed model matches its claimed checkpoint). Deployed models are served with stochastic decoding — unknown temperature and top-p — so the same model gives different responses to identical prompts. Prior representations (e.g. LLM DNA) treat this variation only limitedly. Two challenges for a distribution-based remedy: (1) each distribution must be estimated from only a small number of sampled responses; (2) a change in decoding setting can alter responses as much as a change of checkpoint, so fingerprint distances alone are an incomplete identity basis — identification usually relies on a classifier trained jointly on many checkpoints' fingerprints.

## How-to: run a DistDNA fingerprinting audit
1. **Collect reference fingerprints** for each candidate known checkpoint at **several decoding settings** (temperature/top-p grid) — decoding setting is treated as a nuisance variable to cover, not eliminate.
2. **Probe the target endpoint** with a shared prompt set and **sample multiple responses per prompt** (R responses) to estimate the prompt-conditional response distribution.
3. **Compute promptwise MMD** between the target's response distributions and each reference fingerprint.
4. **Assign identity to the nearest reference checkpoint** — no classifier training step.
5. **Budget the sampling regime**: expected squared fingerprint distance carries variance-dependent finite-sampling terms that decrease as **O(1/R)** for equal response counts — increase R until separation between candidate checkpoints exceeds the sampling noise.

## Key Contribution
- Distributional fingerprints under stochastic decoding as the norm, not noise to be eliminated.
- **Promptwise MMD** with multi-setting reference fingerprints replacing fragile pointwise comparisons and classifier-based identification.
- Analysis of finite-sampling effects: variance-dependent terms in expected squared distance, decreasing O(1/R) with responses-per-prompt.

## Results
Experiments across **115 model checkpoint entries** show DistDNA improves identification accuracy over the strongest baseline, **LLM DNA, by 10.36%**.

## Relevance to Our Domain
Practical for our model-supply-chain checks: verifying which open-weight model actually backs an API endpoint, or detecting distillation of our fine-tunes. The "sample many, compare distributions, nearest reference, no classifier" recipe is implementable against any OpenAI-compatible endpoint; the O(1/R) guidance tells you how to size the sampling budget.

## References
- Paper: https://arxiv.org/abs/2611.27831 (cs.LG, cs.CL; submitted 2026-11-20)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27831
- Related: explanation-cleave-guardrail-severing-spectral-coupling.md, explanation-model-lineage-graph-forensics.md

> Zookeeper correction (2026-11-23): earlier version's specifics (95 models/10 families, 3–5 samples/100 probes recipe, reference-free probe metric) were not supported by the arXiv abstract; corrected against the verified abstract.
