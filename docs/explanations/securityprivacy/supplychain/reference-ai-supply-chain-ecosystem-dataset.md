---
title: 'Mapping the AI Supply Chain: Dependencies, Vulnerabilities, and Market Concentration
  in the AI Ecosystem'
diataxis: Explanation
domain: security-privacy
topic: supply-chain
source: arXiv
source_url: https://arxiv.org/abs/2611.24927
keywords:
- knowledge-base
- supply-chain
- security-privacy
- explanations
---
# Mapping the AI Supply Chain: Dependencies, Vulnerabilities, and Market Concentration in the AI Ecosystem

## Overview
AI systems are assembled across many organizations contributing models, data, compute, capital and talent — but the *relationships* between these actors are poorly documented. This paper (Cen, Gailmard, Kim, Bommasani, Ho, Liang — Princeton/Stanford) delivers a **multilayered, large-scale dataset of actors and relationships in the AI ecosystem**, built by a document-mining pipeline and annotated with dates, descriptions, types and tags. It is the go-to reference dataset for studying who depends on whom in AI.

## What the Reference Contains
- **Multi-layer supply chain graph**: organizations and their contributions — models, data, chips, infrastructure, capital, talent — as typed, dated, tagged relationships.
- **Illustrative analyses** you can reproduce or extend:
  - most central actors in the ecosystem,
  - network concentration measures,
  - community detection and **chokepoint identification**.
- Motivating concern taxonomy: concentration, power, chokepoints, cascading failures, fragmented accountability, risk.

## Access (lookup)
| Artifact | Location |
|---|---|
| Dataset | https://huggingface.co/datasets/sarahcen/ai-supply-chain |
| Interactive explorer | https://aisupplychains.org/ |
| Primary class | cs.CY (also cs.AI) |

## Known Limitations (stated by the authors)
- **Necessarily incomplete**: public documents omit private deals.
- Coverage is **shaped by the search design** of the mining pipeline — treat absent edges as "not publicly documented", not "nonexistent".

## Why It Matters for This KB
- Supply chain security work usually covers packages/models; this dataset adds the **organizational layer** — the right substrate for reasoning about cascading failures ("what breaks if provider X exits?") and fragmented accountability in AI incidents.
- Chokepoint analysis directly informs concentration risk assessments for model/data/compute dependencies in platform architecture reviews.

## Related
- [[howto-taxonomy-aligned-llm-oss-threat-detection]] — package-level supply chain detection; this is the org-level complement
- [[explanation-quantized-llm-supply-chain-verifiability-gap]] — model-artifact trust gap within the mapped chain

## References
- Paper: https://arxiv.org/abs/2611.24927
- Dataset: https://huggingface.co/datasets/sarahcen/ai-supply-chain
- Explorer: https://aisupplychains.org/
