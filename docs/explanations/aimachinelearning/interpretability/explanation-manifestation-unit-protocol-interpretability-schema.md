---
title: The Manifestation Unit Protocol — a Typed Schema That Makes Interpretability
  Findings Reusable
diataxis: Explanation
domain: ai-machine-learning
topic: interpretability
source: arXiv
source_url: https://arxiv.org/abs/2607.00089
date: 2026-11-15
keywords:
- knowledge-base
- interpretability
- ai-machine-learning
- explanations
---
# The Manifestation Unit Protocol — a Typed Schema That Makes Interpretability Findings Reusable

## Overview
Mechanistic interpretability produces rich component-level analyses — what a neuron, filter or attention head encodes, and which circuits interact — but those outputs are effectively write-once: selectivity tables, circuit diagrams and feature lists die in per-study notebooks. This paper reframes the *representation layer* between interpretability analyses and their downstream consumers (auditors, intervention tools, other researchers) as an independently evaluable bottleneck, and proposes **Manifestation Units**: typed tuples that structure per-component statistics so they can be populated automatically and queried in natural language through hybrid retrieval.

## Problem Statement
Interpretability artifacts are non-composable, not queryable, and not directly actionable. Two studies analysing the same architecture cannot merge their inventories; an auditor cannot ask "which components encode X and what is the evidence?" without reading notebooks. The missing piece is not better analysis but a *schema* for analysis output — a layer that can be measured and improved on its own.

## Key Contributions
- **Manifestation Units**: a typed tuple protocol **(E, S, R, D, G)** (evidence, subject/stimulus, relation, description, grounding-style fields) that organises per-component statistics into structured, machine-populated fields, queried via hybrid (semantic + keyword) retrieval.
- **Attention-head extension (T)**: transformer attention-head primitives slot into the protocol without modifying the core schema.
- **Cross-architecture instantiation**: the same protocol is exercised on generative vision (β-VAE), discriminative vision (CNN) and language (GPT-2).
- **Two empirical findings**: (1) typed structure substantially beats unstructured baselines on retrieval quality; (2) CNN filters retrieved through the schema satisfy both *causal sufficiency* and *causal necessity* under matched-budget controls.
- **Minimal-core discovery**: the schema absorbs attention primitives cleanly, recovers known IOI circuit members under retrieval-budget-matched controls, and exposes an irreducible two-field core **(S+R)** — the remaining fields are redundant or actively interfere with retrieval.

## Technical Approach
Each interpretability observation about a model component is normalised into a Manifestation Unit: the tuple fields pin down *what* the component is, *which* stimuli select it, *how* the evidence was gathered, and *what* it is claimed to mean. Fields are populated automatically from analysis pipelines; consumers query the unit store via hybrid retrieval rather than reading prose. The (T) extension adds head-level primitives (query/key/value roles, attention patterns) for transformers. Evaluation is retrieval-centric: can the right components be recovered, under matched budgets, with causal validation attached?

## Results
- Typed retrieval significantly outperforms unstructured baselines across the three instantiated architectures.
- Retrieved CNN filters pass matched-budget causal sufficiency + necessity controls.
- IOI (Indirect Object Identification) circuit membership in GPT-2 is set-recovered under retrieval-budget-matched controls.
- Ablation over schema fields shows S+R is the irreducible core; extra fields add redundancy or noise.

## Relevance
Positions "interpretability infrastructure" as a first-class research object — closer to data engineering than to model probing. For a KB covering AI evaluation and observability, the takeaway is architectural: if you build interpretability or audit tooling, invest in a typed, queryable component-annotation store rather than report generation. The authors themselves scope it as schema infrastructure, not frontier-scale validation.

## Sources
- arXiv: https://arxiv.org/abs/2607.00089
- Interactive demos: https://manifestation-xai.github.io/manifestation-transformers/ and https://manifestation-xai.github.io/manifestation-cnn
- Related: [[explanation-internal-views-match-external-behaviour-limits]]
