---
title: 'Weave: Routing-Adaptive Runtime Warp Scheduling for MoE Megakernels'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: arXiv
source_url: https://arxiv.org/abs/2611.27765
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# Weave: Routing-Adaptive Runtime Warp Scheduling for MoE Megakernels

## Overview
Under expert parallelism (EP), each MoE layer is typically fused into one persistent megakernel — but the split between communication and computation inside that kernel has, until now, been decided statically. Because routing is token-dependent, every GPU's actual communication and computation volume varies from step to step. Weave makes that split *adaptive at warp granularity at runtime*, matching each GPU's instantaneous load instead of stranding warps on the wrong side of a compile-time partition.

## Problem Statement
Prior megakernel systems either fix the comm/compute resource division at compile time (MegaMoE) or adapt only at coarse SM granularity (mKernel), dedicating entire SMs to communication and idling their Tensor Cores. Even within an SM, static warp schedules cannot track routing-dependent load: warps sit idle waiting for inputs or finish their assigned role with nothing to do.

## Key Contribution
- **Spatial schedule**: allocates communication vs computation resources at *both* SM and warp granularity, so each GPU's partition tracks its routed load.
- **Temporal schedule**: warp roles switch as a layer progresses — all warps are enlisted at layer start and end, and idle communication warps selectively take over output scatter.
- **Fused cost model**: jointly selects both schedules per GPU at kernel launch, using runtime routing statistics.
- Measured gains: under EP8 vs DeepGEMM-MegaMoE, **1.30× geomean (up to 1.97×) MoE-layer speedup on SM103** and 1.24× geomean (up to 1.72×) on SM90; under EP16 on CDNA3, **1.44× geomean (up to 2.87×)** over the fastest official RCCL+AITER baseline (1.67× over vLLM).

## Technical Approach
The core idea is to treat the megakernel's internal work partition as a scheduling problem solved per launch rather than per compile. Runtime routing statistics feed a fused cost model that decides, per GPU, both the spatial warp-to-role assignment and the temporal role-switching plan, exploiting the observation that communication and computation demand curves within a layer are misaligned — early and late phases need everyone, mid-layer phases can lend warps across roles.

## Results
Consistent wins across all evaluated platforms (NVIDIA SM90/SM103 and AMD CDNA3), with the largest single-case speedup of 2.87× on CDNA3 under EP16.

## Relevance to Our Domain
MoE serving is a core KB theme (EchoMoE, MoE-CORE, XM-Sparse, broadcast-weights). Weave adds the *intra-kernel* dimension: once you've chosen EP and megakernels, warp-level adaptivity is where the remaining 30–90% lives. Useful mental model for anyone tuning EP deployments on heterogeneous fleets.

## References
- Paper: https://arxiv.org/abs/2611.27765
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27765
- Related KB notes: `cloud-infrastructure/llm-serving/explanation-echomoe-activation-compression-expert-parallelism.md`, `cloud-infrastructure/gpu-compute/explanation-gpcplace-crossbar-port-contention.md`
