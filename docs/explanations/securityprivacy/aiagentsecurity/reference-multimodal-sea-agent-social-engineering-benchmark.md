---
title: Multimodal-SEA — Benchmark Specification for Agent Social-Engineering Attacks
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.08281
date: '2026-11-08'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Multimodal-SEA — Benchmark Specification for Agent Social-Engineering Attacks

## Overview
Multimodal-SEA (He, Zhang, Han & Fung, 2026) is an interactive benchmark for evaluating the **intrinsic security of personal AI agents** under social engineering attacks backed by forged multimodal content (images, documents, app screenshots). It moves beyond text-dialogue jailbreak evaluations by grounding attack outcomes in verifiable tool-execution logs inside simulated applications.

## Benchmark Composition

| Dimension | Value |
|-----------|-------|
| Tasks | 608 expert-designed, grounded in real-world fraud cases |
| Domains | 14 |
| Attack scenarios | 152 |
| Difficulty levels | 4 |
| Language/cultural contexts | Chinese and English environments |
| Models evaluated | 7 widely used multimodal models |
| Evaluation dimensions | 6 |

Agent workflow per task: **inspect content → verify requests → execute actions** in simulated applications. Attack success is determined from tool-execution logs, not model self-report.

## Attack Harness
The companion harness integrates three components for controlled red teaming:
1. **Task information** injection,
2. **Attack progression control** (adaptive, multi-turn escalation),
3. **Multimodal content construction** (prepared forged artifacts).

## Headline Results (lookup table)

| Measurement | Value |
|-------------|-------|
| Overall attack success rate (ASR), all 7 models | 7.1% – 34.5% (all vulnerable) |
| ASR increase when multimodal content added | 19.9% → 29.2% |
| Effect of stronger safety instructions | Lowers ASR, but does **not** improve recognition of deceptive multimodal content |
| Refusal side-effect | Models with lower ASR show excessive refusal of legitimate requests |

## Interpretation Notes
- Multimodal forgeries raise ASR even though agents *increase proactive verification coverage* — verification behaviour grows but doesn't catch forged media.
- There is a security/usability trade-off curve: aggressive refusal lowers ASR at the cost of denying legitimate tasks, so ASR alone should not rank models.

## Usage Guidance
Use this benchmark when assessing personal/assistant agents that touch real tools (email, payments, calendars). Pair it with text-only prompt-injection suites: Multimodal-SEA covers the *content-forgery* threat vector, not direct instruction override.

## References
- Paper: https://arxiv.org/abs/2611.08281
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.08281
- Related KB: `how-to/securityprivacy/aiagentsecurity/`, `explanations/securityprivacy/aiagentsecurity/`
