---
title: "LACUNA: LLM Unlearning Testbed with Parameter-Level Localization"
diataxis: Explanation
domain: AI & Machine Learning
topic: LLMs & Agents
source: "arXiv"
source_url: "https://arxiv.org/abs/2607.02513"
arxiv_id: "2607.02513"
date: 2026-07-02
keywords:
- llm-unlearning
- data-privacy
- model-safety
- knowledge-erasure
- pii
visibility: public
---
# LACUNA: A Testbed for Evaluating Localization Precision for LLM Unlearning

## Overview

LLM unlearning aims to remove specific knowledge (e.g., personally identifiable information) from trained models without retraining from scratch. Most existing benchmarks evaluate unlearning at the behavioral level — checking whether a model stops producing certain outputs. LACUNA takes a fundamentally different approach by providing ground-truth parameter-level localization, enabling researchers to verify whether unlearning actually targets the weights responsible for knowledge storage.

## Problem Statement

Current unlearning evaluation has a critical blind spot:

- **Output-level evaluation**: Existing benchmarks check if a model refuses to generate certain information, but this could mean the knowledge was erased OR simply obfuscated
- **Resurfacing attacks**: Techniques that coax previously "unlearned" information back from models demonstrate that output-level silence does not guarantee parameter-level erasure
- **Localization imprecision**: State-of-the-art methods claim to locate knowledge in specific parameters, but there has been no way to verify this claim because ground truth is unavailable

This gap makes it impossible to distinguish between genuine knowledge removal and behavioral masking.

## Key Contribution

LACUNA is the first unlearning testbed with **ground-truth parameter-level localization**. By injecting synthetic PII into predefined model parameters through masked continual pretraining, the testbed knows exactly which weights store which knowledge.

### Testbed Architecture
- **Models**: 1B and 7B OLMo-based models
- **Injection method**: Masked continual pretraining on synthetic individual PII
- **Known ground truth**: Exact parameter locations where knowledge is stored

## Technical Approach

### Knowledge Injection
Synthetic PII records are injected into specific, predefined parameters of OLMo models. The injection process uses masked continual pretraining, ensuring the knowledge is stored in known locations rather than distributed unpredictably.

### Benchmark Evaluation
Current SOTA unlearning methods are evaluated on two criteria:
1. **Localization accuracy**: Do they target the correct parameters?
2. **Erasure effectiveness**: Does removing those parameters actually eliminate the knowledge?

### Baseline Comparison
A simple gradient-based unlearning method is used as a baseline to show that when localization is correct, even straightforward methods achieve strong results.

## Results

### Critical Findings
- **High imprecision**: Despite strong output-level performance, existing SOTA unlearning methods are highly imprecise at the parameter level
- **Resurfacing vulnerability**: Methods that appear successful at the output level remain susceptible to resurfacing attacks because they fail to target the right parameters
- **Localization matters**: When localization is successful, even a simple gradient-based method achieves strong erasure and robustness to resurfacing attacks

### Implications
The results suggest that the primary bottleneck in unlearning is not the erasure technique but the localization step. Current methods optimize for behavioral compliance rather than genuine knowledge removal.

## Relevance to Our Domain

This research has implications for:

1. **Data privacy compliance**: Organizations deploying LLMs need to verify that unlearning actually removes sensitive data, not just hides it
2. **Model safety evaluation**: LACUNA provides a rigorous benchmark that goes beyond behavioral testing
3. **AI governance**: Regulatory frameworks around data removal (e.g., GDPR right to be forgotten) require verifiable erasure, not just behavioral suppression
4. **Research direction**: The finding that localization is the bottleneck suggests future work should focus on improving parameter-level targeting rather than erasure algorithms

## References

- Boglioni M, Rousset T, Reddy S, Mosbach M, Dankers V. *LACUNA: A Testbed for Evaluating Localization Precision for LLM Unlearning*. arXiv:2607.02513 [cs.CL], 2026-07-02. DOI: 10.48550/arXiv.2607.02513
- Related work: Machine unlearning literature, knowledge editing in LLMs, and model interpretability research
