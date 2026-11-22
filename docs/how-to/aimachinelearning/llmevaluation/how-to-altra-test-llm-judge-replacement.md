---
title: 'AltRA-Test: An Alternative Annotator Test for LLM Judges Without Shared Annotators'
diataxis: How-to Guide
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.26073
date: '2026-11-22'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- how-to
---
# AltRA-Test: An Alternative Annotator Test for LLM Judges Without Shared Annotators

## Overview
When you want to replace human annotators with an LLM judge, when is that replacement **statistically justified**? The original Alt-Test answered this only for dense designs where every item is labeled by the same annotators. **AltRA-Test** (Alternative Annotator Test with Resampled Annotations) removes that requirement, supporting the realistic large-scale setting where different items are labeled by different subsets of annotators.

## Problem Statement
LLMs are increasingly used as judges/graders in place of humans. Prior statistical replacement tests required a complete annotation matrix (all items × same annotators), which large-scale annotation pipelines (crowdsourcing, partial panels) never satisfy.

## How-To: Test Whether an LLM May Replace Human Annotators
1. **Collect your existing annotations** — items labeled by *different subsets* of human annotators (no complete matrix needed).
2. **Run the resampling bootstrap.** For each bootstrap replicate: resample items, draw **k human annotations per item**, and in the *mixed* panel **substitute one human annotation with the LLM's annotation**. This yields paired all-human vs mixed human-LLM panels.
3. **Compare inter-annotator agreement (IAA).** Compute IAA for both panels. The LLM replacement is supported when the mixed panel's IAA is **statistically non-inferior** to the all-human panel's — i.e. the LLM preserves the signal human annotators share.
4. **Set your level α.** The test is proven consistent with asymptotic level α — interpret non-rejection against your prespecified α rather than as proof of equivalence.
5. **Budget ≈100 items.** Across simulations and real experiments, about 100 items often suffice to reach a decision.

## Validation Evidence
- Tested **18 LLMs × 5 prompting techniques × 20 datasets** spanning text, image, audio, and video.
- In simulations with known ground truth (LLM better vs worse than humans), AltRA-Test makes **more correct replacement decisions than existing baselines**.
- On real data, LLMs **pass in about half the setups**, depending mainly on the task — replacement is *not* automatically justified.

## Practical Guidance
Do not assume a strong judge model transfers across tasks: pass/fail depends primarily on the task, not just the model. Run the test for *your* task and annotation quality before swapping humans out of a labeling pipeline.

## Relevance to Our Domain
Complements our llm-as-judge notes (scoring topology, verifier stability): this supplies the **decision procedure** for judge adoption. Any evaluation harness in our KB that proposes replacing human graders with an LLM judge should cite a non-inferiority test like AltRA-Test rather than raw accuracy agreement.

## Corroboration (verified 2026-11-22 vs primary record)
All load-bearing claims verified verbatim against the arXiv abstract page: submission date (19 Nov 2026, cs.CL + cs.AI), all six authors, the bootstrap design (resample items → draw *k* human annotations per item → substitute one with the LLM annotation → paired all-human vs mixed panels), the IAA non-inferiority criterion, the consistency/asymptotic-level-α guarantee, the evaluation scale (18 LLMs × 5 prompting techniques × 20 datasets across text, image, audio, video), the ≈100-item budget, and the "LLMs pass in about half the setups, depending mainly on the task" real-data finding.
- The predecessor Alt-Test is now concretely identified (was cited generically): Calderon et al., *The Alternative Annotator Test for LLM-as-a-Judge: How to Statistically Justify Replacing Human Annotators with LLMs* — arXiv:2501.10970, published at ACL 2025.

## References
- Paper: https://arxiv.org/abs/2611.26073 (arXiv:2611.26073, submitted 2026-11-19)
- Predecessor: Alternative Annotator Test (Alt-Test) for dense annotation settings — https://arxiv.org/abs/2501.10970 (Calderon et al.; ACL 2025: https://aclanthology.org/2025.acl-long.782/)
