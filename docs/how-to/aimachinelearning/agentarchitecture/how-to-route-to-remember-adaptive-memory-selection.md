---
title: 'Route to Remember: Adaptive Memory Selection for LLM Agents'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.05636
date: '2026-11-17'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Route to Remember: Adaptive Memory Selection for LLM Agents

## Overview
How to give an LLM agent durable memory by **distilling retrieved memories into the model's weights via On-Policy Self-Distillation (OPSD)** instead of always retrieving them as text at prompt time. The paper frames agent memory as a choice between **text memory** (retrieval into context) and **weight memory** (knowledge consolidated into parameters), and routes between the two per fact.

## Procedure (the Route-to-Remember recipe)
1. **Prepare memory pairs for each memory point**, generating three kinds of training pair:
   - **Paraphrases** — the same fact asked many ways, so the student generalizes across phrasings instead of memorizing one surface form;
   - **Counterfactuals** — the fact stated wrongly, to train discrimination;
   - (plus direct recall pairs), with the loss masked to the answer.
2. **On-Policy Self-Distillation (OPSD)**: the student is the **context-free** model; the teacher is the **same model given the retrieved memory** (self-distillation). Student samples on-policy; teacher supervision transfers the memory-conditioned behavior into weights.
3. **Verify-then-regenerate as the router**: route a fact between text memory and weight memory by first verifying whether the context-free student already reproduces it; regenerate/keep-in-text-memory what it cannot — routing is a verification loop, not a learned classifier.
4. Guard against catastrophic forgetting of base ability during consolidation (training-objective ablations provided in appendix).

## Results
- **OPSD reaches 59.9% overall QA accuracy vs 36.9% for ordinary SFT on identical data** — and SFT lands *below every text-memory baseline*, so the on-policy self-distillation objective, not the data, is what converts memory into weights.
- The accuracy advantage **holds across model scale** — the effect is **not specific to Qwen3.5-9B** (appendix model-scale sweep; also a LoRA-rank sweep).
- On the **HaluMem** benchmark family: representation choice dominates memory age on HaluMem-Medium; volatile facts remain the hard axis (RouterMem-Mini analysis) — distill stable facts, keep volatile ones in text memory.

## Gotchas
- OPSD is not SFT: same data through plain SFT is *worse than not distilling at all* (below every text baseline). The on-policy sampling and teacher-with-memory setup are essential.
- Weak categories can partly measure the rubric itself — audit which categories your gain actually comes from.

## References
- Paper: https://arxiv.org/abs/2611.05636
- Related: [[Agents, Think Only When it Helps]], memory-selection literature in this topic
