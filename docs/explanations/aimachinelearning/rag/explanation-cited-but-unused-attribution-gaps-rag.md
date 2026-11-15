---
title: 'Cited but Unused: Parametric Provenance in Retrieval-Augmented Generation'
diataxis: Explanation
domain: ai-machine-learning
topic: rag
source: arXiv
source_url: https://arxiv.org/abs/2611.17161
date: 2026-11-15
keywords:
- knowledge-base
- rag
- ai-machine-learning
- explanations
---
# Cited but Unused: Parametric Provenance in Retrieval-Augmented Generation

## Overview

This paper exposes a quiet failure of RAG citations: a model will cite a retrieved passage for a claim it actually produced from its own parametric memory. The citations "look right" — the passage really does contain a matching statement — so standard citation verification passes, yet the source did not cause the claim. The authors measure this **parametric provenance** problem with counterfactual value substitution and find that a non-trivial, size-dependent share of citable claims comes from memory rather than the retrieved context.

## Problem Statement

RAG systems attach citations to attribute claims to sources, and teams use citation faithfulness checks to certify grounding. But faithfulness checks only ask "does the cited passage support the claim?" — never "did the passage *produce* the claim?" A model that already knows the answer will select a passage agreeing with its output, making over-citation undetectable by natural-language-inference (NLI) verification. The gap: no standard metric distinguishes retrieval-sourced from memory-sourced claims.

## Key Contribution

- A **counterfactual value substitution** protocol: replace a fact in the retrieved passages with a false variant, re-query the model, and observe whether the claim changes — unchanged claims indicate the answer came from parametric memory.
- Quantification across five sizes of one model family plus a comparator family: **1.2%–15.7% of citable claims derive from parametric memory**, rising with model size within a family; at the most conservative substitution distance the rates measured are 4.6% and 8.5%.
- The demonstration that **NLI-based citation verification — the industry standard — performs at chance** for detecting this, even when restricted to the cited passage.
- A structural explanation: a model answering from memory *chooses* a citation that agrees with its output, so agreement-based checks are blind by construction.
- A comparison of ten attribution methods on identical claims: the strongest signal is the contrast between the model's output distribution **with vs. without context** — but acting on that detector does not yet improve provenance honesty, because it measures what the model *knew*, not what it *used*.

## Technical Approach

For each citable claim, the harness mutates the underlying fact in the retrieved passages (swapping in false variants at controlled semantic distances) and re-asks the question. If the model repeats the original claim despite the corrupted evidence, the claim is attributed to parametric memory. The authors sweep model families and sizes, compare against NLI verifiers and ten attribution methods, and evaluate whether a provenance detector can be turned into a corrective intervention. The final honest conclusion: separating "knew" from "used" remains an open problem.

## Results

- Parametric-memory-sourced citable claims: 1.2%–15.7% across model sizes; 4.6% and 8.5% at conservative substitution distance; monotone increase with scale within a family.
- NLI verification indistinguishable from chance across all tested models.
- Context-present vs context-absent distribution contrast is the best provenance separator; as a mitigation it is not yet accurate enough to act on.

## Relevance to Our Domain

Our KB is consumed through retrieval — agents and assistants that answer from the vault may confidently cite a KB page for an answer they hallucinated or drew from weights. The lesson: citation-present ≠ grounded, and automated NLI citation checks give false comfort. For KB-backed agents, prefer eval designs with counterfactual perturbation of source facts, watch for provenance drift as models scale, and keep sensitive answers tied to content that can be (and gets) ablated in evaluation.

## References

- Paper: https://arxiv.org/abs/2611.17161
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17161
- Related KB note: `AI-LLM/vectordatabases/reference-swe-bench-verified-agentless-retrieval.md`
