---
title: SoK — The Attack and Defense Landscape of Mobile On-device AI (MoAI) Systems
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2607.00362
date: 2026-11-15
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# SoK — The Attack and Defense Landscape of Mobile On-device AI (MoAI) Systems

## Overview
Mobile on-device AI (MoAI) systems integrate locally deployed models with conventional mobile software — delivering privacy-preserving, low-latency, offline-capable intelligence, but relocating the model from a protected cloud boundary into the device's storage and app ecosystem. This SoK is the first comprehensive systematization of knowledge (Sok) of MoAI security: its security pillars, the attack landscape, the defense landscape, and the unresolved gaps.

## Problem Statement
Cloud LLM security literature assumes the model lives behind a service boundary. On-device, the model weights, caches and pipelines become *local files* in a hostile multi-app environment — extractable, patchable, swappable. Attack and defense results were scattered across mobile security, ML security and LLM security silos with no unifying frame.

## Key Contributions
- **Security pillars for MoAI**: the core properties on-device AI must preserve (model integrity/confidentiality, inference correctness, user-data protection at the local boundary).
- **Attack landscape**: a systematic taxonomy of threats arising from local model storage and mobile integration — extraction, tampering/backdooring of on-device weights, pipeline abuse, and attacks on the mobile-software/AI interface.
- **Defense landscape**: the corresponding countermeasure families (model protection/obfuscation, integrity verification, secure execution, platform hardening).
- **Gap analysis**: explicit identification of under-attacked and under-defended regions, plus a research agenda for the area.
- **Companion resource**: curated repository https://github.com/Jinxhy/Awesome-MoAI-Security.

## Technical Approach
Systematization methodology: collect MoAI attack and defense literature across ML-security, mobile-security and LLM-security venues; organize along a consistent axis (asset → threat actor/capability → attack technique → defense countermeasure → residual gap); evaluate coverage to expose asymmetries (well-attacked vs. undefended quadrants).

## Results
- First unified framework for MoAI security — pillars + dual landscape + gaps.
- Central structural finding: defenses lag attacks wherever the threat involves the *mobile-software integration layer* (the interface between local apps and the local model), rather than the model math itself.

## Relevance
The lookup table for on-device AI threat modeling — use it as the coverage checklist when auditing phone-side agents or edge deployments. Natural pair with agent-perception attacks (2607.00333) and local-LLM confidentiality failures in this topic.

## Sources
- arXiv: https://arxiv.org/abs/2607.00362
- Awesome list: https://github.com/Jinxhy/Awesome-MoAI-Security
- Related: [[explanation-local-llm-confidentiality-boundary-failures]]
