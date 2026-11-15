---
title: LLM API Relays — Measuring Answer Integrity, Tool Permissions and Billed Usage
  in Reseller Markets
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.07650
date: '2026-11-08'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# LLM API Relays — Measuring Answer Integrity, Tool Permissions and Billed Usage in Reseller Markets

## Overview
Chen, Zhang, Zhong et al. (2026) run what appears to be the first systematic measurement of **LLM API relay services** — the grey-market middlemen that resell access to frontier models (found on Chinese e-commerce platforms and aggregator marketplaces). Relays are economically attractive because they bypass the two real barriers to frontier-model access: **payment friction and geographic restrictions**. The study probes 224 live relay offers and finds systematic integrity failures: relays change your answers, keep your tool permissions open, and bill you for tokens that were never generated.

## Problem Statement
Developers who cannot (or will not) pay OpenAI/Anthropic directly route API traffic through third-party relays advertising cheap access to official models. Nobody had measured whether relay-delivered responses actually come from the advertised model. The relay sits in a position of total trust — it sees every prompt and shapes every response — and that position had never been audited at scale.

## Key Contribution
- A **taxonomy of relay operator strategies** for providing "official-model" access, distinguishing relays that are more likely to proxy genuine API access from those using lower-cost substitutions.
- A three-dimension measurement over **224 live offers from 224 sellers**:
  1. **Answer integrity** — whether relay responses match the advertised model's behaviour,
  2. **Tool permissions** — whether agent tool-calling permissions stay correctly scoped,
  3. **Billed usage** — whether charged tokens correspond to tokens actually generated.
- Evidence of **silent tool-permission persistence**: when a client disables tool permissions, relays can preserve tool-capable behaviour in the response while hiding it from the client-visible status — breaking the client's authority over its own agent's capabilities.
- Evidence of **phantom token billing**: relays returning tool-capable content while recording no tool-call generation event, then billing more tokens than produced.

## Technical Approach
The authors built a measurement platform that sends matched probes to relay endpoints and to legitimate API baselines, then diffs responses for model-behaviour divergence, tool-schema/behaviour leakage under disabled permissions, and token-accounting mismatches. The combination of tool-permission and billing analysis is the novel angle: prior work on API proxies covered model substitution, not agent-capability tampering.

## Results
- All three measurement dimensions show failures across a substantial share of relays (the paper highlights model-behaviour divergence, unexpected tool-capable responses, and over-billing as the dominant patterns).
- Relays' *internal provenance* (proxy vs. substitution strategy) predicts which failure modes appear — the taxonomy is predictive, not descriptive filler.
- Practical implication: **client-side permission state and token accounting cannot be trusted across an untrusted relay**, because the relay mediates both.

## Relevance to Our Domain
This is the supply-chain story for LLM serving in our KB. Policy takeaway for anyone running agents against third-party endpoints: an untrusted relay voids both the security boundary (tool permissions) and the billing boundary (usage accounting). If an agent's permission model or cost model depends on the API endpoint telling the truth, only direct provider access is trustworthy. Pairs naturally with the KB's AI agent security and supply-chain security coverage.

## References
- Paper: https://arxiv.org/abs/2611.07650
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.07650
- Related KB: `explanations/cloudinfrastructure/llmserving/`, `explanations/securityprivacy/supplychainsecurity/`
