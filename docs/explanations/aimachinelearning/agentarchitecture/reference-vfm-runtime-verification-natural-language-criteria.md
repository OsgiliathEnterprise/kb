---
title: Runtime Verification of Multiple Natural Language Criteria for Agent Governance
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.23074
date: 2026-11-18
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Runtime Verification of Multiple Natural Language Criteria for Agent Governance

## Overview
AI agents are governed by **hundreds of natural-language criteria**, yet existing verifiers cannot efficiently evaluate an agent's output against a large set of such criteria and report **which are satisfied, violated, or inapplicable** (arXiv:2611.23074; Pitis, Alamdari, Tang, Klassen, McIlraith). The paper introduces the **VFM (Verification Foundation Model)**: a **tree-attention verifier** that encodes the shared context and target text once and scores N criteria **in parallel**, returning independent per-criterion ternary verdicts.

## Technical Specification
| Property | Value |
|----------|-------|
| Architecture | Tree-attention verifier: shared (context, target) encoding, N criteria scored in parallel |
| Output | Independent **per-criterion ternary verdicts** (satisfied / violated / inapplicable) |
| Pretraining corpus | **CriteriaBank** — 394K (context, target, criterion, verdict) tuples spanning **over 321K distinct criterion strings** |
| Governance benchmark | Fine-tuned **VFM-4B outperforms GPT-5.4** on a synthetic governance benchmark |
| Failure detection | On **DynaBench** (multi-criterion), outperforms **DynaGuard-4B** on trace-level failure detection |
| Localization | Per-criterion verdicts **localize the violated rule**, enabling focused escalation to a larger chain-of-thought judge |
| Transfer | CriteriaBank pretraining improves cross-domain transfer, especially in the **low-data regime**; matches a strong direct-finetuning control at full data |
| Runtime budget | On a **single H100**: **1,000 criteria vs. a 4K-token context in &lt; 2 s**, at **&lt; 11 GB VRAM** — suitable for runtime verification |

## Key Concepts
- **Multi-criterion verification as a first-class task**: governance is not one yes/no check but a large criteria set requiring per-rule verdicts — temporal-logic compilation and single-judge prompting both scale badly here.
- **Tree attention for shared context**: the expensive part (encoding the agent trace and target text) is computed once and shared across all criteria — this is what makes 1,000 criteria affordable.
- **Escalation routing**: verdicts localize which rule fired, so an expensive CoT judge is invoked only on the specific violated criterion rather than re-judging everything.
- **CriteriaBank as the transfer substrate**: exposure to 321K+ distinct criterion strings is what gives cross-domain and low-data generalization.

## Relevance to Our Domain
Our agent gateways enforce policy sets far larger than one prompt-check; VFM-style parallel tree-attention verification makes per-tool-call, hundreds-of-criteria gating affordable on a single GPU, with per-rule verdicts that double as audit records and escalation triggers. The tri-state (incl. *inapplicable*) output avoids false violations from irrelevant rules — a chronic problem with naive LLM-as-judge gating.

## References
- Paper: https://arxiv.org/abs/2611.23074
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23074?fields=citationCount,year
