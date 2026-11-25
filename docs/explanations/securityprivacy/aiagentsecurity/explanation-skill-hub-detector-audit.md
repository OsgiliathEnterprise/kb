---
title: Demystifying Detectors Guarding Agent Skill Hubs
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.30913
date: '2026-11-25'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Demystifying Detectors Guarding Agent Skill Hubs

## Overview
Yang, Ying, Liao, Tao & Xu (arXiv:2611.30913, cs.CR, submitted 2026-11-23) run the **first systematic evaluation of the security detectors that public Agent Skills hubs actually deploy**. On 1,477 agent skills drawn from seven datasets, they test four hub-adopted and two community-provided malicious-skill detectors and find that even the best one both misses malicious skills and mislabels benign ones at rates that matter for real moderation workflows.

## Problem Statement
Agent Skills has become the de-facto open standard for extending agent capabilities, and public skill hubs now mediate a software-supply-chain-like flow of third-party capability packages. Hubs lean on automated detectors to vet skills at scale, but before this work there was no measured understanding of whether those detectors work — a classic "security theater" risk in an ecosystem growing on trust.

## Key Contribution
- **First empirical baseline** for hub-side skill vetting: 6 detectors × 1,477 skills from 7 datasets.
- **Quantified headroom gap**: the top hub-adopted detector by overall F1 (skill-scanner with Qwen3.6) still misses **4.9% of malicious skills** and falsely flags **17.8% of benign skills**.
- **Two recurring failure mechanisms** identified via manual analysis of detector findings and decision processes:
  - *False positives*: detectors flag sensitive operations (e.g., credential access) without asking whether the operation serves the skill's legitimate purpose.
  - *False negatives*: detectors *recognize* malicious instructions or behaviors but underestimate their severity or dismiss valid findings during a review stage, leaving malicious skills unblocked.
- **Actionable remediation**: prompt refinements to the SOTA detector skill-vetter improve mean F1 in **8 of 9 evaluation settings**, up to **+22.7 percentage points**.

## Technical Approach
The study combines large-scale benchmark evaluation with qualitative audit: the authors manually inspect what detectors find and how they decide, which is what surfaces the severity-underestimation and over-flagging patterns. The prompt-level fixes show that a meaningful share of detector failure is not model capability but decision framing.

## Results
Best detector: 4.9% malicious miss rate, 17.8% benign false-flag rate. Refined skill-vetter prompts: F1 gains in 8/9 settings, up to +22.7 points. Conclusion: current skill-vetting practice has real gaps; detection must become context-aware (purpose of sensitive operations) and severity-calibrated.

## Relevance to Our Domain
Skill hubs are the npm/PyPI of the agent ecosystem, and our KB already tracks skill supply-chain threats (skill mis/leakage, agent supply chain, skill trust & provenance). This note gives concrete numbers to the question "can we trust hub scanners?" — the answer being: not yet, and here's where the failures concentrate.

## References
- Paper: https://arxiv.org/abs/2611.30913
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30913 (citationCount: 0 at ingest, 2026-11-25)
