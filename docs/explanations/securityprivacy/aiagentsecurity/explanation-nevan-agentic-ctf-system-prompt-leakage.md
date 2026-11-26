---
title: 'Eight in Ten LLMs Leak System-Prompt Secrets: Nevan, an Agentic Capture-the-Flag
  Study'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.21956
date: 2026-11-18
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Eight in Ten LLMs Leak System-Prompt Secrets: Nevan, an Agentic Capture-the-Flag Study

## Overview
"Nevan" is a large-scale agentic audit of **instruction-hierarchy enforcement**: 363 text-in/text-out models from the OpenRouter catalog each guarded a secret 16-character flag planted in their system prompt, while an attacker agent (OpenCode, powered by DeepSeek V4.1 Flash, steered by a human researcher) tried to persuade them to emit it. The flag was extracted from 296 of 363 models — plus four models released after the catalog freeze, for 300 captures total. Roughly eight in ten models leaked.

## Problem Statement
System prompts are routinely treated as a confidentiality boundary ("the model will not reveal what the system prompt says"). This study measures how often that assumption actually holds, and through which techniques models break rank.

## Key Contribution
- Largest known agentic CTF-style audit of system-prompt confidentiality: 363 OpenRouter models, uniform secret-flag task, one attacker agent, human-steered.
- **Result**: 300 successful exfiltrations (296/363 + 4 post-freeze models).
- **Striking technique finding**: 170 of the captures involved a **non-English language pivot** — French was the most frequent — showing instruction-hierarchy failures are language-conditional.
- Disciplined scope: a capture proves the model ranked a user request above its system instruction *at least once*; it does not prove resistance to untested attacks, consistent leakage of semantically sensitive data, or harmful-content jailbreak vulnerability.

## Technical Approach
Each model guards a 16-char flag embedded in its system prompt; the OpenCode agent (DeepSeek V4.1 Flash), directed by a human, iteratively crafts persuasion strategies — role-play, instruction override, and language pivots among them — until the flag is emitted or the budget runs out.

## Three Practitioner Lessons (from the authors)
1. **Do not store secrets in system prompts** — they are not a confidentiality mechanism.
2. **Enforce critical behavior outside the model** — output validation and deterministic checks, not prompt instructions.
3. **Never let an LLM judge be the sole decider** of consequential outcomes.

## Relevance to Our Domain
Direct operational guidance for our agent deployments: audit any system prompt that embeds API keys, business rules, or policy text; move enforcement to deterministic middleware in the agent gateway. The non-English pivot finding means red-team suites must include multilingual attack variants.

## References
- Paper: https://arxiv.org/abs/2611.21956 (published 2026-11-16)
- Authors: Ana Clara Zoppi Serpa, Anderson Rocha, Hélio Pedrini
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21956
