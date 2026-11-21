---
title: 'Ask in the Crowd: Differentially Private LLM Inference via Dummy-Augmented
  Shuffling'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.25669
date: 2026-11-21
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# Ask in the Crowd: Differentially Private LLM Inference via Dummy-Augmented Shuffling

## Overview
DP-SPD is a privacy framework for LLM-as-a-Service (LLMaaS): the client hides its real query among locally generated dummy queries, and the whole batch is randomly shuffled before being sent to the server, so the provider cannot pin intent to the user. Noise-injected differentially private inference is combined with crowd-in-the-middle anonymity, and shared-prefix KV-cache reuse keeps the extra dummy traffic affordable.

## Problem Statement
In LLMaaS the user's raw prompt is handed to a remote server — a severe exposure risk for sensitive inputs. Existing differentially private inference adds noise to input embeddings, but privacy and utility trade off badly: stronger noise collapses downstream accuracy. The question is how to get inference-time privacy without paying in answer quality.

## Key Contribution
- DP-SPD framework: client-side dummy-query generation + random shuffling so the real query is concealed inside a crowd of plausible decoys.
- Efficiency trick: exploit shared-prefix structure among queries and reuse transformer key–value (KV) caches during decoding, so dummy queries do not cost full recompute.
- Formal privacy analysis of the construction.
- Evaluation across classification and generation tasks, with adversarial evaluation under query-inference (QIA), embedding-inference (EIA), and GPT-based attacks.
- Result profile: strong inference-time privacy with near-plaintext utility plus improved inference efficiency from shared-prefix KV-cache reuse.

## Technical Approach
Rather than relying on embedding noise alone, DP-SPD shifts the anonymity burden to query mixing: the server sees a shuffled set in which any single query is statistically indistinguishable as "the" user intent. Prefill work for common prefixes across dummy and real queries is amortized through KV-cache reuse, keeping decode cost sublinear in the dummy count.

## Results
Near-plaintext utility on classification and generation benchmarks, robustness against QIA/EIA/GPT-based privacy attacks, and measurable inference speedups versus naive dummy padding.

## Relevance to Our Domain
A practical pattern for LLM serving and agent infrastructure: privacy-preserving client wrappers for third-party model APIs. The KV-cache-reuse insight matters for cost — dummy-augmentation without prefix sharing would multiply serving spend; with it, anonymity becomes an engineering detail rather than a bill shock. Cross-reference our KV-cache privacy notes: shuffling alone was broken for obfuscated KV caches (2611.24276), so client-side noise plus verified dummy construction, as here, is the more defensible combination.

## References
- Paper: https://arxiv.org/abs/2611.25669
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25669
- Related: explanation-kv-cache-shuffling-token-recovery.md (limits of shuffling-only defenses)
