---
title: 'RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents'
diataxis: How-to
domain: aimachinelearning
topic: agentinfrastructure
source: arXiv
source_url: https://arxiv.org/abs/2609.20754
arxiv_id: "2609.20754"
date: 2026-09-20
keywords:
- knowledge-base
- agentinfrastructure
- aimachinelearning
- how-to
visibility: public
---

# RAFT: A Stateful Retrieval-Augmented Framework for Troubleshooting Agents

## Overview

Enterprise troubleshooting agents need to retrieve actionable guidance from similar *historical* cases, but standard RAG treats each support case as a static document and ignores that real cases are **multi-stage and stateful** — they progress through intermediate states over time. RAFT (Retrieval-Augmented Framework for Troubleshooting Agents) is a stateful RAG framework that models each closed historical case as a directed chain of timeline entries and retrieves at the *entry* level, surfacing cases whose intermediate states match the active case. It's a concrete, reproducible method with a released benchmark, implementation, and evaluation set.

## Problem Statement

Vanilla RAG and even GraphRAG retrieve whole documents or graph neighborhoods, which is a poor fit for troubleshooting where what matters is matching the *current state* of an ongoing problem to a similar point in a past case's trajectory. Public multi-stage troubleshooting data is also extremely rare, making it hard to evaluate such systems without production deployment. RAFT addresses both: entry-level retrieval over stateful case chains, and a benchmark that lets you evaluate the retrieval layer directly (no full agent system or production rollout required).

## Key Contribution

- **Stateful case representation**: each closed historical case is abstracted into a directed chain of timeline entries; an optional case-level graph links cases through a configurable similarity representation.
- **Entry-level retrieval**: retrieve at the granularity of individual timeline entries, surfacing cases whose intermediate states match the active case and returning the parent-case trajectory anchored at the matched state — so you get the *continuation* from that point, not just a similar document.
- A **reproducible evaluation** pairing a synthetic benchmark built from Microsoft Learn Windows Server documentation with real Apache Jira issues carrying human-created duplicate labels, plus released code and data.

## Technical Approach

To build RAFT: (1) decompose each historical case into an ordered chain of timeline entries capturing its progression; (2) index at the entry level so retrieval can match on intermediate states rather than whole-case similarity; (3) optionally link cases through a configurable similarity graph for cross-case navigation. Evaluate the retrieval layer in isolation by measuring Case Hit against vanilla RAG and GraphRAG baselines across stages of case progress — this requires no production deployment, which is what makes it practical to benchmark given the scarcity of public multi-stage data.

## Results

- RAFT improves **Case Hit over both vanilla RAG and GraphRAG at every stage** of case progress, with statistically significant gains over the strongest baseline.
- The Apache Jira results provide directional evidence that the advantage transfers from synthetic to real case histories.
- Benchmark, implementation, and the Jira evaluation set are all released for reuse.

## Relevance to Our Domain

If you're building support or troubleshooting agents (or any agent that must reason about *progression* through states rather than static facts), RAFT is a working recipe: model history as stateful chains, retrieve at the entry level, and anchor retrieval on matched intermediate states. The released benchmark and Jira evaluation set give you a way to validate your own retrieval layer without standing up a full production agent — a significant practical advantage given how little public multi-stage troubleshooting data exists.

## References
- Paper: https://arxiv.org/abs/2609.20754
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.20754
