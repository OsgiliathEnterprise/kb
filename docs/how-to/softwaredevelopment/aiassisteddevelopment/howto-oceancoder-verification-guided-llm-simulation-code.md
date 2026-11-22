---
title: 'OceanCoder: A Verification-Guided Large Language Model for Automated Simulation
  Modelling in Ocean Engineering'
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.26333
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# OceanCoder: A Verification-Guided Large Language Model for Automated Simulation Modelling in Ocean Engineering

## Overview
Liu, Li, Guo, Chen and Liu (CAS/Nanjing Inst. of Geo&Limnology + Nanjing Univ., Nov 2026) tackle a hard domain-transfer problem: getting LLMs to write **finite-volume simulation code (OpenFOAM solvers)**, where general-purpose models fail due to scarce training data. Their recipe — a verification-guided training pipeline plus a physics-aware RL reward — is a reusable blueprint for any niche scientific-code domain. Code, dataset and model are open-sourced (github.com/ocean-hpc/OceanCoder).

## How-to: Train a verification-guided LLM for a data-scarre scientific code domain
Use this procedure when you need an LLM that generates executable domain code (CFD solvers, simulation kernels, custom C++ libraries) and public training data is almost nonexistent.

### Steps
1. **Build a verifiable corpus from real code.** Extract code–text pairs directly from the target framework's source (OceanCoder uses 323 OpenFOAM C++ files), so every training example is grounded in executable, real-world implementations.
2. **Synthesize instruction data.** Use an LLM to generate problem–solution pairs from the corpus, deliberately increasing task diversity and difficulty coverage beyond what the raw code provides.
3. **Apply a three-layer verification pipeline** to every candidate example — syntactic parsing, then execution, then quantitative output checks. Only examples surviving all layers enter the training set; this eliminates hallucinated or non-executable code.
4. **Curate against memorization.** Filter near-duplicates against test benchmarks (OceanCoder checks 1,856 test items) so reported gains reflect generalisation, not retrieval of benchmark solutions.
5. **Supervised fine-tune a base model** on the verified corpus (OceanCoder fine-tunes Qwen3-Coder-30B-A3B-Instruct).
6. **Add a domain-aware RL phase (GRPO).** Design rewards that encode the *domain* correctness, not just compilation: OceanCoder's reward evaluates discretization-scheme correctness of generated finite-volume PDE solvers — i.e. does the numerics match the physics.
7. **Benchmark on cross-lingual and domain tasks** — they validate on CrossCodeEval, MBPP and HumanEval alongside OpenFOAM-specific tests.

## Results
**OceanCoder-30B-A3B** (30B total / 3B active parameters) beats substantially larger general-purpose models: +28.62 points average on OpenFOAM code generation, +41.09 points on solver generation, while preserving strong general-coding performance.

## Why It Works
Verification-gated data curation removes the failure mode that kills domain fine-tuning — teaching the model hallucinated APIs. The physics-aware GRPO reward then optimises for the property that actually matters in scientific code (correct discretization), which generic code-quality rewards ignore.

## Relevance to Our Domain
A concrete, reproducible method for building specialist coding agents — directly extends our AI-assisted-dev coverage beyond general coding into HPC/scientific software. The verification-first data pipeline is transferable to any enterprise code base needing a private coding model.

## References
- Paper: https://arxiv.org/abs/2611.26333
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26333?fields=citationCount,year (rate-limited at check time; 2026)
- Code/data/model: https://github.com/ocean-hpc/OceanCoder

## Related
- [[howto-coding-agents-real-world-software-engineering]] — agents writing real code
- [[howto-verifiable-debate-multi-agent-code-generation]] — verification as the reliability anchor
