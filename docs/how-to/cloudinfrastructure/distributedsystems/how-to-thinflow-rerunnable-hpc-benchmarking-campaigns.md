---
title: 'Thinflow: Organizing HPC Benchmarking Campaigns as Rerunnable Directory Trees'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.26526
date: 2026-11-20
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- how-to
---
# Thinflow: Organizing HPC Benchmarking Campaigns as Rerunnable Directory Trees

## Overview
Thinflow is a small Bash engine that turns an HPC benchmarking campaign — building code variants, sweeping core/node counts, measuring repeatedly — into a *rerunnable directory tree* of tasks and runs. The goal is reproducibility: moving a campaign to another supercomputer or rerunning it months later should not require reverse-engineering what actually ran. The case study ran one campaign with **identical task files on three Slurm partitions across two supercomputers** (up to 16 nodes).

## When to Use
You maintain performance studies with multiple code variants and sweep parameters, and you keep hitting: ad-hoc job-script rewrites per machine, reconstructed "what ran where" after the fact, and artifacts that cannot be rerun by reviewers.

## Procedure
1. **Create a campaign directory** and place the Thinflow engine inside it. Because the engine ships *with* the campaign, nothing needs to be installed on target machines and the completed directory can serve directly as a paper artifact.
2. **Define each task as a directory** containing a short shell script next to the benchmark code. Keep task files portable — the case study used 37 task files totaling just 217 non-comment lines.
3. **Declare task dependencies.** Thinflow derives the execution order from them and writes a plain-text manifest, so the run order is auditable rather than implicit.
4. **Write one profile per supercomputer.** A profile encapsulates the machine-specific bits (workload-manager submission, e.g. Slurm, and command-line parameters). Portability comes from keeping *all* machine-specific content in profiles — in the case study, profiles and CLI parameters were the only things that differed across partitions.
5. **Launch each sweep with a single command**, which builds the code, runs the benchmarks, and plots the results.
6. **Keep the provenance records.** Every run writes a record of its environment, hardware, and parameters — the answer to "what exactly ran" without reconstruction.
7. **Rerun anywhere**: copy the campaign tree to a new machine, adjust/add a profile, rerun. The 455-run strong-scaling study (matrix multiplication in C/OpenMP, C/MPI, Julia/MPI) needed no task-file changes across two supercomputers.

## Key Results
- One campaign, identical task files, three Slurm partitions, two supercomputers, up to 16 nodes, 455 benchmark runs.
- Authors' conclusion: such campaigns need **little structure beyond plain shell files** — no heavyweight workflow framework required.

## Relevance to Our Domain
A pragmatic anti-pattern counterweight to heavyweight workflow engines for our benchmarking and reproducible-research notes: plain directories + dependency manifests + per-cluster profiles + per-run provenance cover most HPC campaign needs. Directly reusable for our own GPU/cluster benchmark harnesses and for artifact evaluation of performance papers. Complements the OpenFOAM/SWIFT-NEP reproducibility notes in ml-reproducibility.

## References
- Paper: https://arxiv.org/abs/2611.26526
- Related: [[explanation-openfoam-ai-reproducibility]], [[explanation-swift-nep-ai4science-workflow-platform]]
