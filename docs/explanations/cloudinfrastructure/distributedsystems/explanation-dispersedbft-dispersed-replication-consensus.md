---
title: 'DispersedBFT: Bottleneck-Free Primary-Backup Consensus using Dispersed Replication'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.24833
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

## Results
- **3.4M transactions/sec with 43 replicas.**
- Up to **6.2× faster than PBFT** and **2.6× faster than HotStuff**.

## Relevance to Our Domain
For teams operating permissioned ledgers or replicated state machines where a coordinator saturates, this shows dispersal-coded replication is a viable path to scaling BFT throughput, and gives a concrete CPU-vs-bandwidth design dial (MAC/Merkle vs. signatures). Connects to our consensus notes (Stephen sequencer verification) and resilient data-management coverage.

## References
- Paper: https://arxiv.org/abs/2611.24833
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24833
