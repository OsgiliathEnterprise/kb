---
title: Classical Oracle Separation of QMA from the QCMA Hierarchy and Quantum Cryptography
  Even When P = QCMA
diataxis: Explanation
domain: security-privacy
topic: quantum-cryptography
source: arXiv
source_url: https://arxiv.org/abs/2611.26574
date: 2026-11-20
keywords:
- knowledge-base
- quantum-cryptography
- security-privacy
- explanations
---
# Classical Oracle Separation of QMA from the QCMA Hierarchy and Quantum Cryptography Even When P = QCMA

## Overview
This STOC'27 submission introduces a new problem, Codeword-Hash pairs in Noise (CHN), and uses it to prove two structural results about quantum complexity relative to classical oracles: QMA is strictly harder than the entire QCMA hierarchy in the query model, and quantum cryptography can exist even in a world where P = QCMA (no quantum-computable one-way functions, no verifiable quantum advantage).

## Problem Statement
Quantum proofs (QMA: quantum verifier, quantum witness) vs. classical proofs (QCMA: quantum verifier, classical witness) is a central separation question. Prior work (Cakan 2026, building on the Codeword-Hash Structure problem) separated QMA from QCMA; the open questions were whether QMA escapes the *whole* QCMA hierarchy (iterated classical-witness oracles, the quantum analogue of PH), and whether quantum cryptographic primitives require some form of quantum hardness — an open question of Kretschmer, Qian, and Tal (STOC 2025).

## Key Contribution
- Defines CHN (Codeword-Hash pairs in Noise), proved to be in QMA but hard for QCMAH = ∪_d QCMA^QCMA^…^QCMA in the query-complexity model.
- Exhibits a classical oracle O with P^O = BQP^O = QCMA^O = QCMAH^O ⊂ QMA^O and QMA^O ⊄ QCMAH^O: quantum-state/quantum-proof advantage can persist even when classical computers efficiently solve everything classically-provable-quantum-verifiable.
- Relative to such an oracle, quantum cryptographic primitives still exist — pseudorandom states with classical keys, and public-key encryption with copy-protected quantum decryption keys plus classical public keys and ciphertexts — even though neither quantum-computable one-way functions nor (verifiable) quantum computational advantage exist. This answers the Kretschmer–Qian–Tal open question.

## Technical Approach
The CHN problem (inspired by the Codeword-Hash Structure problem) is engineered so a quantum witness (a coded state hashed with noise) provides verification power no stack of classical witnesses can simulate in the query model. Oracle relativization then decouples the complexity collapse P = QCMA from the existence of cryptographic structure: primitives are constructed that hinge on quantum *states* as resources, not on quantum *computational hardness*.

## Relevance to Our Domain
For security architecture planning around the post-quantum transition, this is foundational nuance: the existence of quantum-secure primitives is not equivalent to the existence of quantum one-way functions, and proofs of quantum advantage rest on assumptions (QMA ⊄ QCMAH) that have only oracle-level evidence. It calibrates how much cryptographic confidence to place in "quantum hardness" assumptions when designing long-horizon security.

## References
- Paper: https://arxiv.org/abs/2611.26574 (in submission at STOC'27; full manuscript posted on the conference website since 2026-11-03)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26574
