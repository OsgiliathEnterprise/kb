---
title: KidnapRAG — Black-Box Reasoning Hijack of Agentic RAG via a Three-Document
  Poison Chain
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2607.00422
date: 2026-11-15
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# KidnapRAG — Black-Box Reasoning Hijack of Agentic RAG via a Three-Document Poison Chain

## Overview
RAG systems can be poisoned by injecting malicious documents into the corpus. Agentic RAG — which interleaves retrieval with multi-step reasoning — was believed more robust: the agent can simply ignore weakly relevant poisoned documents and keep the reasoning chain the user's query induced. KidnapRAG shows that robustness assumption is false under realistic (black-box) attacker constraints, and accepted at EMNLP 2026 main conference.

## Problem Statement
Prior attacks on agentic RAG assume privileged visibility: system prompts, reasoning traces, retriever internals or model weights. A realistic attacker can often only *publish documents* that the retriever may surface. The open question: can pure corpus access hijack a system whose defence is precisely its iterative reasoning?

## Key Contributions
- **Threat model tightening**: black-box sequential poisoning — the attacker's only capability is publishing externally retrievable poisoned documents.
- **Three-role document chain** that weaponises the agent's own reasoning loop:
  1. **Bait** — wins the initial retrieval,
  2. **Chain-Link** — induces a query *reformulation* that shifts the retrieval intent,
  3. **Mal-Ins** — supplies attacker-controlled evidence for the redirected query.
- **Consistent superiority over poisoning baselines** across multiple agentic RAG frameworks, LLM backbones and benchmarks under black-box conditions.
- **Mechanistic analysis**: the attack progressively weakens the original retrieval intent, redirects retrieval behaviour, and grows the agent's reliance on attacker-controlled evidence — the agent is not tricked in one shot, it is *led*, step by step, by its own reformulations.
- Public code: https://github.com/chanwoochoi316/KidnapRAG.

## Technical Approach
Design poisoned documents with complementary roles so that each step of the agentic loop (retrieve → reason → reformulate → retrieve again) hands the next step to the attacker: Bait is optimized for initial retrieval rank; Chain-Link embeds content that the reasoner treats as a legitimate cue to reformulate the query; Mal-Ins then dominates retrieval for the reformulated query and injects the target evidence. No gradient, prompt or trace access is needed — the chain works through distributional plausibility and the agent's trust in its own reformulation process.

## Results
- Outperforms existing poisoning baselines across all evaluated agentic RAG frameworks / backbones / benchmarks in the black-box setting.
- Analysis metrics show monotonic drift: original-intent retrieval strength falls as attacker-evidence reliance rises over reasoning steps.

## Relevance
Defeats the "agentic loop as defence" narrative — iterative reasoning is an attack *amplifier*, not a filter, when reformulations are steerable. For KB RAG-security coverage: defences must verify retrieval intent stability across steps (e.g., anchor the original query, cross-check evidence provenance), not just filter individual weakly relevant documents.

## Sources
- arXiv: https://arxiv.org/abs/2607.00422 (v2) — EMNLP 2026 main conference
- Code: https://github.com/chanwoochoi316/KidnapRAG
- Related: [[explanation-graphrca-metacognition-rag-epistemic-control]]
