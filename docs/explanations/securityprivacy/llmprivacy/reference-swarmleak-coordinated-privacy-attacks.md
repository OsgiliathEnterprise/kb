---
title: 'SwarmLeak: Does Coordination Improve Privacy Attacks on LLM Agents?'
diataxis: Explanation
domain: security-privacy
topic: llm-privacy
source: arXiv
source_url: https://arxiv.org/abs/2611.31791
date: 2026-11-24
keywords:
- knowledge-base
- llm-privacy
- security-privacy
- explanations
---
# SwarmLeak: Does Coordination Improve Privacy Attacks on LLM Agents?

**Authors:** Asma Farajidizaji, Vyas Raina, Vatsal Raina, Ivaxi Sheth

## Overview
SwarmLeak is a red-teaming dataset and study asking whether adversarial *coordination* improves privacy attacks on LLM agents. The dataset comprises **24 synthetic group-chat scenarios** across healthcare, law, finance and software engineering, where an attacker posing as a colleague tries to elicit protected information from victim agents that post protected fields despite an explicit confidentiality policy. Headline finding: **swarms show no advantage over single attackers at matched token budgets** — the dominant variable is the *victim model*, not attack sophistication.

## Problem Statement
Agents increasingly operate in multi-party conversations where they may be exposed to confidential information under explicit confidentiality policies. Whether mounting an organized multi-agent ("swarm") attack buys an attacker anything over a single determined attacker — and what actually drives leakage — had not been isolated under matched budgets.

## Reference: Dataset & Protocol Specifications
| Property | Value |
|---|---|
| Scenarios | **24 synthetic group-chat scenarios** (healthcare, law, finance, software engineering) |
| Attacker role | Poses as a colleague; victims post protected fields despite an explicit confidentiality policy |
| Attacking model | **GLM 5.2**, via **7 conversational strategies** |
| Victims | **5 victim models** |
| Swarm condition | 1 attacker vs. a swarm of **4 attackers sharing a private channel** |
| Budget | Matched **200,000-token budget** including coordination messages |

## Results
- **Swarm shows no advantage**: across all five victims the single attacker matches or exceeds the swarm; leak rates differ by at most **14.3 percentage points**.
- **The victim is the dominant variable**: changing the victim shifts the leak rate from **0% to 99.4%**.
- On the two most vulnerable models nearly every run leaks in either condition, but the single attacker exposes more of the record at first disclosure (**85.4% vs 68.1%** of protected fields on Nemotron 3.5 Lightning).
- **Four of five victims leaked** despite the explicit confidentiality policy.
- GLM 5.2 retrieved protected data in **64.3%** of individual-attack runs yet leaked it in only **0.6%** — retrieval is not disclosure.

## Relevance to Our Domain
Two actionable triage insights for agentic security programs: (1) at matched budgets, bigger red-team *swarms* are not automatically stronger — effort should go into strategy coverage and victim-model hardening rather than attacker headcount; (2) policy text ("do not disclose") is weakly protective (4/5 victims leaked), while the gap between retrieval (64.3%) and disclosure (0.6%) shows the final generation step is a distinct, defensible choke point. Use the 24-scenario harness as a pre-deployment eval gate for any group-chat or multi-party agent.

## References
- Paper: https://arxiv.org/abs/2611.31791
- Related: security-privacy/llm-privacy/explanation-secretagent-multi-agent-privacy-vs-vlm.md
- Related: security-privacy/llm-privacy/explanation-gapleak-web-agent-disclosure-gap.md
