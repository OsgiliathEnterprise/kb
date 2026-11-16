---
title: 'MemoArmor: Forget the Lineage: Forward-Secure, Lineage-Complete Cryptographic
  Erasure for LLM-Agent Memory'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.18133
date: '2026-11-16'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Forget the Lineage: Forward-Secure, Lineage-Complete Cryptographic Erasure for LLM-Agent Memory

## Overview
Persistent LLM agents store observations, retrieved documents and tool results in external memory for the entire deployment — even after a user issues a deletion request. Current agent memory systems support whole-tenant deletion but lack per-item deletion with an enforceable post-deletion security guarantee. The paper identifies a previously unaddressed attack: **lineage reconstruction**. Even when the target item is destroyed, an adversary who reads live ciphertext can assemble the deleted item's *provenance chain* — source document, chunk offsets, embedding fingerprint, timestamps, embedding model ID — and use it to verify candidate re-insertions, amplifying extraction by roughly 6.5×.

## Problem Statement
Deleting a memory row is not deleting a memory. Derived artefacts (embeddings, provenance metadata) survive the row and let an adversary brute-force what was deleted. Existing encryption schemes protect confidentiality at rest but provide no forward security against provenance reconstruction, and no cryptographic erasure semantics at the granularity of a single memory item.

## Key Contribution
- **MemoArmor**: a forward-secure, lineage-complete cryptographic erasure system for agent memory.
- **Threat model with lineage-reconstruction attack**: new attack class — adversary with live-ciphertext read access (e.g. via a compromised service component or forensic extraction) reconstructs deletion provenance; formalized as **LR-IND** (lineage-reconstruction indistinguishability) security.
- **Dual-permutation key hierarchy**: an epoch key plus a content-addressed derivation chain make all item-derived information — embeddings included — post-compromise unreadable.
- **Formal proofs**: security proved in the Random Oracle Model.

## Technical Approach
Each memory item's cryptographic material is derived through a two-level permutation structure tied to an epoch key; deleting the item's key cryptographically erases every artefact derived from it, so ciphertexts of deleted items become indistinguishable even to an adversary holding later keys and observing live storage. Evaluation: 18,500 controlled adversary trials across three architectures, five memory models, six embedding models, six data domains.

## Results
| Metric | Value |
|---|---|
| Recall@10 on 2WikiMultiHopQA (long-context, domain-expert, 10-hop adversarial queries) | **0.974** |
| P95 lookup latency (NVIDIA A100, single node) | **28 ms** |
| Throughput at N = 10^6 items | **5,580 lookups/s** |
| vs unencrypted baseline | no significant accuracy drop |
| vs standard AES-GCM | no significant overhead |

## Relevance to Our Domain
RAG pipelines and agent memory stores (vector DBs + provenance metadata) are exactly the lineage-rich substrate this attack targets. The paper gives both a concrete threat model to add to our AI-agent security reviews and an implementable key-hierarchy design for per-item cryptographic erasure in compliance-driven deployments (GDPR-style deletion). Related: [[explanation-mcp-server-side-privilege-escalation]], [[explanation-agentcollab-secure-collaboration]].

## References
- Paper: https://arxiv.org/abs/2611.18133
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18133
