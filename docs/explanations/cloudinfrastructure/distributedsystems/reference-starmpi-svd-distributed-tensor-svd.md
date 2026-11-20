---
title: 'StarMPI-SVD: Distributed-Memory Parallel Star-M Tensor SVD'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.26451
date: 2026-11-20
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# StarMPI-SVD: Distributed-Memory Parallel Star-M Tensor SVD

## Overview
StarMPI-SVD is the first distributed-memory (MPI-style) implementation of the star-M tensor SVD family — t-SVDM-I and t-SVDM-II — which extend the optimal compression guarantees of matrix SVD to higher-order tensors. Previously these algorithms existed only in shared-memory implementations, capping them at one machine's memory; StarMPI-SVD scales them to thousand-core clusters and hundreds-of-gigabytes datasets.

## Problem Statement
Star-M tensor algebra generalizes matrix SVD's optimal compression to N-way tensors. t-SVDM-I computes a decomposition via invertible transformations plus slice-wise truncated SVDs at a prescribed rank; t-SVDM-II adaptively determines slice-wise ranks to meet a prescribed error tolerance. Existing implementations were shared-memory only, making them unusable for modern large-scale tensor datasets.

## Implementation Specification
- **Coverage**: first distributed-memory versions of both t-SVDM-I (fixed rank) and t-SVDM-II (adaptive multirank), generalized from the star-M setting to N-way tensors.
- **Core engineering**: asynchronous, non-blocking communication strategies for data redistribution, designed to remove the computational and communication bottlenecks of the key kernels.
- **Parallel paradigm**: slice-wise SVDs map naturally onto distributed cores once redistribution of tensor fibers/slices is made efficient — the paper's contribution is making that redistribution overlap with computation rather than block on it.

## Scalability & Application Data
- Strong-scaling: at least 70% parallel efficiency up to 128 nodes / 6,144 cores.
- Applied star-M compression to application datasets up to 768 GB.

## Relevance to Our Domain
A concrete data point for large-scale distributed numerical workloads: which kernels parallelize well (slice-wise truncated SVD), which need async redistribution to stay efficient, and what parallel efficiency is realistic at ~6k cores. Useful when sizing HPC-style tensor compression jobs on cluster or cloud batch infrastructure, and as a reference implementation pattern for hiding MPI communication behind computation in redistribution-heavy kernels.

## References
- Paper: https://arxiv.org/abs/2611.26451
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26451
