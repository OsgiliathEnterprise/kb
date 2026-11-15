---
title: AI Sees What You Don't — Two New Attack Surfaces in Third-Party VLM Mobile
  Agents
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2607.00333
date: 2026-11-15
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# AI Sees What You Don't — Two New Attack Surfaces in Third-Party VLM Mobile Agents

## Overview
Third-party smartphone agents built on vision-language models are high-privilege decision-makers: they *see* the device through screenshots and *act* via VLM reasoning. This paper argues that the very interface transformation they perform — environment state → pixels → actions — creates attack surfaces that do not exist for ordinary apps, and demonstrates them with seven working attacks.

## Problem Statement
Android's security model protects apps from each other under the assumption that interaction goes through declared APIs and permissions. A VLM agent breaks that assumption: it reads arbitrary screen content as images and drives other apps and the OS as a human surrogate. Nothing in the permission model reasons about "what the model perceives" or "who can touch the perception-to-action pipeline."

## Key Contributions
- **Two novel attack surfaces**, derived from what distinguishes agent apps from general apps:
  1. **Screen Perception Attack Surface** — exploits the gap between human vision and machine vision (content invisible to users but legible to the VLM).
  2. **Misused Channel Attack Surface** — intercepts or manipulates the agent's execution pipeline (screenshot capture, action dispatch, host links).
- **Seven concrete attacks** spanning both surfaces: subliminal text injection, invisible pixel-zone exploitation, screenshot tampering, host-PC command injection, among others.
- **Evaluation on five popular mobile agent frameworks**: a malicious app — with **no special permissions** — hijacks agent actions and achieves **arbitrary command execution**, while the screen stays visually indistinguishable to the user.
- Framing: a *fundamental trust mismatch* in autonomous agent design; the authors call for perception-aware security models on multi-tenant platforms.

## Technical Approach
Characterise how agent apps interact with the environment (perceive via screen capture, act via synthesized input/bridges) versus general apps (intents, IPC, permissions); enumerate where each step converts trusted data into untrusted media; then instantiate attacks at each seam — rendered-but-invisible content poisoning perception, tampered screenshots lying about state, and abused host-PC channels (e.g., debugging bridges) as covert command paths.

## Results
- All five evaluated frameworks compromised; hijacked actions and arbitrary command execution achieved without any privilege permissions.
- Attacks remain visually undetectable to the user during execution.

## Relevance
Mobile agents are shipping as consumer products; this is the canonical threat model for them. For agent-infrastructure and security coverage: treat screen perception as an untrusted input channel and every capture/dispatch mechanism as part of the TCB. Complements prompt-injection taxonomies, which mostly assume text channels, not pixel ones.

## Sources
- arXiv: https://arxiv.org/abs/2607.00333 (v2)
- Related: [[reference-piatlas-prompt-injection-attack-taxonomy]], [[explanation-reversible-image-tokenization-vlm-security]]
