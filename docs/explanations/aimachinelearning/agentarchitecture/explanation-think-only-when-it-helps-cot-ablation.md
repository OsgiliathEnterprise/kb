---
title: Agents, Think Only When it Helps
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.05709
date: '2026-11-18'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Agents, Think Only When it Helps

**Authors**: Min-Seon Kim, Seungdong Yoa, Sanghyu Yoon, Ye Seul Sim, Suhee Yoon, Dongmin Kim, Jung-Eun Kim (arXiv:2611.05709, submitted 3 Nov 2026, cs.AI/cs.LG). Verified against the arXiv abstract page on 2026-11-18.

## Overview
Should distilled agent students always emit chain-of-thought before acting? This paper runs a **controlled causal ablation of thought supervision vs action supervision** in agentic CoT distillation. Headline: **thought supervision is often not critical** — what matters is the action supervision — and on some tasks the student trained on **actions only** matches or beats the student trained with thoughts (paper's Figure 1: the with-thought student answers wrong, the actions-only student answers correctly).

## Method (the ablation design)
- Teachers generate agentic trajectories; **default teacher Qwen2.5-32B-Instruct**, students **initialized from Qwen2.5-3B-Instruct** and trained with an SFT objective; robustness studied across **student scales/families and across teacher models**.
- **Corruption operators** intervene separately on the thought channel and the action channel: thoughts (or whole segments) can be deleted or corrupted; paraphrasing is defined **for thoughts only** (π_paraphrase instantiated with the teacher model). This isolates *what thoughts contribute* from *what the teacher's action policy contributes*.
- Evaluated on multi-hop QA benchmarks — HotpotQA, 2WikiMultiHopQA, Bamboogle, MuSiQue — with **GPT-4o-mini as LLM judge**.

## Results
- **Thought supervision is frequently non-critical**: ablating/corrupting thoughts often leaves final accuracy intact, while action supervision is load-bearing.
- **The precise condition (from the abstract, verified 2026-11-18)**: thought supervision *becomes important when information in the thought is not disclosed in the corresponding action* during training. Identifying these "discrepant" cases is the paper's operative test — think only when the action doesn't already carry the thought's information.
- **Action-only distillation** is proposed as an alternative supervision recipe: it **gains efficiency in both training and inference** (shorter sequences, no reasoning tokens at serve time) in the evaluated regimes.
- The finding challenges the common practice of distilling **entire** teacher trajectories for LLM agents; thought supervision is a *discernible efficiency choice*, not a default.

## Relevance
For agent platform teams: do not bake "always emit CoT" into distilled agent students by default. Run the paper's ablation pattern on *your* task mix — corrupt the thought channel in your eval set; if accuracy is unmoved, drop reasoning tokens and cut serving latency/cost.

## References
- Paper: https://arxiv.org/abs/2611.05709
- Related: [[Route to Remember: Adaptive Memory Selection for LLM Agents]], [[Dependable Long-Horizon LLM Agents: A Trajectory-Centered Empirical Study of Where Errors Enter and Which Controls Reach Them]]
