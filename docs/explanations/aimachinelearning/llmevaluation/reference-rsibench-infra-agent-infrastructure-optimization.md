---
title: 'RSIBench-Infra: Can Agents Optimize Their Own Training and Inference Infrastructure
  at Production Scale?'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.24395
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# RSIBench-Infra: Can Agents Optimize Their Own Training and Inference Infrastructure at Production Scale?

## Overview
RSIBench-Infra is a benchmark that tests whether AI agents can optimize *their own* training and inference infrastructure end-to-end — not just isolated kernels — under realistic production workloads. It targets a practical component of recursive self-improvement: agents making the ML stack faster and cheaper.

## Problem Statement
Existing agent-driven optimization benchmarks focus on single software layers (typically kernels), so it was unknown whether agents can deliver validated, end-to-end performance gains on production-scale training and inference deployments.

## Key Contribution
- A benchmark of **20 training and inference tasks** spanning diverse model families and modalities.
- Deployments scale up to **32 accelerators**, covering both **NVIDIA GPUs and Ascend NPUs**.
- Agents begin from runnable baselines built from official recipes and may modify the stack at **engine, kernel, and instruction levels**.
- An **OCI image-layer submission protocol** captures agent changes for reproducible deployment; evaluation is independent and measures end-to-end performance under task-specific quality constraints.
- Headline result: across all tasks, **66.2% of results exceed a 1.10× validated speedup**.

## Technical Approach
The benchmark fixes runnable, recipe-derived baselines, then lets agents edit the software stack freely. Submissions are packaged as OCI image layers so any change set can be redeployed and measured identically. Independent evaluators enforce quality gates (so speedups cannot be bought with degraded model quality) and measure validated end-to-end speedup rather than micro-benchmarks.

## Results
- 66.2% of task results exceed 1.10× validated speedup — current agents *can* improve production-scale training/inference.
- Remaining gaps: discovering effective optimization strategies, and translating *local* improvements into *end-to-end* gains, remain hard.

## Relevance to Our Domain
This is the reference point for "can coding/ML agents optimize serving and training stacks?" — directly relevant to LLM serving operations, GPU fleet engineering, and agent-infrastructure roadmaps. The OCI-layer submission protocol is also a reusable pattern for reproducible agent-submitted infrastructure changes.

## References
- Paper: https://arxiv.org/abs/2611.24395
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24395
