---
title: Visual Attribution Limits and Graded Provenance Auditing in Commercial Video-Generation
  APIs
diataxis: Explanation
domain: security-privacy
topic: model-provenance
source: arXiv
source_url: https://arxiv.org/abs/2611.26508
keywords:
- knowledge-base
- model-provenance
- security-privacy
- explanations
---
# Visual Attribution Limits and Graded Provenance Auditing in Commercial Video-Generation APIs

## Overview
Mei, Li, Xu, He and Li (Guangzhou Software Research Institute / Sun Yat-sen Univ. / HKUST, Nov 2026) audit whether files returned by 19 endpoints of 13 commercial text/image-to-video APIs can be *attributed to a producing model*, combining metadata inspection, detector confidence scores and a tiered (graded) provenance scheme built on the Chinese national standard **GB 45438-2025**. Key negative result: pixel-level attribution to a specific model is effectively impossible today.

## Reference: what provenance evidence actually exists in commercial AI video output

### Model attribution via pixels — not viable
- Detector top-1 accuracy against the 13 deployed generators ranges **0.084–0.588** (19 endpoints).
- Accuracy rises with detector training-set coverage, but even **49.6× more training data per model** does **not** close the gap.
- **Cross-encoder agreement is weak**, so detector outputs are unreliable as standalone provenance evidence.
- Conclusion: pixel-level model attribution "does not currently support reliable model-level provenance".

### Metadata disclosure — the usable signal (GB 45438-2025 explicit fields)
| Endpoint group | Field population |
|---|---|
| 9 endpoints (incl. Sora-2, Pixverse-V5.5) | producer name **and** propagate ID fully populated |
| 2 endpoints (incl. Seedance-1.5) | producer name only |
| 8 endpoints (incl. Veo-3.1, Wan2.5) | no provenance metadata |

### The two independent axes
- **Visual realism** tracks the *request* (what you asked for).
- **Provenance completeness** tracks the *endpoint* (which API produced it).
→ You can get either realistic output or complete provenance, **not both** from a single API call.

### Graded provenance scheme (Tier 1→3)
The paper's proposed auditing construct combines four evidence classes: GB 45438-2025 metadata, implicit watermark status, content-derived detector scores, and retrieval-based evidence. Tiers define what can be *claimed* about a file given the available evidence, instead of pretending pixel-based attribution works.

### Auditability criteria proposed
1. Endpoint-level provenance reporting requirements;
2. Compatibility between content-based detectors and the metadata claims;
3. Disclosure rules for metadata absence (silence must be a finding, not a pass).

## Relevance to Our Domain
The practical reference for anyone building content-authenticity or AI-content compliance pipelines: it tells you which vendor APIs emit usable C2PA-style provenance, how far detector scores can be trusted (not far), and gives a graded evidence model that regulators and audit tools can implement today. Complements our C2PA / synthetic-media / model-provenance coverage.

## References
- Paper: https://arxiv.org/abs/2611.26508
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26508?fields=citationCount,year (rate-limited at check time; 2026)
- Standard: GB 45438-2025 (Chinese national standard for explicit AI-content identifiers)

## Related
- [[explanation-c2pa-p2pa-agent-provenance-ai-generated-content]] — the provenance standard this audits against
- [[explanation-synthetic-media-provenance]] — synthetic-media detection landscape
