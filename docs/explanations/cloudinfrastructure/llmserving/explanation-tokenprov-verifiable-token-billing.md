---
title: Where Did My Tokens Go? Verifiable Token Billing for LLM Services (TokenProv)
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.31806
date: 2026-11-25
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Where Did My Tokens Go? Verifiable Token Billing for LLM Services (TokenProv)

## Overview
TokenProv is the first system that makes LLM token billing auditable end-to-end, binding the three components of a paid inference request — the inference engine, the billing component, and the client — into an auditable chain of custody. A prover running inside the inference engine emits per-request proofs and a Merkle-root commitment; a gateway verifies proofs, checks internal consistency, and builds an append-only ledger; the client verifies the commitment, the inclusion path, and a Groth16 SNARK. Evaluated on four production models at 50–375 ms proof generation and 4–5 ms verification per request, it closes an accountability gap that existing privacy- and correctness-oriented proof systems leave entirely open.

## Problem Statement
LLM providers charge per token, but the client has no way to verify that the billed count actually reflects the provider's internal token accounting. Mis-billed requests are economically significant and systematically favor the provider. Existing verifiable-inference and verifiable-database proof systems target privacy or correctness guarantees — none addresses billing integrity, i.e., proving that the number on the invoice matches the engine's real token consumption.

## Key Contribution
- **Problem definition**: billing integrity as a distinct verifiable-computing target for LLM services, with an explicit adversary model (provider-side mis-accounting) and evaluation protocol.
- **TokenProv**: an end-to-end verifiable token-metering architecture spanning prover (inside the inference engine), gateway (verification + append-only ledger), and client (independent audit).
- **Cryptographic binding**: per-request proofs + Merkle-root commitment + Groth16 SNARK + inclusion-path checks tie the engine's accounting to the bill.
- **Practical overhead**: 50–375 ms proof generation, 4–5 ms verification per request across four production models.

## Technical Approach
The prover instruments the inference engine to emit a proof of per-request token accounting plus a Merkle commitment; the gateway checks proof validity and cross-component consistency and appends to a tamper-evident ledger; the client independently verifies the commitment, its inclusion path in the ledger, and a Groth16 zero-knowledge SNARK attesting the billing computation. A prototype built around a widely used open-source inference engine, with an evaluation protocol exercising realistic mis-billing scenarios, validates the design.

## Results
- Proof generation: **50–375 ms** per request; verification: **4–5 ms** per request (four production models).
- The system **successfully detects** each realistic mis-billing scenario in the evaluation protocol.

## Relevance to Our Domain
Billing integrity is the missing trust layer for our LLM-serving and FinOps stack: as we meter and charge for context retention and token throughput, TokenProv supplies an architectural blueprint (engine-side prover → gateway ledger → client SNARK audit) that turns "trust the provider's counter" into cryptographic evidence. It also sets an auditability baseline for any internal chargeback or multi-tenant GPU platform.

## References
- Paper: https://arxiv.org/abs/2611.31806
- Related: cloud-infrastructure/llm-serving/explanation-measuring-charging-retained-context.md
- Related: cloud-infrastructure/finops/reference-token-as-currency-ai-native-finops.md
