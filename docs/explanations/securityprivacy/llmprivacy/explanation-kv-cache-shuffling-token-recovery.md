---
title: 'When Shuffling Fails: Token Recovery from Obfuscated KV Caches'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.24276
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# When Shuffling Fails: Token Recovery from Obfuscated KV Caches

## Overview
LLM serving systems store, offload, and share KV caches, exposing token-level representations to infrastructure operators and co-tenants. **Shuffled obfuscation** defenses (secret linear transforms + fresh permutations, e.g. KV-Cloak) claim security from the b! possible shufflings. This paper shows that **input symmetry invalidates the counting argument**, and presents **Repeat-to-Reveal**, an attack that recovers token multisets from obfuscated caches — including a full break of the official KV-Cloak implementation.

## Problem Statement
Can outsourced/offloaded KV caches be privacy-preserving when the defense's security proof rests on combinatorially many permutations? Security should depend on *distinguishable outputs under chosen inputs*, not on the raw count of permutations.

## Key Contribution
- **Symmetry attack on the counting argument:** repeated tokens produce identical first-layer Value rows, so every row permutation leaves the data unchanged. Only auxiliary structures (e.g. a single-row recovery marker) vary — collapsing the effective state space from b! to b.
- **Repeat-to-Reveal attack:** the attacker collects the b distinguishable states via its own probes and exploits their rank-one differences to recover an *equivalent denoiser* without knowing the defender's secret parameters.
- **Cross-request transfer:** a one-time calibration transfers across requests sharing the same secret epoch, enabling *passive* token-multiset recovery from later cache blocks via public-model dictionary matching.

## Results
- Instantiated on official KV-Cloak; evaluated on 3,000 real WildChat prompts across nine models and eleven configurations: high-accuracy secret-parameter recovery and **100% token-multiset recovery on GPU**.
- Refreshing row-level secrets between epochs interrupts cross-request transfer — identifying **secret reuse scope** as the operative vulnerability.
- Orbit collapse also confirmed against two other open-source defenses: the sequence-permutation scheme of Thomas et al. and PermLLM.
- Responsible disclosure: KV-Cloak developers requested a detailed report via their private vulnerability reporting channel.

## Relevance to Our Domain
Directly relevant to LLM serving infrastructure (KV offload, prefix-cache sharing, RAG caching): permutation-based "privacy" on KV caches is not safe against a co-tenant attacker who can issue chosen inputs. Design guidance: scope secrets per-epoch tightly, and prefer defenses whose guarantees don't rest on permutation counting. Extends our KV-cache security line ([[explanation-cross-tenant-cache-hit-leakage-llm-serving]], [[explanation-kv-cache-bit-flip-silent-task-failures]]) and complements the earlier KV-Cloak-style line of work ("Shadow in the Cache", arXiv:2508.09442).

## References
- Paper: https://arxiv.org/abs/2611.24276
- Related: KV-Cloak (official defense broken here), PermLLM, Thomas et al. sequence-permutation defense
