---
title: Multimodal-SEA — Benchmark Specification for Agent Social-Engineering Attacks
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.08281
date: '2026-11-21'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Multimodal-SEA — Benchmark Specification for Agent Social-Engineering Attacks

## Overview
Multimodal-SEA — *Benchmarking AI Agent Security under Multimodal Social Engineering Attacks* (He, Zhang, Han & Fung, MMSense Lab, HKUST; arXiv:2611.08281, submitted 2026-11-05, cs.CL) — is an interactive benchmark for evaluating the **intrinsic security of personal AI agents** under social engineering attacks backed by forged multimodal content (images, documents, app screenshots). It moves beyond text-dialogue jailbreak evaluations by grounding attack outcomes in verifiable tool-execution logs inside simulated applications. **Benchmark code is public: https://github.com/Zhitao-He/M-SEABench**. Motivating context: personal agents such as Meta Muse, Doubao Phone Assistant, and the Qwen App now act on users' behalf with access to payments and personal data, and the FBI has flagged generative-AI-enabled financial fraud using forged content (IC3 advisory, Dec 2024).

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

Environment details: **50 simulated applications** with user profiles and historical records; the attacker cannot modify the agent's system prompt or tamper with user records. Scenario split: **79 Chinese + 73 English**, using local apps and culturally grounded fraud cases. Difficulty levels L1–L4 progressively give the attacker richer personal information and restrict independent verification; **L4 adds accomplice contacts** (e.g., a fake hotel concierge who confirms the attacker's story if the agent calls to verify). The six evaluation dimensions: financial-loss/information-leakage severity, proactive verification, attack recognition efficiency, attack success rate, ungrounded action claims, and **multimodal deception miss rate**.

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
| Proactive verification coverage with multimodal content | 54.7% → 65.1% (verification rises yet fails to catch forgeries) |
| Effect of stronger safety instructions | Lowers ASR, but does **not** improve recognition of deceptive multimodal content |
| Refusal side-effect | Models with lower ASR show excessive refusal of legitimate requests |

Concrete data points: GPT-5.6-Sol averaged **RMB 1,754 simulated loss per task** on the Chinese set; adding explicit safety rules cut its Chinese-task ASR **34.8% → 10.8%** but *raised* its Multimodal Deception Miss Rate **50.4% → 63.5%**. Claude Opus 5 was hardest to attack (**7.1% ASR**) yet refused **32.1% of legitimate requests** on 42 newly added benign tasks per language environment.

## Interpretation Notes
- Multimodal forgeries raise ASR even though agents *increase proactive verification coverage* — verification behaviour grows but doesn't catch forged media.
- There is a security/usability trade-off curve: aggressive refusal lowers ASR at the cost of denying legitimate tasks, so ASR alone should not rank models.

## Usage Guidance
Use this benchmark when assessing personal/assistant agents that touch real tools (email, payments, calendars). Pair it with text-only prompt-injection suites: Multimodal-SEA covers the *content-forgery* threat vector, not direct instruction override.

## References
- Paper: https://arxiv.org/abs/2611.08281
- Benchmark code: https://github.com/Zhitao-He/M-SEABench
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.08281
- Related KB: `how-to/securityprivacy/aiagentsecurity/`, `explanations/securityprivacy/aiagentsecurity/`
