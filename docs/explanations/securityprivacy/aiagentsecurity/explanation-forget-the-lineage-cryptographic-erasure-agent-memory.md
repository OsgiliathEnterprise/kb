---
title: 'Forget the Lineage: Forward-Secure, Lineage-Complete Cryptographic Erasure
  for LLM-Agent Memory'
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
LLM agents keep a long-term memory the model itself writes: summaries, extracted facts, and embeddings derived from what users said. Deleting a message is therefore not enough — its derivatives, storage residue, and backups survive. The paper defines **lineage-complete forward-secure erasure** and presents **LinEra**, which encrypts each memory under a key derived from its parents' keys along the derivation graph. Source keys come from a puncturable pseudorandom function, so forgetting is a **single puncture** and every descendant becomes unreadable **without ever being located**.

## Problem Statement
Logical deletion in agent-memory frameworks (summaries, extracted facts, embeddings) leaves derivatives recoverable by a forensic-strength adversary holding every file and the agent's current keys. Existing "secure deletion" primitives cover the object, not its lineage; the paper's threat model is explicitly forensic-complete (all storage + current keys).

## Key Contribution
- A formal definition of lineage-complete forward-secure erasure, with proofs of security and lineage integrity.
- Key derivation along the lineage graph from puncturable-PRF source keys: one puncture renders the whole descendant closure unreadable, no descendant enumeration required.
- **A sound lineage rule**: record as parents everything the writer saw when producing a memory — this confines all influence of a source to its descendants (an under-recording rule silently leaks, e.g. summaries written from retrieved context).
- An encrypted vector index whose keys follow the lineage, and integration with mem0; two construction variants trading guarantee strength for cost.

## Results
Real LLM writers from two families (1.5B–7B parameters) populate memory over LoCoMo conversations; the adversary holds every file plus current keys:
- After logical deletion, **70 of 71** forgotten secrets are recovered (all ten conversations, largest model); with per-object or epoch keys, **67 of 71**.
- With LinEra: **none** recovered.
- System cost (E4): writing an object, its key derivation and its vector entry costs **0.28 ms at 10⁶ objects**; reading with a cold key cache **0.16 ms**.
- Answer-quality evaluation (E3) spans retrieval, small-context writing, and LongMemEval; mem0 case study shows vanilla vs LinEra side by side.

## Relevance to Our Domain
Agent memory systems (mem0-style RAG stacks) that promise "user data deletion" deliver only logical deletion today — a forensic adversary with disk + current keys reconstructs forgotten inputs from derivatives. LinEra offers a concrete cryptographic design for GDPR-style right-to-erasure in agent platforms, but the paper's sharpest engineering lesson is the **lineage rule**: record everything the writer saw, or the guarantee silently breaks. Related: [[explanation-privacy-debt-llm-agent-memory]].

## References
- Paper: https://arxiv.org/abs/2611.18133
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.18133
