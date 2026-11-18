---
title: 'DGA — Detail Guidance Attack: Jailbreaking LLMs with Indistinguishable Intent'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.17818
date: 2026-11-16
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# DGA Jailbreak: Malicious Requests with Indistinguishable Intent

> Corrected 2026-11-16 by KB Zookeeper: the first intake version ("Dynamic Generation of Adversarial Images against VLM agents' image tool sets, 15 agent systems, 90.7%/98.6% ASR") did not match arXiv:2611.17818 and was replaced with facts verified against the arXiv abstract page.

## Overview

This paper (Wenzhuo Xu, Zonghao Ying, Deyue Zhang, Dongdong Yang, Xiangzheng Zhang, Quanchen Zou; arXiv:2611.17818, 13 Nov 2026, cs.CR) shows that **requests which merely resemble normal user queries get past safety filters far more easily** than requests with obvious anomalous patterns — and weaponises that observation. The **Detail Guidance Attack (DGA)** uses an *auxiliary LLM* to construct detailed, innocuous-looking requests and interacts with the victim model in a **single turn**, achieving high attack success rates (above 95% in several evaluated settings under an automated judging criterion).

## Problem Statement

Jailbreak defenses increasingly rely on LLM-based input filters. The authors first examine **eight jailbreak methods against an LLM-based filter** and observe that benign-looking requests have higher pass rates, motivating the hypothesis that *resemblance to normal requests* — not just payload obfuscation — drives jailbreak success.

## Key Contribution

- Empirical grounding: eight studied jailbreaks against a filter show pass rate correlates with normalcy resemblance.
- **DGA framework**: an auxiliary LLM expands a harmful goal into a detailed, plausible, well-structured request; single-turn delivery; no multi-turn escalation needed.
- **Scale**: evaluated across **11 victim models and three datasets**.
- **Defense analysis**: a DGA-aware filter is evaluated; a **user study on everyday requests with ambiguous or dual-use intent** documents differing user expectations about whether models should respond — surfacing the false-positive/usability tension, with filter usability costs left unmeasured.

## Relevance to Our Domain

For agent platforms that gate tool calls behind intent classifiers: "looks like a normal request" is itself the attack surface. Detection must weigh content *and* the dual-use ambiguity problem — a filter strict enough to stop DGA risks blocking legitimate ambiguous requests, so defence-in-depth (least-privilege tools, human approval for high-risk actions) remains the answer. Pairs with our ReMA/SecMAS multi-agent security note.

## Related Defences and Follow-ups (added 2026-11-18, KB Zookeeper enrichment)

- **Peer-review track version:** "Indistinguishability from Benign Requests Enables Jailbreak Success" (OpenReview, forum id `WZr5q26MtG`) — same core thesis under review; check it for any post-review revisions to the ASR numbers.
- **Detection countermeasure line:** **ALERT** (arXiv:2601.03600) proposes *zero-shot jailbreak detection via internal discrepancy amplification* — detecting the gap between a request's benign surface and the model's internal response. This is the natural answer to DGA's core trick: if "normalcy resemblance" defeats content filters, defence must move from content to internal-state signals.
- **Timeline context:** DGA sits in the 2025–2026 shift from token-level obfuscation attacks to *intent-mimicry* attacks (see e.g. LochBot's LLM Jailbreak Timeline, https://lochbot.com/research/llm-jailbreak-timeline.html). Our defense-in-depth stance (least-privilege tools, human approval for high-risk actions) is the mitigation that does not degrade under this shift.

## References

- Paper: https://arxiv.org/abs/2611.17818
- OpenReview (peer-review track): https://openreview.net/forum?id=WZr5q26MtG
- ALERT defence paper: https://arxiv.org/abs/2601.03600
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17818
- Related: `explanation-rema-attack-securesmas-design.md`, `explanation-llm-inference-engine-exploits.md`
