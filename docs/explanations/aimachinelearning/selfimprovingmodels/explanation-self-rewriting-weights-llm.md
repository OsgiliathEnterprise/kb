---
title: 'Language Models Can Rewrite Their Own Weights: Gradient-Free Self-Modification
  with Forward Passes Only'
diataxis: Explanation
domain: ai-machine-learning
topic: self-improving-models
source: HackerNews
source_url: https://arxiv.org/abs/2611.21885
date: 2026-11-20
keywords:
- knowledge-base
- self-improving-models
- ai-machine-learning
- explanations
---
# Language Models Can Rewrite Their Own Weights (arXiv 2611.21885)

A preprint (Jiajun Fan, Neil He, Changyi Yang, Andy Mao, Xi Zhu, Chaoran Cheng, Kaiqu Liang, Shuaike Shen, Zetian Li, Ruihan Guo, Ge Liu — 11 authors; v1 2026-11-16, v2 2026-11-18) demonstrates **models directly editing their own weight files** — no human-written optimizer, no backprop: a 27B open-weight model improves itself and repairs damage to itself using only forward passes. The authors coin the term **self-rewriting**: "the model is its own optimizer."

![The self-rewriting loop](explanation-self-rewriting-weights-llm.svg)

## The setup

The model is given **its own weights as input, its own computation graph as a program it can manipulate, and a toolkit for editing weight files**. It then: (1) runs on graded tasks, (2) uses its reasoning to diagnose failures, (3) modifies its own weight files **using itself as the optimizer**. Critically, every session it must *submit* an edited copy — submissions are accepted only if the edits work on **practice problems**, so each session inherits only self-authored changes that demonstrably helped.

## Results

- **+6.6 points over its unmodified base on 490 unseen problems** — accuracy rises monotonically across **eight consecutive sessions** (abstract, v2); the model "tests its edits on practice problems and submits only what works, each edit improving on the last." Run chart: 57.2% base, +0.5/+4.0/+6.6 at accepted sessions; sessions 3–7 were withdrawn submissions (model unchanged).
- **Self-repair**: when its own weight copy is damaged — the copy "solves almost nothing" — it restores **over 80% of original accuracy** on unseen **image tasks**, with no retraining and without ever reading the pre-damage weights to copy from.
- **Scale-dependent**: the behaviour **emerges with scale** — within one model family, "the smaller models make no edit or break themselves, and only the largest improves and repairs itself."

## Positioning against test-time scaling and training (authors' own framing, v2)

The authors draw a sharp three-way contrast: **unlike test-time scaling**, self-rewriting "writes its gain into the weights, at no cost per answer"; **unlike training**, it runs only forward passes, as serving does. Their thesis line: *"The wall between training and inference is a limit of our tools, not a property of intelligence."* They frame self-rewriting as "a necessary step toward recursive self-improvement" — a model that, like a human, does not separate training from inference could keep upgrading itself for life, with no larger model, harness, prompt engineering, or pre-/post-training. Note the lineage: in earlier work, a **frontier model edited a much smaller one**; here the 27B open model edits **itself**.

## Why it matters (authors' framing)

Prior "self-improvement" meant a model changing **external artifacts** — prompts, tools, training code, harnesses, or the data another model trains on. This closes a different loop: the model improving **the very system it is**, by direct weight modification, through experience, without gradient descent or human-designed optimizers. If recursive gains hold, capability growth stops being bottlenecked by human-designed training pipelines — a new axis of scaling and a new class of safety questions (who audits a model's self-edits? can gains be reversed?).

## Independent context (from search, same day)

Coverage (MarkTechPost, 2026-11-19) notes the gains are **task-specific, not general**: no transfer to untouched categories, and the self-repair is recovery of a broken copy, not superintelligence. Treat headline claims accordingly — and note this is a **preprint**, not peer-reviewed.

**Related line of work — "Weight-Space Programming" (MIT CSAIL, Takehi, Teoh, Zhang & Khattab, published 2026-11-02):** frontier LLMs can *natively read and write* neural-network weights like code. From raw weights alone, GPT-6 Astra can infer what a network was trained to do and write small game-playing networks from scratch that beat PPO-trained baselines; asked to improve Qwen3.5-0.8B at math without gradients, it identified a reasoning-loop defect flagged in Qwen's own model card and fixed it by **natively editing 0.016% of the weights**, raising MATH-500 from 7.9% → 48.1% and tripling IFEval. Key difference from the self-rewriting paper: there a *frontier* model edits a *smaller* model; here the model edits **itself**, closing the loop on the same capability.

## Open questions worth tracking

- Do session-over-session gains compound indefinitely or plateau? (Only one reported run shown.)
- What stops a model from "improving" toward reward hacking, given practice-set gating is the only acceptance filter?
- Auditing: the edits are *files* — diffable and testable, which is at least tractable compared to opaque fine-tunes.

## References

- [Language Models Can Rewrite Their Own Weights (arXiv 2611.21885, v2 2026-11-18)](https://arxiv.org/abs/2611.21885)
- [MarkTechPost coverage](https://www.marktechpost.com/2026-11-19/language-models-can-rewrite-their-own-weights-self-improving-models-with-forward-passes-only/)
- [Sparks of Weight-Space Programming: LLMs can natively read & write neural network weights (MIT CSAIL, 2026-11-02)](https://rikiyat.github.io/blog/weight-space-programming/)
- Related in KB: Agent-driven model optimization, When agents train agents
