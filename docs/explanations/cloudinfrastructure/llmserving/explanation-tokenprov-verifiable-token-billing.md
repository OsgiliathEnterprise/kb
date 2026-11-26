---
title: Where Did My Tokens Go? Verifiable Token Billing for LLM Services (TokenProv)
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.31806
date: 2026-11-24
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# Where Did My Tokens Go? Verifiable Token Billing for LLM Services (TokenProv)

**Authors:** Jiayuan Du, Yebo Feng, Lin Zhang, Konglin Zhu

## Overview
TokenProv addresses token billing for LLM services where evidence is scarce and broker-mediated agent workflows spread a chargeable call across multiple domains. Its approach is an evidence architecture rather than a proof system: authenticated provider acceptances define what is billable (settlement coverage), authenticated causal history ties every runtime attempt to a signed policy, and co-signed handoffs bind intent, dispatch and receipt to the same call — so an auditor can require one-to-one agreement between observable receipts and settled receipts, and recompute bills from verified charges.

## Problem Statement
In broker-mediated workflows, calls can arise after delegation, placing evidence in different domains. An invoice can then overstate real receipts and omit others, and valid metering evidence can still be attributed to the wrong execution: a cache-miss charge may rest on a cached run, while a cached charge may hide a miss. Neither failure changes runtime behavior, so neither is visible at runtime.

## Key Contribution
- **Settlement coverage from authenticated provider acceptances** — billable items are defined by evidence, not by the provider's counter.
- **Authenticated causal history** linking runtime attempts to a signed policy, with a shared provider relation that ties metered usage to the cache-dependent execution of accepted inputs under a registered model and serving rules.
- **Co-signed handoffs** binding intent, dispatch and receipt to the same call; handoffs submitted apart from the bill expose omitted calls.
- **Deferred proof via witness commitments**: providers can either attest state transitions in a trusted execution environment or commit witnesses before settlement and defer proof to audit; the auditor recomputes bills from verified charges.
- **Audit soundness proof** relative to authenticated evidence.

## Technical Approach
The auditor's checks are structural: one-to-one matching between observable receipts and settled receipts; exposure of any handoff not reflected in the bill; recomputation of the bill from verified charges against registered pricing rules. The cache-attribution attack (metered usage attached to a different execution) is closed by binding metered usage to the specific accepted-input execution through the shared provider relation. Proofs are optional on the fast path — witness commitments recorded before settlement allow verification to be deferred to audit time.

## Results
- Across **five models**: **94.4–107.4% of baseline throughput**, with **54–66 ms of online non-LLM processing per request**.
- In an eight-call replay, deferring scoped proofs reduces foreground protocol time from **1.20 s to 8.65 ms (99.28%)**.
- The auditor **rejects all 1,600 validly signed attack queries across 100 adaptive episodes**.

## Relevance to Our Domain
Billing integrity is the missing trust layer for LLM-serving FinOps and any internal chargeback or multi-tenant GPU platform: TokenProv turns "trust the provider's counter" into an auditable evidence chain. Two transferable design ideas: (1) define billable items by authenticated acceptances rather than runtime counters, and (2) keep the fast path proof-free by committing witnesses before settlement and deferring verification to audit — the 99.28% foreground reduction shows why that ordering matters operationally.

## References
- Paper: https://arxiv.org/abs/2611.31806
- Related: cloud-infrastructure/finops/howto-smart-model-routing-llm-cost-reduction.md
- Related: cloud-infrastructure/finops/howto-bedrock-iam-cost-attribution.md
