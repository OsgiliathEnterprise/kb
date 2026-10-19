---
title: How to Detect OSS Supply Chain Threats with Taxonomy-Aligned LLMs
diataxis: How-to Guide
domain: security-privacy
topic: supply-chain
source: 'arXiv: How to Detect OSS Supply Chain Threats with Taxonomy-Aligned LLMs
  (arXiv:2610.01263)'
source_url: https://arxiv.org/abs/2610.01263
date: 2026-10-18
keywords:
- knowledge-base
- supply-chain
- security-privacy
- how-to
---
# How to Detect OSS Supply Chain Threats with Taxonomy-Aligned LLMs

## Problem

Signature- and rule-based detectors for open-source supply chain attacks (typosquatting, dependency confusion, Trojan Source obfuscation, malicious build injection, CI/CD pipeline poisoning) do not generalize as attacks evolve — and the scale is no longer theoretical: Sonatype documented **1.2M+ cumulative malicious packages** across major registries. This paper (cs.CR, 2026) provides a working, reproducible method for automated detection and multi-class classification of OSS threats using LLMs, and identifies the single factor that dominates accuracy.

## Prerequisites

- An LLM with strong instruction-following (paper uses GPT-4; zero-shot Mistral 7B is the open-weight baseline).
- Access to the public dataset: **999 verified real-world incidents** (2018–2026) across **eight package ecosystems**, curated from GitHub Security Advisories, CISA alerts, government security databases, and commercial threat intelligence. Dataset, scripts, and code are public on GitHub (linked from the paper).
- Familiarity with the **AV-xxx taxonomy**: five semantically distinct attack categories that the detection pipeline classifies into.

## Steps

### 1. Adopt the AV-xxx taxonomy as your label space

Do not classify into free-form "malicious/benign." The taxonomy's five categories are *semantically distinct* (each maps to a different mechanism of compromise), and alignment to them is the paper's central performance lever. Define your classifier's output space as exactly these five labels.

### 2. Build (or load) the incident corpus

Use the paper's 999-incident dataset if you want validated baselines; otherwise curate from the same four source classes (GHSA, CISA, government databases, commercial TI) and verify each incident is real and attributable to a specific package/CI artifact.

### 3. Use taxonomy-aligned prompting, not fine-tuning

Prompt the LLM with the taxonomy definitions and category boundaries as part of the instruction (the "taxonomy-aligned" condition). This single change — alignment in the prompt — is what separates the top configuration from the rest.

### 4. Calibrate expectations from the paper's results

| Method | Accuracy |
|--------|----------|
| GPT-4, taxonomy-aligned prompting | **97%** (macro F1 0.97) |
| TF-IDF (simple baseline) | 82.3% |
| SecRoBERTa (domain-pretrained) | 77.5% |
| Fine-tuned Llama 3.1 8B | 70.5% |
| Mistral 7B, zero-shot, no alignment | 65.7% |

Read this table carefully: **prompt alignment beats model scale, domain pretraining, and fine-tuning combined.** A simple TF-IDF classifier outperforms both fine-tuned LLMs. If your pipeline is underperforming, check the label space and prompt alignment before reaching for a bigger model.

### 5. Handle ecosystem imbalance explicitly

Cross-ecosystem results vary: npm sits at a **65.5%** baseline accuracy while smaller ecosystems reach 100%. GitHub Actions shows a large accuracy/F1 divergence (**82.4% accuracy vs. 0.367 macro F1**) — systematic class imbalance, where the majority class inflates accuracy. If GitHub Actions incidents are in your scope, report macro F1, not accuracy, and expect LLM contextual reasoning to help most there.

## Verification

- Reproduce the GPT-4 aligned configuration: target 97% accuracy / 0.97 macro F1 across all five categories.
- Sanity-check with the TF-IDF baseline (82.3%) — if your aligned-LLM pipeline scores below the TF-IDF baseline, the taxonomy alignment in the prompt is not doing its job.
- For GitHub Actions-class data, verify class balance before trusting any accuracy figure.

## Relevance to Our Domain

Concrete, citable method for the [supply chain](../../../explanations/securityprivacy/supplychain) notes: if you need automated OSS threat triage, the recipe is *taxonomy in the prompt + a strong LLM*, not a fine-tuned small model. The npm-vs-small-ecosystem gap is also useful context for registry risk prioritization in dependency review workflows.

## References

- Paper: https://arxiv.org/abs/2610.01263 (v1 2026-10-01, v2 2026-10-15)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.01263
- Dataset and code: public on GitHub (link in paper)
