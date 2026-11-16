---
title: DGA Jailbreak — Weaponising Image Tool Sets Against VLM Agents
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
# DGA Jailbreak: Adversarial Images from Agent Image Tool Sets Break VLM Agent Guardrails

## Overview

This paper exposes a jailbreak class nobody had studied before: attacking VLM-based agents *through the image-generation tools they already have*. DGA (Dynamic Generation of Adversarial Images) has the agent itself produce adversarial images — with varied visual patterns — and feeds them back as if they were external content. Because the images are produced locally by the agent's own tool chain, they bypass the input guardrails that assume external content is the threat vector. Accepted at a top venue, evaluated across 15 agent systems.

## Problem Statement

Agentic jailbreak research has focused on text. But modern VLM agents (Claude/GPT/Gemini via API, or open-source stacks) routinely carry image tools: generation, editing, screenshot ingestion. Those tools create a new, unguarded path for adversarial visual content to enter the agent's context.

## Key Contribution

- First systematic study of **image tool-set jailbreaks** for VLM agents.
- **DGA method**: prompt the agent's image tool to dynamically generate adversarial images containing harmful content rendered as text/visual patterns, then route those images back through the agent's vision pipeline — a self-reinforcing loop that starts from a single short prompt.
- **Empirical scale**: evaluated on 15 agent systems spanning proprietary APIs and open-source stacks.
- **Defence analysis**: shows existing jailbreak defences (input filters, alignment, fine-tuning-based defences) are largely ineffective against this vector.

## Technical Approach

Starting from one user prompt, the agent is induced to call its image-generation tool to synthesise an adversarial image; the image embeds harmful instructions in visual form (rendered text, steganographic-like patterns). The agent then processes its own generated image as a new observation, which carries the jailbreak payload past text-oriented guardrails. Because the image is regenerated dynamically each attempt, static blocklists and perceptual-hash filters cannot keep up.

## Results

- **90.7% attack success rate** on agents built over proprietary APIs (Claude, GPT, Gemini).
- **98.6% ASR** on open-source agent stacks.
- Standard defences do not meaningfully reduce success rates.

## Relevance to Our Domain

Concrete, actionable threat for anyone deploying tool-equipped LLM/VLM agents: treat *agent-generated* content as untrusted input on re-entry. Defence implications belong in our agent-infrastructure hardening notes — mediate every tool output (images included) through the same guardrail pipeline as external input, and consider disabling image tools unless required.

## References

- Paper: https://arxiv.org/abs/2611.17818
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17818
- Related: `explanation-rema-attack-securesmas-design.md`, `explanation-llm-inference-engine-exploits.md`
