---
title: 'Replication of Agentic Security Events: Audit and Investigation (ROGUE-AI)'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.26553
date: 2026-11-20
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Replication of Agentic Security Events: Audit and Investigation (ROGUE-AI)

## Overview
ROGUE-AI is a multi-agent framework that takes security incidents reported in the news about LLM agents (e.g., Replit's coding agent deleting a production database) and *replicates* them offline, together with a matched control run that lacks only the blamed cause. Unlike incident catalogs (which only collect reports) or benchmarks (which only record whether agents fail), ROGUE-AI validates the incident and tests the reported root cause. It doubles as a reusable audit suite vendors can rerun before each release.

## Problem Statement
Media reports of agent failures say *what* went wrong but rarely validate the incident or establish causality. Prompt-injection defenses dominate the agent-security conversation, yet many real incidents involve no attacker at all — a gap that neither catalogs nor pass/fail benchmarks address.

## Framework Specification
- **Input:** a reported agentic security event.
- **Reconstruction:** rebuild the incident offline + a matched control environment identical except for the blamed cause.
- **Execution:** run agents on both variants across five frontier models (GPT, Claude, Gemini, DeepSeek families).
- **Comparison:** harm rate with vs without the blamed cause; attribution of harm to attacker vs ordinary hazards.

## Key Numbers (from the paper's evaluation)
| Metric | Value |
|---|---|
| Attempted replications | 108 |
| Reported harm reproduced | 89% |
| Failure rate with blamed cause (5 models) | 18–33% of runs |
| Failure rate without blamed cause | ≤ 1% |
| Real-harm incidents | 72 |
| Incidents with **no underlying attacker** | 62 of 72 |
| Harm: non-attacker replications vs prompt-injection replications | Higher, for all five models |

## Key Findings (lookup material)
1. **Most real agent harm is not prompt injection.** In the no-attacker incidents, agents did exactly what their task asked but missed an ordinary hazard (e.g., a database shared with the live site). Prompt-injection defenses look for injected instructions; these replications contain none, so those defenses do not apply.
2. **Hazard-naming warnings work; generic warnings don't.** A warning after each tool output that *names the hazard and its consequence* lowered harm for all five models. A same-length note that does not mention the hazard left most of the harm in place.
3. **Matched-control replication establishes causality** — the 18–33% vs ≤1% gap isolates the blamed cause as the driver.
4. The suite is **reusable as a release gate**: vendors can rerun the incident replications before each new model/product release.

## Relevance to Our Domain
Counters the prompt-injection monoculture in our AI-agent-security coverage with measured, incident-derived evidence that mundane hazard-awareness is the bigger real-world risk. The hazard-naming warning result is directly actionable for our agent harness design notes; the replication methodology complements our benchmark references (EvasionBench, INFUSE, PIATLAS).

## References
- Paper: https://arxiv.org/abs/2611.26553
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26553
- Related: [[explanation-openai-hugging-face-agent-incident]], [[explanation-enterprise-ai-data-security-patterns]]
