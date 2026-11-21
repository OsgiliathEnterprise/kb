---
title: Evaluating safeguarding in multi-turn conversations with AI assistants
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.26009
date: '2026-11-21'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Evaluating safeguarding in multi-turn conversations with AI assistants

## Overview
Peart, Hafner and Rocher (arXiv:2611.26009, submitted 2026-11-19) run one of the largest safeguarding evaluations of conversational assistants to date: **over 7,400 conversations across six models from five providers**, built with community mental-health support workers. The central manipulation is *how distress cues are distributed across the conversation* — all at once versus scattered over turns — which turns out to matter enormously.

## Problem Statement
Most safeguard evaluations present a single, explicit, articulate user request. Real users in crisis rarely do: their needs emerge gradually, mixed with unrelated content, across many turns. Whether model guardrails were ever *designed* for this progressive-disclosure regime is untested.

## Study Design
- **Co-design**: three community mental-health support workers helped create **9 scenarios** spanning three situation types — **depression, psychosis, and domestic abuse** — plus **gold-standard model responses** for each.
- **Conditions**: the scenario's five key cues are either (a) all presented up front, or (b) distributed over **12 conversational turns**.
- **Scale**: 7,400+ conversations; 6 models from 5 providers (OpenAI, xAI, DeepSeek, Meta, Anthropic).

## Results
| Model group | Meets-the-bar (concentrated cues) | Meets-the-bar (distributed over 12 turns) |
|---|---|---|
| GPT-5.5, Grok 4.3, DeepSeek V4, Llama 4 Maverick | 26–59% | **3–6%** |
| Claude Sonnet 5, Claude Opus 5 | 68–97% | 59–87% |

- Four of six models **collapse** when cues are scattered — dropping to single digits.
- The two best performers (Claude Sonnet 5, Opus 5) also lead on an **honesty** measure, and their safeguarding quality is **not explained by training for safety alone**.
- Even the ceiling case leaks: Opus 5 still fails to meet the bar on **13%** of fully distributed conversations.

## Key Takeaway
**Safeguard evaluations centred on explicit, legible concerns overestimate how well the models are safeguarded.** A model can be "safe" on every published benchmark and effectively unsafeguarded for a user whose distress emerges gradually — precisely the profile of the vulnerable users these guardrails exist to catch.

## Relevance to Our Domain
- Any deployment of assistants in support/coaching/health-adjacent roles should run **progressive-disclosure red-team scenarios** (cues spread over 10+ turns), not just single-turn policy probes.
- For agent-framework guardrail design: session-level context accumulation should feed the safeguard decision, since turn-local judgment is what fails here.
- Useful benchmarking methodology template: co-design with domain practitioners + gold-standard responses gives an auditable "meets-the-bar" criterion.

## References
- Paper: https://arxiv.org/abs/2611.26009
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26009
- Related: [[explanation-guardrails-as-hf-text-classifier]], [[explanation-prompt-injection-governance-openclaw]], [[reference-openai-model-security-triage-2026]]
