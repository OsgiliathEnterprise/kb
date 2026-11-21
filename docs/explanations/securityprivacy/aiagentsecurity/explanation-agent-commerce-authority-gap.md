---
title: 'Signed but Unbound: The Authority Gap Between Agent Commerce Mandates and
  Crypto Wallet Signatures'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25821
date: 2026-11-21
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Signed but Unbound: The Authority Gap Between Agent Commerce Mandates and Crypto Wallet Signatures

## Overview
When an AI agent pays with a stablecoin, the **commerce protocol** specifies the merchant, order, amount, and facilitator — but the **token contract** only enforces the fields the wallet actually signs. This paper (arXiv:2611.25821, You, Joshi, Kuehlkamp & Nabrzyski, University of Notre Dame) names the difference the **authority gap**: what the mandate promises vs. what the on-chain signature actually binds.

## Problem Statement
A transaction can be perfectly valid to the blockchain (correct signature, nonce, gas) while violating the user's spending mandate: any holder of a redeemable signature can redeem it, regardless of the intended merchant/order/amount. Cryptography proves *who* signed *a payload*, not that the payload's fields mean what the mandate says — the binding gap is a logic/architecture bug, invisible to signature verification.

## Key Contribution (verified)
- **Formal model of the trust boundary**: defines the authority gap and derives **nine constraint classes** across **12 authorization configurations**, including Coinbase's deployed Commerce Payments Protocol (CPP) and ablated variants.
- **Machine-checked derivation vs. deployed code**: all **31,800 trials** on local copies of deployed contract code match the formal derivation.
- **Empirical audit of real usage**: of **26,653 sampled USD Coin (USDC) authorizations redeemed on Base, 98.7% followed a path that any holder of the signature could redeem** — i.e., the dominant deployed pattern is signature-agnostic once leaked.
- **Constructive results**: committing the payment terms *inside the signed nonce* binds the order; binding the *facilitator* additionally requires a separate recipient contract. The paper proves sufficient conditions for a recipient contract to enforce the signed mandate under a trusted signer.
- **MandateLock**: a minimal recipient implementation for immediate payments — rejects **all 10,800 modified mandates** on deployed token code, accepts signatures from two independent signers, at **+25% gas** versus a transfer only the recipient can submit.

## Why It Matters (Explanation)
The finding is architectural, not a bug list: deployed agent-commerce stacks authorize at the mandate layer while execution binds only at the signature layer, so most real payment paths leave a replay/redemption window open to anyone holding the signature. For any system pairing human/agent approvals with on-chain execution — payment agents, DeFi bots, treasury automation — the audit checklist is: (1) which mandate fields are covered by the signed payload (field binding), (2) does the contract enforce them, (3) is redemption restricted to the intended party. The same mismatch generalizes to API-key scopes vs. OAuth consent in non-crypto agent systems.

## Relevance to Our Domain
As LLM agents gain payment and procurement capabilities, mandate-vs-execution separation becomes a primary attack surface; the nine-constraint-class model over twelve configurations is a reusable template for auditing our own agent-payment designs.

## Provenance & verification
Corrected 2026-11-21 after audit: the original note's "9 exploit classes from real-world incidents / 7 platforms", "497 source files, 11 test suites, 5 implementations (Skyfire, AgentKit, ACP…)", "7 of 9 classes 77.8%, mean ASR 89.2%, delegate 93.1%" and "Pattern Recognition submission" do **not** appear in the paper and were removed. All figures above verified against the official arXiv abstract (v1). Authors corrected from "Kim & Park".

## References
- Paper: https://arxiv.org/abs/2611.25821
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25821
- Related: Coinbase Commerce Payments Protocol, EIP-712 typed structured data hashing, ERC-4337 account abstraction
- Related (complementary attack surface): Protocol-Level Attacks on Agentic Commerce Platforms (arXiv:2607.21824, 2026-07) — audits the agent↔commerce-service protocol layer, where this paper audits the mandate↔signature binding layer; read together for full-stack agent-payment threat coverage

## Corroboration (zookeeper pass, 2026-11-21)

Re-verified against the arXiv v1 abstract (submitted 2026-11-19, cs.CR, 10 pages / 3 figures,
reproducibility artifact in manuscript): full author list **Shengwei You, Aditya Joshi, Andrey
Kuehlkamp, Jarek Nabrzyski**. Every headline figure matches the abstract verbatim — nine
constraint classes, 12 authorization configurations (incl. Coinbase CPP), 31,800 trials matching
the formal derivation, 26,653 sampled USDC authorizations on Base with 98.7% holder-redeemable,
MandateLock rejecting all 10,800 modified mandates at +25% gas. The note's nonce-commitment and
recipient-contract results correspond exactly to the abstract's controlled comparison and
sufficiency-theorem claims.
