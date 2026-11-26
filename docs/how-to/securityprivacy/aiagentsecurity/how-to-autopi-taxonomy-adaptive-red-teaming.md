---
title: 'AutoPI: Taxonomy-Guided Adaptive Red Teaming for Prompt Injection in LLM Agents'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.24313
date: 2026-11-19
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# AutoPI: Taxonomy-Guided Adaptive Red Teaming for Prompt Injection in LLM Agents

## Overview
AutoPI reframes adaptive red teaming of LLM agents: instead of maximizing attack success rate (ASR) alone, it maximizes *technique coverage* — the number of *distinct* prompt-injection techniques that actually break a target. Built on the PIAtlas taxonomy, it is black-box, training-free, and drops into existing agent-security benchmarks in place of fixed attack templates.

## Problem Statement
Most adaptive red teamers optimize ASR — how often a target breaks — but a handful of repeatedly successful techniques can produce a high ASR while whole regions of the attack taxonomy stay untested. Hardening pipelines trained on those narrow attack sets inherit the blind spots. The community now agrees robustness must be measured against adaptive attackers, but ASR alone does not measure attack *diversity*.

## Key Contributions
- An adaptive red teamer (AutoPI) that uses a prompt-injection taxonomy (PIAtlas) both to guide search and to measure coverage at class, technique, and sub-technique levels.
- A per-scenario procedure: an attacker LLM writes an injection for **every** taxonomy sub-technique, then reworks the failing ones using feedback from an LLM judge.
- New evaluation metric alongside ASR: technique coverage = fraction of taxonomy classes/techniques/sub-techniques yielding at least one successful injection.
- Evaluation on AgentDojo and IPI Arena against open-weight and proprietary models; code and generated attacks released for reproducible, coverage-aware evaluation.

## How-to: run coverage-aware adaptive red teaming
1. **Pick a taxonomy.** Load PIAtlas (six classes organized by subversion mechanism, with techniques and sub-techniques).
2. **For each target scenario**, prompt the attacker LLM to write one injection per sub-technique — not a handful of favorite templates.
3. **Score each injection** with an LLM judge against the scenario's success criterion.
4. **Iterate on failures only**: feed judge feedback back to the attacker LLM to rewrite injections that failed, per sub-technique.
5. **Report two numbers**: ASR *and* technique coverage (classes, techniques, sub-techniques with ≥1 successful injection).
6. **Plug into existing benchmarks** (AgentDojo, IPI Arena) as a drop-in replacement for fixed attack templates; re-run whenever the taxonomy evolves.

## Results
- Against Qwen3.6-35B on AgentDojo: successful injections found in **all six taxonomy classes** and >90% of techniques.
- Against Claude Haiku 5.5 (most robust target tested): **20–50% higher ASR** and **25–400% higher class-level coverage** than recent state-of-the-art adaptive red teamers, with no training required.

## Relevance to Our Domain
Directly actionable for agent-security evaluation in DevSecOps pipelines: coverage-aware red teaming exposes hardening blind spots that ASR-only evaluations hide. Complements the PIAtlas taxonomy note and the PIPETTE purple-teaming note already in the KB.

## References
- Paper: https://arxiv.org/abs/2611.24313
- Related: [[reference-piatlas-prompt-injection-attack-taxonomy]], [[how-to-pipette-purple-team-prompt-injection-defense]]
