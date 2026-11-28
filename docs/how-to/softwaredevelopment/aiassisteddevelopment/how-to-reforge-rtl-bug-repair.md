---
title: 'REFORGE: LLM-Assisted RTL Bug Repair with Structured Context and Verification
  Feedback'
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.33748
date: 2026-11-25
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# REFORGE: LLM-Assisted RTL Bug Repair with Structured Context and Verification Feedback

## Overview
Hossain et al. (arXiv:2611.33748, submitted 2026-11-25, accepted at DATE 2027) present REFORGE, described as the first LLM-assisted RTL (register-transfer level) repair framework that **accumulates structured repair evidence across iterations** so fixes satisfy functionality, behavioral equivalence, security, and cost simultaneously — rather than reporting a single, unverifiable repair rate.

## Problem Statement
LLMs can write and repair RTL, but a passing compile or testbench run proves neither defect removal, behavioral preservation, security, nor synthesizability. Prior LLM-based RTL repair work reports one repair-rate number without retaining separate evidence per property, blocking reproducible comparison and integration into real hardware design flows.

## How-To: Run a Verification-Guided LLM Repair Loop
The REFORGE pipeline, backend-independent:

1. **Profile the buggy RTL** to build structured context.
2. **Identify structural and security-relevant features** of the design.
3. **Localize the failing behavior** from the profile.
4. **Generate complete RTL repair variants** using verification-guided diagnosis (not patch snippets).
5. **Check every variant through the full evidence stack:**
   - syntax checking,
   - simulation,
   - formal analysis,
   - off-trigger preservation (unchanged behavior outside the defect),
   - security re-scan,
   - synthesis-based power, performance, and area (PPA) analysis.
6. **Accumulate evidence records across iterations** and only accept variants satisfying all applicable objectives.

## Results
- **288 runs** across three LLM backends and three benchmark suites.
- On **CirFix**, the structured context + diagnosis raises runs delivering a *checked* repair from **32/63 to 51/63**.
- Every configuration repairs the **Hack@DAC OpenTitan** defect.
- Evidence records expose the gap between "looks repaired" and "is repaired": a **testbench-only criterion reports 3.9× more repairs** than the full applicable check set; security-clean outputs can lack functional verification; and distinct RTL repairs can implement equivalent hardware.

## Relevance to Our Domain
REFORGE generalizes beyond hardware: it is a blueprint for any LLM-assisted code-repair flow where a single pass/fail signal is misleading. The core lesson for AI-assisted development — demand multi-stage, per-property verification evidence, and keep it as first-class artifacts — applies directly to our coding-agent review gates.

## References
- Paper: https://arxiv.org/abs/2611.33748
