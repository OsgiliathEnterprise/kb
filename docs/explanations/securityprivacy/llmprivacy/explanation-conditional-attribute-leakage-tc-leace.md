---
title: 'Erasing the Wrong Thing: Conditional Attribute Leakage and Concept Erasure
  in Shared Foundation-Model Embeddings'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.25640
date: '2026-11-22'
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# Erasing the Wrong Thing: Conditional Attribute Leakage and Concept Erasure in Shared Foundation-Model Embeddings

## Overview
Sharing **foundation-model embeddings** instead of raw images is increasingly used as a privacy-preserving way to enable downstream tasks (e.g. medical imaging collaborations). This paper proves that standard concept-erasure methods (like LEACE) only guarantee **population-level (marginal) guardedness**: when the task label and the sensitive attribute are associated, erasure leaves detectable leakage *within task strata*. The authors introduce **TC-LEACE**, a closed-form variant that enforces guardedness *per task stratum*.

## Problem Statement
A hospital shares image embeddings; a downstream partner should not infer sensitive attributes (e.g. chest-tube status). Existing erasure methods target whether the attribute is linearly decodable overall. The paper proves an **impossibility**: when binary task and sensitive labels are associated, **global and task-conditional linear guardedness cannot both hold** while preserving a nonzero linear task signal. Global erasure must therefore either destroy task utility or leave task-conditional leakage. They also derive a closed-form prediction of erasure's utility cost from pre-erasure statistics.

## Key Contribution
- Formal separation of **marginal vs task-conditional leakage**, with a proof that global erasure cannot resolve the conflict when labels are associated.
- **TC-LEACE (Task-Conditional LEACE)**: a closed-form LEACE variant enforcing linear guardedness *within each task stratum* of its fitting data — no iterative training, same tractability as LEACE.
- Empirical validation of the theory's predictions: marginal–conditional audit discrepancy grows with association strength; predicted utility costs track observed losses.

## Results
- **85 CelebA attribute pairs × 4 vision foundation models** (broad range of task/sensitive associations): after standard LEACE, conditional leakage persists across all four encoders.
- **Chest radiographs** (3 foundation models incl. 2 biomedical; chest-tube status strongly associated with diagnosis): a marginal attack on LEACE-erased embeddings looks safe (underperforms a diagnosis-only reference), yet **chest-tube status remains detectable within diagnosis strata**. TC-LEACE recovers most of LEACE's linear task-utility loss while keeping task-conditional leakage within a prespecified margin of LEACE's.

## Relevance to Our Domain
A cautionary result for any **embedding-sharing / privacy-preserving ML** workflow in our KB: audits that probe attribute leakage only at the population level systematically under-report risk when sensitive attributes correlate with the task. Security reviews of embedding APIs should require **stratified (conditional) attacks**, and TC-LEACE is the drop-in closed-form mitigation. Directly relevant to LLM/embedding privacy and model-provenance coverage.

## References
- Paper: https://arxiv.org/abs/2611.25640 (arXiv:2611.25640, submitted 2026-11-19; primary cs.CR)
- Related: LEACE (Ravfogel et al.) — closed-form linear concept erasure
