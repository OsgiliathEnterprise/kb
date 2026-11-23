---
title: Quantifying the Intrusiveness of Retrofitting Retrieval-Augmented Generation
  onto Legacy Software Systems
diataxis: How-to Guide
domain: ai-machine-learning
topic: rag
source: arXiv
source_url: https://arxiv.org/abs/2611.23931
date: 2026-11-23
keywords:
- knowledge-base
- rag
- ai-machine-learning
- how-to
---
# How to Assess and Choose a RAG Retrofit Pattern for Legacy Systems

## Objective
Decide — with measurable evidence rather than intuition — how to attach retrieval-augmented generation to an existing REST/monolithic system, using the paper's pattern taxonomy and the Legacy Intrusion Score (LIS / LIS-X).

## Context
Teams adding RAG to legacy systems typically write an ad hoc HTTP call into a handler and have no way to quantify how intrusive that choice is. The paper formalizes three retrofit patterns and two generations of intrusion metrics, validated statically on five legacy systems (two real open-source codebases at pinned commits) and dynamically by deploying all three patterns as separate OS processes.

## Step 1 — Classify your retrofit into one of three patterns
1. **Sidecar**: RAG runs as a separate process; the legacy system calls it out-of-band.
2. **SDK-embed**: a RAG SDK is embedded inside the legacy codebase.
3. **Naive-invasive**: RAG logic is written directly into request handlers.

## Step 2 — Score code intrusiveness with LIS (static)
Measure three code sub-metrics per pattern: **churn** (how much legacy code changes), **breadth** (how many components are touched), **coupling** (new dependencies introduced between legacy and RAG code). LIS ranks patterns by component-wise dominance of these sub-metrics; the ranking sidecar &lt; SDK-embed &lt; naive-invasive held across all five systems and 2,000 random weightings.

## Step 3 — Score operational impact with LIS-X (live)
Deploy each candidate and measure three operational sub-metrics on the live system:
- **Run-time overhead** on legacy endpoints.
- **Fault propagation** (does RAG-layer failure reach legacy requests?).
- **Silent feature degradation** (does the system keep returning "success" without the AI content?).

## Expected Results (what the case study measured)
- Sidecar added **no detectable latency** to the legacy endpoint (0.07 ms, 95% CI [−0.10, 0.24]).
- SDK-embed and naive-invasive added **569 ms and 475 ms** respectively — statistically indistinguishable from each other (p=0.62).
- Both embedded patterns passed a 2 s dependency delay straight through to legacy requests, and under fast-fail RAG outages kept returning successful responses **missing the AI field** — the silent-degradation failure mode.
- Load on the RAG layer slowed the legacy service by **1.51–1.57×** on a shared host; sidecar staleness averaged 911 ms at a 2 s polling interval.
- Retrieval quality was not the constraint: hit@1 = 0.95; three hosted LLMs answered all 12 test questions correctly (a local model 9/12); backends were swappable via one request field.

## Verification
Confirm the chosen pattern by: (1) an A/B latency test against an unmodified endpoint (demand a CI containing zero, like the sidecar's [−0.10, 0.24] ms), (2) fault-injection on the RAG layer while watching legacy success responses for *content* regressions, not just status codes, (3) load-testing the RAG layer while timing legacy p50/p95.

## Caveats
All dynamic results come from one host and one system; the static ranking is validated as a metric (it follows from component dominance) rather than tested as a hypothesis.

## References
- Paper: https://arxiv.org/abs/2611.23931
- Related: rag topic notes on RAG architecture patterns
