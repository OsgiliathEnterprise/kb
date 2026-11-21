---
title: 'From FIPS to FPGA with LLM Agents: Measuring What Tests and Reviews Miss in
  Post-Quantum Cryptographic Hardware'
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.25339
date: 2026-11-21
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# From FIPS to FPGA with LLM Agents: Measuring What Tests and Reviews Miss in Post-Quantum Cryptographic Hardware

## Overview
A step-by-step recipe — evolved during a real post-quantum design port — for making LLM-agent-generated RTL trustworthy. The core principle: never let agents validate their own work. Each stage of a seven-stage, verification-gated workflow only passes a gate if the gate itself has been demonstrated to fail on negative controls and fault mutants, and reviewer agents audit work before commit. Applied to porting an ML-KEM-768/ML-DSA-65 accelerator to a 300 MHz Zynq UltraScale+ key-custody card.

## Problem Statement
When LLM agents generate RTL *and* the tests and reviews that validate it, self-generated evidence is a weak foundation. Passing module tests can badly overstate verification strength, letting cryptographic flaws — especially key-custody flaws invisible to known-answer tests — reach silicon.

## Procedure (the verification-gated workflow, as measured)
1. **Generate RTL with agents per module**, keeping each module's scope small enough for review to be effective.
2. **Gate every stage on demonstrably fallible evidence**: a test gate counts only if shown able to fail — run it against negative controls and fault mutants before trusting a pass.
3. **Audit the evidence independently**: replay with tool-selected netlist mutants (not agent-chosen), replay known flaws, and add formal checks.
4. **Close test gaps from survivors**: use surviving mutants to derive specification-based tests (this raised the fresh-draw decapsulation kill rate from 48% to 74%).
5. **Scope LLM review to modules, not the whole design**: undirected whole-design review caught verifier flaws in only 3/6 and 1/6 pre-registered sessions; module-scoped review caught every known flaw in all 54 sessions.
6. **Formally check custody invariants**: even scoped review detected planted key-custody flaws in only 3/20 sessions, whereas formal checks flagged every one.
7. **Commit only after reviewer-agent audit** of the stage's evidence.

## Evidence
- Port produced byte-exact results on board for all six operations; passed all 85 interface-applicable NIST ACVP cases (of 285) and 484 ML-DSA known answers.
- Existing simulation gates killed only 76% of 399 tool-selected netlist mutants across three RTL modules — proof that agent-written passing tests are insufficient alone.
- Pre-registered single-model replays on flaws invisible to known-answer tests produced the scoping and formal-check findings above.

## Checklist / Decision Rules
- Author-independent mutants for test gates: **required**
- Module-level scoping for LLM review: **required** (whole-design review is unreliable)
- Formal checks for custody/security invariants: **required** (LLM review cannot substitute)

## Relevance to Our Domain
The strongest available playbook for agentic hardware/security-critical codegen: the three rules (external mutants, scoped review, formal invariants) transfer directly to AI-generated security code and CI gating for agent-produced artifacts generally.

## References
- Paper: https://arxiv.org/abs/2611.25339
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25339
