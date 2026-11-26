---
title: Can Programs Replace LLM Judges? Executable Program Judges for Scalable and
  Efficient Relevance Labeling
diataxis: How-to Guide
domain: AI-LLM
topic: LLM-Evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.24849
date: 2026-11-19
keywords:
- knowledge-base
- LLM-Evaluation
- AI-LLM
- how-to
---
# Can Programs Replace LLM Judges? Executable Program Judges for Scalable and Efficient Relevance Labeling

## Overview
ExecJudges replaces per-document LLM-judge calls with a **readable program per topic**, written once by a frontier LLM from the assessment guidelines. The generated judges rely only on lexical matching, standard NLP libraries (parsers), and pool statistics — making large-scale relevance labeling fast, inspectable, reproducible, and near-free after a one-time authoring cost.

## Problem Statement
LLM-as-judge is the default for building large-scale relevance judgments in retrieval evaluation, but every judgment costs a frontier-model call, and the judgments are opaque and hard to reproduce. Per-topic trained classifiers are cheaper but need human labels and remain black boxes.

## How-to: build executable program judges
1. **Start from assessment guidelines** for the topic (the TREC-style relevance definition).
2. **Prompt a frontier LLM** to compile those guidelines into an executable program (human-readable **Python**) that may use only: lexical matching, standard NLP libraries (e.g., parsers), and pool statistics — no LLM call at grading time.
3. **(Optional, ExecJudges-L)** Provide a small number of human relevance labels per topic to tune the generated program.
4. **Run the program over the result pool** to produce relevance labels; inspect the source when labels look wrong (fully auditable).
5. **Validate** agreement against trusted judgments (e.g., NIST assessors) and system-ranking correlation (Kendall's tau against official runs).

## Design details (from the paper)
- **Grading function structure**: each program answers the official guideline conditions (on-topic? contains an answer? exact answer? dedicated to the query?); a fixed grading function maps the answers to relevance grades — the scale structure is not left to the LLM.
- **Ensemble averaging**: several programs are generated per topic independently and their grades averaged, which reduces single-program errors and mitigates over-grading.
- **Sandboxed tool policy**: allowed imports are numpy, scipy, rapidfuzz, rank_bm25, scikit-learn, sklearn_crfsuite, dateparser, quantulum3, pint, snowballstemmer, plus a `judgekit` helper (tokenize/stem/BM25/coverage/fuzzy/percentiles/spaCy NER). No neural models other than spaCy `en_core_web_sm`; no LLMs, embeddings, network, file access, subprocesses, or eval/exec. Programs must be deterministic and finish in &lt;60 s for 500 passages.
- **Why it matters vs. LLM judges**: LLM-judge cost grows with pool size *and* per new run; judgment logic is opaque; and judges are vulnerable to adversarial/query terms embedded in assessed documents (prompt-injection-style influence). Executable judges remove all three failure modes.
- **Lineage**: builds on "executable rubrics" work converting natural-language evaluation criteria into explicit programs (Dhole et al., 2026).

## Results (7 TREC collections)
- Agreement with NIST assessors at the level of **Claude Sonnet 5.5 LLM judges** on TREC DL 2019–2021.
- With a few human labels per topic, ExecJudges-L beats per-topic classifiers given the same labels on all seven collections, and matches or exceeds LLM judges (within ~0.05 Krippendorff's alpha).
- Ranks official TREC DL runs with **Kendall's tau 0.87–0.94**.
- One-time authoring cost **$0.17–$0.49 per topic**, then zero marginal cost per document graded.

## Relevance to Our Domain
A practical recipe for cutting LLM-eval budgets in RAG and agent evaluation pipelines: reproducibility (deterministic program), inspectability (readable source), and cost collapse ($ per topic, not per document) address the three chronic complaints about LLM-as-judge — exactly the concerns raised in the KB's contamination and benchmark-gaming notes.

## References
- Paper: https://arxiv.org/abs/2611.24849 (Agichtein, Clarke, Dhole, Stern — Emory/Waterloo/Stanford; submitted 2026-11-18, cs.IR/cs.CL)
- Related: [[explanation-benchmark-contamination-metrics-gaming]]
- Context: "Judging the Judges" LLM relevance-label collection, https://arxiv.org/abs/2502.13908
- Context: Validating LLM-generated relevance labels, https://arxiv.org/abs/2504.12732
