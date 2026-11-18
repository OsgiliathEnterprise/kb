---
title: 'From Token Changes to Task Failures: Bit Flips in a Shared KV-Cache Block'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.22243
date: '2026-11-18'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# From Token Changes to Task Failures: Bit Flips in a Shared KV-Cache Block

## Overview
Yamamoto & Matsuura extend their earlier work on KV-cache fragility in prefix-caching serving systems. When many requests share the same system prompt, the KV block for that prompt exists as **one physical copy in GPU memory** that every request reads. A single corrupted bit in that shared block silently poisons *all* downstream responses. This paper measures not just whether responses change (previous work showed they change without looking degenerate) but **how often the changed responses are actually wrong**, across realistic serving tasks.

## Problem Statement
Prefix caching is a core optimization in engines like vLLM, but it creates a single point of memory corruption: one shared block, thousands of readers. The security/reliability question is how much *harm* a flip causes, and whether harmed outputs are detectable.

## Key Contribution
- Software fault injection into **vLLM serving Qwen3-8B**: they flip the most-significant mantissa bit or the sign bit of a value inside a shared system-prompt KV block.
- Evaluation on four task families: code generation (MBPP+), short-answer QA (held-out TriviaQA), multiple-choice reasoning, and policy refusal.
- **Task-dependent harm**: wrong-answer fraction after a flip ranges from **0.023 (MBPP+, mantissa bit)** to **0.59–0.60 (TriviaQA)** — i.e. the same single-bit fault is mostly benign on code but flips ~60% of answers to wrong on open-ended QA.
- Damage concentrates on requests whose sampled answers are *sometimes wrong to begin with* — the blast radius of a flip is governed by how common borderline requests are in the workload.

## Technical Approach
Rather than hardware fault campaigns, they use deterministic software fault injection at the KV-block level, isolating the shared-block effect. Responses are scored before/after the flip per task, and the "harmed" set (correct → wrong transitions) is analyzed. Crucially, harmed responses **look like ordinary model errors** — no visible degeneracy distinguishes them.

## Results
- Mantissa bit: 0.023 (MBPP+) vs 0.59 (TriviaQA) correct→wrong fraction.
- Sign bit: 0.019 (MBPP+) vs 0.60 (TriviaQA).
- Because corrupted outputs are indistinguishable from normal errors, output monitoring cannot catch flips — the authors argue detection must come from **verifying the cached blocks themselves** (e.g. checksums/integrity checks on KV blocks).

## Relevance to Our Domain
This is a reliability *and* integrity argument against unguarded prefix-cache sharing in our LLM serving stack: shared KV blocks are a high-value fault target (both accidental bit flips and — in a threat model — a deliberate one). Operational takeaways: prioritize KV-block integrity checks over output anomaly detection, and weigh prefix-cache exposure by workload error-margin. Cross-tenant sharing amplifies the blast radius (cf. cross-tenant cache-hit leakage work). Related: [[explanation-cross-tenant-cache-hit-leakage-llm-serving]], [[reference-kvcompass-prefix-cache-discovery]], [[explanation-callo-invalidated-kv-speculative-decoding]].

## References
- Paper: https://arxiv.org/abs/2611.22243
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.22243
