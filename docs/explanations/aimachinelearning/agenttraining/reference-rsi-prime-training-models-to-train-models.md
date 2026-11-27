---
title: 'RSI-Prime: Training Models to Train Models'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.23138
date: '2026-11-19'
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- explanations
---
# RSI-Prime: Training Models to Train Models

## Overview
Zheng, Ye, Zhang, Yu and Wang attack the **RSI-Meta bottleneck**: recursive self-improvement is usually studied on task-facing RSI, while the capability that actually drives it — a model's ability to **train and improve other models** — improves only incidentally through general capability growth. RSI-Prime is, per the authors, **the first dataset explicitly designed to teach models to become better trainers of other models**.

## Dataset Specification
| Property | Value |
|---|---|
| Trajectories | **350 complete experimental trajectories** of research-grade model-training work |
| Coverage | **7 task categories** |
| Annotation | Fine-grained identification of **key experimental decisions** + **per-decision quality labels** |
| Training signal | **Decision-level loss masking** that excludes low-quality behaviors from the SFT loss |
| Base model | GLM-5.3 |

## Training Method
- Post-train the base model on curated trajectories; the novelty is **loss masking at decision granularity**: only high-quality experimental decisions contribute to the objective, suppressing poor training practices captured in the annotations.

## Benchmark Results
- Evaluated on **PostTrainBench** across **six tasks** (AIME 2025, Arena Hard Writing, GPQA Main, GSM8K, HealthBench, HumanEval), training a target model initialized from **Qwen3-4B-Base** under a cumulative **10-hour agent budget** (DSH evaluation harness).
- Overall score: **36.56 (base GLM-5.3) → 45.61 (full-trajectory SFT) → 48.24 (decision-level masked SFT)** = **+31.95% relative** over base.
- **Decision-level masking beats step-level selection** at comparable supervision retention levels.
- Behavioral analysis shows improved decision quality across multiple experimentation stages, not just final scores.

## Pipeline & Data-Construction Details (enriched 2026-11-19)
- Four-stage pipeline: **task collection & validation → trajectory construction & selection → fine-grained trajectory annotation → decision-level masked training**.
- Trajectory reliability mechanisms worth stealing for any agent-trajectory dataset: **pre-execution validation**, **independent experimental supervision**, and **interruption recovery that preserves the original session and cumulative budget**.
- **Human audit of annotations** (400 randomly sampled decision records, two independent reviewers + third adjudicator): acceptance rates 98.75% (decision identification), 99.50% (action classification), 97.50% (quality assessment); Cohen's κ = 0.831 / 0.799 / 0.866. This materially strengthens the earlier caveat about annotation quality — though the audit samples *existing* decisions, so it does **not** estimate recall of omitted decisions.
- Supervision retention is uneven across action categories (evaluation & diagnosis ≈ 88%, runtime support ≈ 85%, "other" ≈ 69% of linked messages retained) — masking keeps proportionally more evaluation behavior than misc behavior.
- Positioning vs. prior work: sits in the "learning from training experience" line alongside **RSI-Dojo** (trajectory collection + fine-tuning for post-training agents); differentiator is fine-grained decision annotation + masking. Baseline failure mode it targets (Lim et al. 2026): agents can repair implementations and re-run training but **rarely revise their initial strategies** in response to feedback.
- Authors: Dewu Zheng & Yanlin Wang (Sun Yat-sen), Yang Ye (Mind Lab), Hongyu Zhang (Chongqing U), Jun Yu (HIT Shenzhen). arXiv v1: 2026-11-17 (cs.AI).

## Reading Notes / Caveats
- "First dataset for model-training capability" is the authors' claim — no systematic prior comparison is summarized in the abstract.
- 350 trajectories is small; per-decision annotation quality is the load-bearing asset (annotations not independently verified in the abstract).
- Gains are on PostTrainBench, a benchmark for **conducting** post-training runs — transfer to arbitrary training regimes is untested per available information.

## Relevance to Our Domain
The missing link for agent-evolution pipelines (see [[explanation-resolution-hypothesis-agent-evolution]]): if selection noise stalls harness evolution, the complementary path is **directly training the meta-capability** — agents that run experiments and improve models. The decision-level loss-masking recipe is a reusable data-curation pattern for any trajectory dataset with noisy action quality. Related: [[explanation-experience-handoff-rl-recursive-self-improvement]].

## References
- Paper: https://arxiv.org/abs/2611.23138
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23138
