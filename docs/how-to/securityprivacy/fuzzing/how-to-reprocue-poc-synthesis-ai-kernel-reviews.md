---
title: 'ReproCue: Reproducer Synthesis for AI-Reported Bugs in the Linux Kernel'
diataxis: How-to Guide
domain: security-privacy
topic: fuzzing
source: arXiv
source_url: https://arxiv.org/abs/2611.34142
date: 2026-11-25
keywords:
- knowledge-base
- fuzzing
- security-privacy
- how-to
---
# ReproCue: Reproducer Synthesis for AI-Reported Bugs in the Linux Kernel
**Authors:** Xiao Wu, Yunbo Ni, Hao Sun, Yuanyuan Yuan, Shaohua Li

## Overview
Agentic review systems now flag suspected bugs in Linux kernel patches, but most reports go unanswered because maintainers need a runnable proof-of-concept before acting. ReproCue is a PoC-synthesis approach tailored to AI-generated kernel bug reports: it learns reusable reproduction knowledge per subsystem and applies it to new reports, dramatically outperforming both agentic reproducer tools and state-of-the-art directed fuzzers.

## Problem Statement
AI review reports are text-only; without an executable reproducer, maintainers cannot validate or fix them. Generic PoC-synthesis agents stall on the same wall: reconstructing the execution context (call path, configuration, environment) the report omitted.

## How-to: reproduce AI-reported kernel bugs with ReproCue
1. **Replay historical kernel bugs per subsystem.** For each kernel subsystem, replay known bugs whose successful reproductions exist.
2. **Learn one reproduction FSM per subsystem.** From the successful runs, distill a reproduction finite-state machine that records the reproduction procedure and, at each step, the requirements that must hold — this is the reusable knowledge extracted from history.
3. **For a new AI review, follow the matching subsystem's FSM.** Use the FSM to guide synthesizing a PoC program for the reported defect.
4. **Adapt from execution feedback.** When an execution failure indicates what is missing, adjust the PoC *and* its running environment accordingly, iterating until the bug reproduces.

## Results (reported in the paper)
- On 100 recent AI-generated reviews, ReproCue generated PoCs for **49** of them — versus **10** for current agentic reproducers and **9** for the state-of-the-art directed fuzzer.
- Linux kernel maintainers confirmed **69.4%** of ReproCue's generated PoCs, compared with **9.3%** for Sashiko, a strong text-only review baseline.

## Verification
Confirm a synthesized PoC by executing it in the target kernel environment and checking the reported fault manifests; cross-validate by maintainer-style triage (the paper's own acceptance metric).

## Relevance to Our Domain
Two takeaways for AI-assisted development and vulnerability management: (1) AI review output must carry reproduction context or it creates triage debt — require PoCs or context fields in agent review pipelines; (2) learning per-subsystem reproduction FSMs from historical successful repros, then adapting via execution feedback, is a reusable pattern for any reproducer-synthesis or patch-verification agent, not just kernel work.

## References
- Paper: https://arxiv.org/abs/2611.34142
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34142
