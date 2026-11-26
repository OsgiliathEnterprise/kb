---
title: Attack Policy Selection can Mislead Monitor Evaluators
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.34934
date: 2026-11-25
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Attack Policy Selection can Mislead Monitor Evaluators
**Authors:** Charlie Griffin, Oliver Makins, Asa Cooper Stickland, Alessandro Abate, Yarin Gal, Abby D'Cruz, Xander Davies

## Overview
AI monitors are classifiers that flag dangerous agentic behaviour, and they are evaluated on transcripts produced by attack policies acting as proxies for dangerous behaviour at deployment. This paper shows, in a case study replicating an established safety-monitor evaluation protocol (the ex-production OpenAI monitor), that the measured false-negative rate (FNR) is **highly sensitive to both the method used to generate attack policies and the level of optimization within it** — so the single FNR number a study reports can swing by an order of magnitude depending on choices that have nothing to do with the monitor itself.

## Problem Statement
Post-training reduces misaligned behaviour without eliminating it, so frontier labs monitor models for safety-relevant deviations and need confidence in monitor reliability against adaptive attackers. Evaluation pipelines typically report one FNR figure obtained from selected attack policies; whether those figures support deployment conclusions has not been examined.

## Key Contribution
- **Method- and optimization-sensitivity of FNR**: in the case study, the measured FNR ranges from **0.5% to 20.8% across optimization levels of a single method (reinforcement learning)**, and from **6.4% to 23.0% across methods** (optimized prompting versus transcript editing) at their best observed optimization level.
- **Proxy-transfer setup**: all attack policies were developed only against proxy monitors; all reported results show the attacks transfer to the held-out GPT-5.4 target monitor — so proxy-based red-teaming worked here, yet the resulting FNR figures remain method-dependent.
- **Proxy artifacts**: some attack-policy transcripts contain visible artifacts — e.g. "side task" reasoning that was not included in the monitor's instructions — that can change the monitor's verdict, a known concern for proxy monitor design.
- **Legitimacy argument**: interpreting any evaluation result as evidence about deployment requires an argument that the proxy is legitimate for the target population; the paper shows this is an open problem and that evaluations using only basic attack methods risk providing false confidence.

## Technical Approach
Attack policies are produced by different generation methods (RL optimization at various levels, optimized prompting, transcript editing) and measured against the monitor at matched settings; the spread of FNR across methods and optimization levels, plus held-out target-monitor transfer, separates genuine monitor weakness from artifacts of how the attacks were manufactured.

## Relevance to Our Domain
For anyone building agent oversight or red-teaming pipelines: a single monitor FNR from a chosen attack-generation recipe is an *artifact-dependent estimate*, not a worst-case guarantee. When consuming or reporting monitor reliability, demand the method, the optimization level, and the range across both; when designing eval harnesses, sweep attack-generation methods and check for proxy artifacts leaking into transcripts.

## References
- Paper: https://arxiv.org/abs/2611.34934
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34934
