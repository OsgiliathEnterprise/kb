---
title: 'Live Migration of Gated DeltaNet Requests: Exact Catch-Up and the Cost of
  Log Backlog'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.26153
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# Live Migration of Gated DeltaNet Requests: Exact Catch-Up and the Cost of Log Backlog

## Overview
This paper studies how to migrate an *in-flight streaming request* served by a Gated DeltaNet (GDN) linear-attention model from one GPU worker to another without changing the output. Unlike KV caches, a GDN request carries a **recurrent state that must be recovered at the exact token boundary** on a destination worker holding identical model weights. The authors compare migration paths and quantify the trade-off between handoff gap, source release time, and output rate.

## Problem Statement
Live migration is well-explored for Transformer KV caches, but recurrent-state models (GDN hybrids) need state reconstruction at the correct boundary. Candidate paths each have costs: snapshots transfer large state, batched replay risks long timeouts, token catch-up burns decode compute, and an update-log approach pays a "log backlog" when transfers are slow.

## How-to: Migrate a Streaming GDN Request
1. **Pick a state-recovery path** among: snapshot, batched replay (e.g., 32-step chunks), token catch-up, or the paper's compact **update-log** path.
2. **Prefer exact catch-up when bit-exactness matters** — it preserves native single-token decode and matched the bitwise reference on the tested inputs.
3. **Use a selector to choose at migration time**: a prior-based or probe-calibrated selector picks the path according to what you optimize — user-interruption latency, earliest source release, or output rate.
4. **Budget the network**: at 10 MB/s, compact logs left the median handoff gap at 445–464 ms, while 32-step replay cut it to ~81 ms — replay becomes attractive exactly when bandwidth is scarce.
5. **Select retrospectively with calibration**: on 40 historical KV-aligned Qwen configurations, probe-calibrated selection cut the mean handoff gap by 13.9% versus the strongest scored simple rule (under either numerical contract).

## Results
- 1,350 scheduled pure-GDN trials across two GPU deployments; compact logs gave the shortest exact handoff gap in **all 90 configurations** (10 winners decided under a replay-timeout bound).
- In 80 complete configurations, exact catch-up **always released the source GPU earliest**; 32-step replay gave the highest output rate when arithmetic differences were tolerated.
- Initial whole-request hybrid results reported; joint KV+GDN migration policy left as specified future evaluation.

## Relevance to Our Domain
Adds linear/hybrid-attention models to the serving-operations toolbox: migration policy for GDN is not a KV-cache problem, and the right path is workload- and bandwidth-dependent — hence selectors, not fixed rules. Useful for anyone building elastic inference fleets on frontier hybrid architectures.

## References
- Paper: https://arxiv.org/abs/2611.26153
