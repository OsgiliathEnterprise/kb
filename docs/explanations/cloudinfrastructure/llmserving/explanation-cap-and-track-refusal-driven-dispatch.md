---
title: 'Cap-and-Track: Optimizing LLM Inference Request Dispatch Across Shifting Capacity'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.24891
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Cap-and-Track: Optimizing LLM Inference Request Dispatch Across Shifting Capacity

## Overview
A fixed dispatch rate for LLM inference goes stale the moment the serving fleet resizes or request mix shifts — and generated output length is unknowable at admission time, while shared provider pools can silently lose capacity. **Cap-and-Track** (Novotny et al., Meta) is the dispatch design behind Meta's production **traffic shaper** for post and live-video understanding: use the backend's own **refusals** as the only signal, and let a probe/back-off tracker follow the admission ceiling with no prediction and no manual retuning.

## Problem Statement
- Fleet capacity shifts (autoscaling, spot backfill, provider pool degradation).
- Output length unknown at admission → true per-request cost is hidden until completion.
- Fixed-rate dispatchers either over-admit (queue blowups, refusals after long waits) or under-admit (wasted GPUs), and need constant retuning.

## How the Design Works
1. **Cap — fail-fast admission check at the saturated resource**: the resource itself refuses work *before* a request enters a long wait. A refusal signals the backend's current admission ceiling.
2. **Durable priority queues outside execution**: excess work (including refused requests) waits in durable queues for retry, not inside the inference engine.
3. **Track — refusal-driven dispatcher**: using *only* refusal signals, Track probes the dispatch rate upward and backs off on refusals — following the real ceiling **without output-length prediction or a fleet-level rate to retune**.
4. **Per-replica Cap**: the shaper runs the ceiling check per replica rather than as a global throttle.

## Results
- **Production A/B (same traffic, concurrent)**: the shaper served a classifier on **43% fewer H100s** than its queued, fixed-rate predecessor — at the cost of lower-priority work waiting longer at backfill peaks.
- **Steady-capacity real-engine replay**: Track ran **within 1% of the goodput** of a fixed rate tuned *above* measured capacity, with **~¼ of that rate's refusal share**.
- **Scale**: >300M online requests and hundreds of TB of media per day; peak 24 h absorbed **1.1B requests** during a backfill event.

## Operational Lessons (the paper's own)
- Keep queues inside inference engines **just long enough to fill batches** — no longer.
- Steer dispatch by **capacity refusals alone**; don't build a rate model.
- Keep dispatch **stateful**.
- Size fleets by **how long low-priority work can wait** — the real budget is latency of backfill, not GPU count.

## Why It Matters
A rare production-systems paper for LLM serving: admission control by backend refusal is provider-agnostic (works across internal GPUs and shared provider pools) and eliminates the retuning treadmill that plagues token-bucket dispatchers.

## Related
- [[reference-retained-context-measurement-charging-long-context]] — provider-side economics this dispatcher navigates
- [[explanation-checkco-checkpoint-coordinated-load-balancing]] — another load-management layer, per-key rather than per-capacity
- [[explanation-tloe-operational-equilibrium-telemetry]] — when such telemetry-driven control loops are predictable at all

## References
- Paper: https://arxiv.org/abs/2611.24891
- Primary class: cs.LG
- Deployment: Meta traffic shaper (post & live-video understanding)
