---
title: 'Mapping the AI Supply Chain: Dependencies, Vulnerabilities, and Market Concentration
  in the AI Ecosystem'
diataxis: Explanation
domain: security-privacy
topic: supply-chain
source: arXiv
source_url: https://arxiv.org/abs/2611.24927
date: 2026-11-19
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

## Live dataset profile (stats dashboard, checked 2026-11-19)
| Metric | Value |
|---|---|
| Unique actors / actor pairs / relationships | 10,992 / 20,956 / 49,791 |
| Top relationship types | Investment 25.2% · Partnership 23.2% · Provision 18.8% · Competition 8.7% |
| Actor types | 90.1% companies (governments, academia, nonprofits are the long tail) |
| Most-connected actors | OpenAI (6,339 mentions), Nvidia (5,629), Anthropic (4,716), Microsoft (3,895), Google (3,021) |
| Top pair | Microsoft — OpenAI (1,009 relationship mentions) |

## Methodology (how the graph is built — matters when interpreting coverage)
- Seed list of **30+ frontier/foundation-model providers** (OpenAI, Anthropic, Google, Microsoft, NVIDIA, …); for each, Google Search with partnership/deal/investment search strings, plus site-restricted searches (TechCrunch, VentureBeat, Yahoo Finance), refreshed **approximately weekly** covering **late 2022 → present**.
- Full documents are scraped, classified by site/document type, then **LLM-extracted with structured outputs in two independent passes** (actors, description, evidence, evidence strength, AI-relatedness), followed by typed classification (actor type, AI stack layer, relationship type/status, directionality).
- Website view keeps AI-related relationships with **explicit evidence from Nov 2022 onward**, excluding low-confidence/contradictory labels.
- **License: CC BY-NC-SA 4.0** — free for academic/non-commercial use; commercial use needs separate agreement.
- Author-stated limitations beyond incompleteness: **US-centric collection** and under-representation of relationships never announced online (informal research collaborations).
- Canonical upstream literature: Hopkins et al., *AI Supply Chains* (arXiv:2504.20185, AIES 2025) and Bommasani et al., *Ecosystem Graphs* (AIES 2024) — cite these alongside when framing supply-chain work.

## Related
- [[howto-taxonomy-aligned-llm-oss-threat-detection]] — package-level supply chain detection; this is the org-level complement
- [[explanation-quantized-llm-supply-chain-verifiability-gap]] — model-artifact trust gap within the mapped chain

## References
- Paper: https://arxiv.org/abs/2611.24927
- Dataset: https://huggingface.co/datasets/sarahcen/ai-supply-chain
- Explorer: https://aisupplychains.org/
- Stats dashboard: https://aisupplychains.org/stats
- Methodology: https://aisupplychains.org/project
- Related work: Hopkins et al. https://arxiv.org/abs/2504.20185 · Bommasani et al., Ecosystem Graphs (AIES 2024)
