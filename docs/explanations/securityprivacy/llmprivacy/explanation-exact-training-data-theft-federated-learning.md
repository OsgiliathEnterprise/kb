---
title: Stealing Exact Training Data from Other Clients during Federated Learning
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.24689
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# Stealing Exact Training Data from Other Clients during Federated Learning

## Overview
This paper demonstrates, for the first time, that a malicious participant in Federated Learning can recover *exact* sentences of other clients' training text from a single round's aggregated model update. Prior gradient-inversion attacks could approximate text; exact recovery was considered infeasible because FedAvg entangles many clients' gradient contributions.

## Problem Statement
Federated Learning promises privacy by never sharing raw data — only model updates. Gradient-inversion attacks already reverse-engineer private data from those updates, but for text, a malicious *client* (not just the server) recovering exact sentences was believed impossible: FedAvg mixes the gradient signals of many clients, obscuring any individual sentence.

## Key Contribution
- A novel attack pipeline that **progressively unwinds the FedAvg entanglement** through an iterative loop.
- Mechanism: sentences recovered exactly in one round have their gradient contributions **subtracted from the aggregate**, exposing the remaining sentences for exact recovery in the next iteration — a bootstrapping peeling process.
- First demonstration of **100%-precision exact sentence recovery** by a client-side adversary.
- Works in regimes far beyond prior attacks: on aggregates containing up to **4× more tokens than the model's hidden dimension**, up to **80.2% of client sentences** are recovered exactly — where existing attacks recover none exactly.

## Technical Approach
The attacker iterates: invert the current aggregate to recover some sentences exactly, compute their expected gradient contributions, subtract them, and repeat on the residual. Each round's exact recoveries sharpen the signal for the next, dismantling the multi-client entanglement layer by layer.

## Relevance to Our Domain
A decisive data point for federated-learning threat modeling: client-side adversaries, not just honest-but-curious servers, can now extract verbatim training text at scale. This weakens privacy assurances for FL deployments handling sensitive text (healthcare, legal, source code) and strengthens the case for secure aggregation, DP-SGD, or other mitigations. It sits in the broader gradient-inversion / data-reconstruction literature on federated learning.

## References
- Paper: https://arxiv.org/abs/2611.24689
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24689
