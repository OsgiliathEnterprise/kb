---
title: 'The Illusion of Local Privacy: Confidentiality Boundary Failures in Consumer LLM Serving Systems'
diataxis: Explanation
domain: securityprivacy
topic: aiagentsecurity
source: arXiv
source_url: https://arxiv.org/abs/2609.18526
arxiv_id: "2609.18526"
date: 2026-09-20
keywords:
- knowledge-base
- aiagentsecurity
- securityprivacy
- explanations
visibility: public
---

# The Illusion of Local Privacy: Confidentiality Boundary Failures in Consumer LLM Serving Systems

## Overview

Running an LLM locally is widely assumed to be more private than cloud inference because prompts stay on the device. This paper challenges that assumption: prompt confidentiality does **not** follow from local inference alone — it also depends on how the surrounding serving software handles prompt data before, during, and after inference. The authors examine four boundaries where prompt confidentiality can fail (model loading, runtime memory, wrapper-level persistence, and the serving interface) and show each has distinct, measurable failure modes across open-weight model families and consumer deployment platforms.

## Problem Statement

"Local = private" is a common but incomplete mental model. Even when inference runs on-device, prompts can leak through the software stack around the model: how weights are loaded, what survives in runtime memory after inference, whether wrapper tools persist prompt data to disk, and how the serving interface isolates tenants. The paper asks whether keeping inference local is *by itself* sufficient for confidentiality — and demonstrates it is not.

## Key Contribution

- A **four-boundary model** of where prompt confidentiality fails in consumer local-LLM systems: model loading, runtime memory, wrapper-level persistence, and the serving interface.
- **LLAnalyzer**, a measurement framework that tests each boundary separately and traces observed failures to the responsible software component — applied across four open-weight model families and two consumer deployment platforms.
- A previously undocumented **authorization flaw in llama.cpp** allowing one authenticated client to restore another tenant's saved conversation state (succeeded 200/200 controlled trials), plus a remote timing oracle exposed by shared prompt-prefix caching that remains distinguishable under WAN conditions.

## Technical Approach

The study isolates each confidentiality boundary and probes it independently rather than treating the stack as a black box. A 24-hour AFL++ campaign (12M+ executions) targets the model-loading/parser path; runtime-memory analysis recovers prompts after inference; wrapper persistence is audited for plaintext retention; and the serving interface is tested for cross-tenant authorization and timing side channels.

## Results

- **Model loading**: no parser crashes or successful malformed GGUF loads within the explored state space (12M+ AFL++ executions) — this boundary held up.
- **Runtime memory**: prompts are recoverable after inference because multiple plaintext representations survive in allocator-managed memory; sanitization reduces but does not eliminate residue.
- **Wrapper persistence**: consumer wrappers can extend prompt lifetime through plaintext persistence to disk.
- **Serving interface**: a llama.cpp authorization flaw lets one authenticated client restore another tenant's saved conversation state (200/200 trials); shared prefix caching exposes a remote timing oracle distinguishable even over WAN.

## Relevance to Our Domain

This is a direct correction to the "local LLMs are private" assumption that many teams rely on for data-sensitive workloads. If you deploy local inference expecting confidentiality, this paper tells you exactly where to look: runtime memory residue (sanitize aggressively), wrapper disk persistence (audit what gets written), and tenant isolation at the serving layer (the llama.cpp cross-tenant flaw is a concrete, reproducible bug). The takeaway: local systems need *explicit* guarantees for prompt lifetime, persistent storage, and tenant isolation — locality alone provides none of them.

## References
- Paper: https://arxiv.org/abs/2609.18526
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.18526
