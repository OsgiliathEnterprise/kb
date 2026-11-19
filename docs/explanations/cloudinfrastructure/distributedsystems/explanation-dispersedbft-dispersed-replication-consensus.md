---
title: 'DispersedBFT: Bottleneck-Free Primary-Backup Consensus using Dispersed Replication'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.24833
date: 2026-11-19
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# DispersedBFT: Bottleneck-Free Primary-Backup Consensus using Dispersed Replication

## Overview
DispersedBFT is a PBFT-style Byzantine-fault-tolerant consensus protocol that removes the primary's bottleneck by using *dispersed replication*: information dispersal codes spread the job of replicating client requests from the single primary across the backup replicas.

## Problem Statement
Resilient data management systems built on blockchains typically use primary-backup designs with PBFT-class consensus. The primary alone coordinates replication and execution of requests, so it caps throughput for the whole system no matter how many replicas exist.

## Key Contribution
- Redistributes request replication from the primary to the backups using **information dispersal**, eliminating the primary as the single coordination and bandwidth chokepoint while preserving the PBFT-like primary-backup structure.
- Offers protocol variants optimized along different cost axes: **low CPU cost** versions using Message Authentication Codes + Merkle proofs, and **low communication cost** versions using digital signatures.
- Practical performance analysis against state-of-the-art BFT protocols.

## Technical Approach
Client request data is split into fragments via information dispersal; each replica handles a fragment's dissemination rather than the primary broadcasting everything. Authentication strategy (MACs + Merkle proofs vs. signatures) is chosen depending on whether CPU or network bandwidth is the binding constraint.

Concretely, in the normal case the primary breaks a large request τ into n−1 small slices using an information dispersal algorithm and sends each slice to a distinct backup; non-faulty backups then *forward* their slice to all other backups. This reduces the primary's proposal cost from O(n·‖τ‖) in PBFT to O((n−1)/(n−f−1)·‖τ‖) = O(‖τ‖) per replica, while Prepare/Commit-style messages stay small. The protocol keeps PBFT's primary-backup normal-case structure, remains a **drop-in replacement for PBFT**, and preserves the ability to implement high-performance multi-threaded execution.

## Positioning vs. Prior Work
Prior fixes to the primary bottleneck each carry a practical cost that DispersedBFT avoids:
- **Concurrent consensus** (RCC, Mir-BFT): runs many PBFT instances in parallel, adding significant normal-case complexity.
- **Out-of-consensus replication** (Tusk): moves request replication to a mempool protocol, complicating client interaction.
- **Dispersal-based protocols** (Segmenta, Kudzu, DispersedLedger): use information dispersal but add consensus latency or prevent efficient multi-threaded implementations.

## Results
- **3.4M transactions/sec with 43 replicas.**
- Up to **6.2× faster than PBFT** and **2.6× faster than HotStuff**.

## Relevance to Our Domain
For teams operating permissioned ledgers or replicated state machines where a coordinator saturates, this shows dispersal-coded replication is a viable path to scaling BFT throughput, and gives a concrete CPU-vs-bandwidth design dial (MAC/Merkle vs. signatures). Connects to our consensus notes (Stephen sequencer verification) and resilient data-management coverage.

## References
- Paper: https://arxiv.org/abs/2611.24833 (Kansal, Sana, Hellings — McMaster University, Nov 2026)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24833
- Related dispersal-based consensus: DispersedLedger (NSDI'22), Kudzu, Segmenta
