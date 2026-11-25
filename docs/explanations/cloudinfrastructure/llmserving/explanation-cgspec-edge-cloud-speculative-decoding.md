---
title: 'CGSpec: Consistency-Guided Speculative Decoding with Overlap-Aware Verification
  Scheduling for Edge-Cloud Inference'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.30455
date: '2026-11-25'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# CGSpec: Consistency-Guided Speculative Decoding with Overlap-Aware Verification Scheduling for Edge-Cloud Inference

**Authors:** Yuanbing Ouyang, Xiaoli Liu, Shirong Wei, Hao Wang, Xiang Su


## Overview
Ouyang, Liu, Wei, Wang & Su (arXiv:2611.30455, cs.DC, submitted 2026-11-23) address **collaborative speculative decoding**: edge clients draft tokens locally, a shared cloud verifier checks them. Their framework, CGSpec, attacks the two failure modes that make multi-client edge-cloud speculation inefficient — draft/verifier disagreement and heterogeneous client return times — and reports double-digit throughput gains over the prior SOTA.

## Problem Statement
In multi-client edge-cloud speculative decoding, every wasted draft token costs communication *and* scarce shared-verifier compute. Two problems compound it: (1) when an edge draft distribution diverges from the cloud target, verification work is burned on tokens that will be rejected; (2) clients return drafted tokens at very different times (heterogeneous networks), so the shared verifier idles or serializes behind stragglers. Existing schedulers treat neither condition adaptively.

## Key Contribution
- **Consistency-guided speculation budget**: measures draft–target distribution divergence and adapts the per-request speculative budget accordingly (speculate more where drafts agree, less where they don't).
- **Nomination-and-competition candidate tree construction**: clients nominate candidate tokens, competition plus global growth control and local token selection shape the candidate tree — balancing tree breadth against verifier capacity.
- **Overlap-aware scheduler**: estimates remaining verification work and per-client return times to prioritize requests and maximize verifier utilization under asynchrony.
- **Results**: across 24 configurations (8 and 16 clients, four model pairs, three datasets, heterogeneous networks), highest mean system *and* client throughput; +12.2% / +10.2% system throughput and +14.0% / +33.0% mean client throughput vs current SOTA methods.

## Technical Approach
The design splits into a client-side policy (divergence-adaptive budget, local token selection) and a server-side policy (global tree growth control, competition among nominated candidates, work/return-time-aware prioritization). The scheduler's overlap awareness is the distributed-systems core: it treats the verifier as a shared resource whose utilization depends on the *temporal overlap* between arriving draft batches and pending verification work, not just queue order.

## Results
Highest mean system and client throughput among evaluated methods across the 24 tested configurations (8 and 16 clients); improvements of 10–33% over SOTA depending on metric and configuration.

## Relevance to Our Domain
Edge–cloud inference is becoming a real deployment topology for on-device assistants; this note documents how speculative decoding must co-design *acceptance statistics* and *cluster scheduling* once the verifier is shared. Pairs with our KB coverage of speculative decoding (SpecSearch, NarrowSpec, Callo) from the distributed-scheduling angle rather than the draft-model angle.

## References
- Paper: https://arxiv.org/abs/2611.30455
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30455
