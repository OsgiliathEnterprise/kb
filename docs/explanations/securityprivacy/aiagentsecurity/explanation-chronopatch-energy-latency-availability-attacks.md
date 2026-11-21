---
title: 'ChronoPatch: Black-Box Energy-Latency Attacks on Vision-Language Models'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.26117
date: 2026-11-21
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# ChronoPatch: Black-Box Energy-Latency Attacks on Vision-Language Models

## Overview
This paper introduces and formalizes a new class of availability threat against deployed vision-language models (VLMs): **energy and latency availability attacks**. Rather than trying to make the agent answer incorrectly, an attacker makes it answer *expensively* — inflating energy draw and response latency until the service's cost or service-level objectives are broken. The resulting "cost-of-service" metric ties availability failures directly to energy efficiency, extending green-AI analysis to adversarial settings.

## Threat Model
- **Black-box:** the attacker has no access to model internals.
- **Budgeted:** a limited number of queries can be sent.
- **Deployment-realistic:** only observations available to an external client are used.
- **Target:** open-source VLMs served locally and commercial multimodal APIs.

## Method
1. **Evolutionary search guided by response length.** Candidate adversarial visual perturbations are evolved with a fitness signal derived from how long the model's response becomes — longer responses imply more compute, energy and latency.
2. **Decision-based optimization with subspace calibration.** The search operates on query feedback only (no gradients), calibrating the probe subspace so exploration stays efficient under the query budget.
3. **Spatially constrained perturbations.** Adversarial energy is restricted to as little as **5% of the image budget**, keeping perturbations compact.

## Results
Across four open-source VLMs:
- End-to-end **latency increases of 47.86% to 293.34%**.
- **GPU energy increases of 41.44% to 249.70%**.
Against commercial multimodal APIs, with only a **500-query budget**:
- **Response-length inflation of 37.6% to 81.5%**.
- **Client-side latency inflation of 1.82× to 2.29×**.

## Why It Matters
Availability risk for agent services is usually discussed in terms of request floods; this work shows that *input crafting alone* can multiply per-request cost by 2–4× without degrading apparent correctness, silently breaking energy budgets and SLAs. It motivates cost-aware monitoring (per-request energy/latency anomalies) as a security control for VLM agent deployments.

## References
- Paper: https://arxiv.org/abs/2611.26117
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26117
