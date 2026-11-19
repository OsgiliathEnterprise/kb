---
title: 'MoE-Context: Show the Model Only What It Needs'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.24379
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# MoE-Context: Show the Model Only What It Needs

## Overview
MoE-Context applies a mixture-of-experts-style routing idea to agent context: rather than re-reading the entire history every step (as agents normally do), the context is split into blocks, and a fast yes/no gate decides which blocks the current step actually needs. Unneeded blocks collapse to one-line notes but are never deleted — mirroring how people keep what the moment needs and hold the rest as a rough recollection.

## Problem Statement
Agents pay the inference cost of their full history at every step, and attention over irrelevant history can hurt accuracy. Existing compaction methods resolve this by rewriting or discarding old content, losing reversibility.

## Key Contribution
- **Block-level context routing:** a quick pre-step decision selects needed blocks; the remainder stay as one-line notes, restorable later, with nothing deleted.
- **Single-model, single-cache implementation:** one model both decides and answers, over a single KV cache where hidden blocks are **masked rather than removed**.
- **Empirical honesty about the weak link:** the model's own block selection is the bottleneck. On a laptop running Qwen3-1.7B with a synthetic lookup task, showing only the needed block raises accuracy from 93/120 to 119/120, and masking provably hides as well as deletion. A supervised linear probe written into spare output rows lifts the model's own selection accuracy from 80/120 to 110/120 — yet simple keyword search still selects perfectly on that task, and the probe fails to transfer to a second task.
- **Two cheap usage patterns enabled by block switching:** undoing a failed attempt, and running subagents without allocating a new context.

## Technical Approach
Context blocks are gated in/out per step via a binary decision pass. Hidden blocks remain resident in the KV cache but are attention-masked, so restoration is cheap and lossless — the "notes" are pointers into retained state, not summaries.

## Results
Selective showing: 93→119 of 120 on synthetic lookup (Qwen3-1.7B). Model self-selection: 80→110/120 with a linear probe, but non-transferable; keyword baseline perfect on the task. Reported openly as negative/mixed evidence on learned gating.

## Relevance to Our Domain
A pragmatic counterpoint to summarization-based context compaction: masking-with-restoration preserves reversibility at small model scale, and the paper's candid failure analysis (learned gating doesn't generalize; heuristics win) is useful calibration for anyone building agent memory systems on-device or with small models. Pairs with our Semantic Context Handoff note (evidence re-entry) as a sibling context-management mechanism.

## References
- Paper: https://arxiv.org/abs/2611.24379
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.24379
