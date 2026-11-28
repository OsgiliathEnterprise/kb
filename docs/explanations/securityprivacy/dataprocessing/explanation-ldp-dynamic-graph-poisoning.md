---
title: Poisoning Attacks to Local Differential Privacy Protocols for Dynamic Graphs
diataxis: Explanation
domain: security-privacy
topic: data-processing
source: arXiv
source_url: https://arxiv.org/abs/2611.34340
date: 2026-11-25
keywords:
- knowledge-base
- data-processing
- security-privacy
- explanations
---
# Poisoning Attacks to Local Differential Privacy Protocols for Dynamic Graphs

## Overview
Liu et al. (arXiv:2611.34340, submitted 2026-11-25) deliver the **first systematic study of data poisoning attacks against LDP-protected dynamic graph protocols**. Local differential privacy protects user data in decentralized graph analytics — but its strong privacy guarantees say nothing about *integrity*: malicious participants can inject fake data and silently wreck the aggregate statistics.

## Problem Statement
LDP has become the default privacy paradigm for dynamic graph analysis in decentralized settings (users randomize their own data before upload). The open security question: can injected malicious data degrade the accuracy of graph metric estimation, and how should such attacks be *designed and measured* when the graph evolves over time?

## Key Challenges Identified
- **Temporal scheduling**: attack resources must be allocated across time steps, not just once.
- **Impact measurement**: cumulative damage over time is not captured by static metrics.

## Contributions
1. **Absolute gain metric** — quantifies the overall deviation of graph statistical metrics before vs after the attack, aggregated across the time dimension.
2. **Unified poisoning framework** for dynamic graphs, composed of three stages:
   - target node selection,
   - dynamic fake-node scale scheduling,
   - fake edge injection.
3. **TEA (Temporal Enhanced Attack)** — dynamically schedules attack resources to maximize effectiveness, benchmarked against two baselines, **ESA** (equal-scale) and **RSA** (random-scale).

## Results
Extensive experiments on real-world and synthetic datasets show the proposed attacks **significantly degrade the accuracy of graph metric estimation for target nodes** — TEA outperforms the baseline schedules. Code is public (https://github.com/spiralfood/GraphPoison-LDP).

## Relevance to Our Domain
For our privacy and data-pipeline security coverage, the takeaway is architectural: **LDP secures confidentiality only; integrity of the ingest path must be defended separately** (anomaly screening of contributed perturbations, rate/scale limits on new participants, temporal monitoring of metric drift). Any telemetry or graph-analytics product using LDP-style client-side randomization should treat the absolute-gain metric as a red-team KPI.

## Related Literature
This paper sits on a fast-moving line of LDP-integrity work; understanding it requires the static predecessors and the defense side:

- **Cao et al., USENIX Security 2021** — *Data Poisoning Attacks to Local Differential Privacy Protocols*: the foundational study showing malicious users can skew LDP frequency/oracle-based estimation; established that LDP's privacy proof offers zero integrity protection. https://www.usenix.org/conference/usenixsecurity21/presentation/cao-xiaoyu
- **He, Huang, Ye & Hu (arXiv:2412.19837, ICDE 2025)** — *Data Poisoning Attacks to LDP Protocols for Graphs*: the direct static-graph predecessor. Attacks inject fake users into LDP graph-collection protocols that gather atomic metrics (adjacency bit vectors, node degrees) per node; demonstrated on degree centrality and clustering coefficient. Notably, the authors' own two countermeasures **failed to offset the damage**, motivating stronger defenses. https://arxiv.org/abs/2412.19837
- **Li, Li, Wang & Sun (arXiv:2506.02156)** — *Mitigating Data Poisoning Attacks to Local Differential Privacy*: the current defense reference for frequency estimation — malicious-user detection, hidden attack-pattern recognition (for stealthy adaptive attackers), and post-processing recovery of corrupted aggregates, all without extra data or attack knowledge. The dynamic-graph analogue of this mitigation stack is still an open gap that TEA-era work highlights. https://arxiv.org/abs/2506.02156

Read order for the area: Cao (static, frequency) → He (static, graphs, weak countermeasures) → Liu (dynamic graphs, temporal scheduling) → Li (defenses).

## References
- Paper: https://arxiv.org/abs/2611.34340
- Code: https://github.com/spiralfood/GraphPoison-LDP
- Cao et al., USENIX Sec '21: https://www.usenix.org/conference/usenixsecurity21/presentation/cao-xiaoyu
- He et al., static-graph poisoning: https://arxiv.org/abs/2412.19837
- Li et al., mitigation framework: https://arxiv.org/abs/2506.02156
