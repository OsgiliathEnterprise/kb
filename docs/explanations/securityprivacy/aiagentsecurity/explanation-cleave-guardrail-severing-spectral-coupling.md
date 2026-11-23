---
title: 'Cleave: Severing Guardrails and Auditing Spectral Coupling in Open-Weight
  LLMs'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27426
date: 2026-11-23
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Cleave: Severing Guardrails and Auditing Spectral Coupling in Open-Weight LLMs

**Authors:** Feng Huang, Qiang Huang, Yue Gao, Mei Zhang, Bin Liu, Lihua Ju, Xinhao Wei, Yongfeng Huang, Yu Qing, Yunqi Zhang


## Overview
Cleave is a **training-free weight-editing attack** that strips safety guardrails from open-weight LLMs. The key finding: guardrails rely on the **residual writing weights** to trigger refusals, so directly editing those weights removes safety restrictions while preserving general capability. A dual-stage defense (subspace diagnostics + weight-coupling audits) is proposed in response.

## Problem Statement
Open-weight LLMs are downloaded and deployed locally beyond the provider's control; developers embed guardrails before release, but there is no rigorous way to certify guardrail integrity after distribution. Existing removal attacks rely on coarse global linear-concept edits that either fail to disable refusal or damage capability.

## Key Contribution
- **Cleave**: training-free attack directly editing residual writing weights to remove safety restrictions — can remove *all* guardrails or **selectively lift only cybersecurity restrictions**.
- Selective removal retains up to a **99% refusal rate on other harmful requests** and avoids weight rank collapse, thereby **evading both behavioral spot-checks and static weight audits**.
- A **dual-stage defense**: pre-release subspace diagnostics + post-release weight-coupling audits, achieving **100% detection recall at 1% false-positive rate**.

## Technical Approach
The attack targets the residual writing weights identified as the refusal trigger. Selective lifting changes only the cybersecurity-restricted subspace while leaving rank structure intact, so behavioral spot-checks still see refusals on other categories and static audits see no rank collapse. The defense inverts this: subspace diagnostics pre-release, weight-coupling audits post-release.

## Results
Across **five open-weight LLMs from 7B to 320B parameters**, Cleave achieves up to a **67.97% attack success rate on seven safety benchmarks**, substantially outperforming existing white-box baselines. On **356 cybersecurity tasks and 15 live vulnerable services**, it boosts executable exploit generation by up to **24.0×** and compromises up to **66.7% of the targets**.

## Relevance to Our Domain
Sets the threat model for any pipeline that pulls third-party open-weight models: guardrail integrity must be *verified*, not assumed — selective (cyber-only) guardrail removal evades behavioral spot-checks, so spot-checks alone are insufficient. The subspace-diagnostic + weight-coupling audit is a candidate check in our model-intake process. Pairs with DistDNA (provenance) as the "what is it / is it tampered with" pair of supply-chain controls.

## References
- Paper: https://arxiv.org/abs/2611.27426 (cs.CR, cs.AI; submitted 2026-11-20)
- Related: how-to-distdna-lm-fingerprinting-stochastic-decoding.md, explanation-open-weight-model-provenance.md

> Zookeeper correction (2026-11-23): initial auto-summary (389-model/11-family audit, spectral-coupling metric, "17/389 zero-cost decay") was not supported by the arXiv abstract; corrected against the verified abstract.
