---
title: 'Synapse: Optimizing Natural-Language Agent Skills through Program Repair'
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.20856
date: 2026-11-18
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Synapse: Optimizing Natural-Language Agent Skills through Program Repair

## Goal

Improve an LLM agent's **reusable natural-language skill** (its instruction file) by treating skill editing as **generate-and-validate program repair** — localizing which instruction caused a failure, proposing a typed edit, and validating against the tests the edit could break — instead of hand-tuning prompts or letting a model rewrite prose freely.

## Context: Why free-form skill editing underperforms

Execution feedback tells you an agent failed, but not *which instruction to edit*, *which related instructions matter*, or *which previously passing tasks an edit may break*. Free-form text rewriting screened only on failing tests therefore ships regressions. Synapse's answer: compile the skill into a **source-linked intermediate representation (SkIR)** so fault localization, mutation typing, and test selection follow the skill's structure — and every accepted patch maps back to a well-formed skill with untouched instructions preserved.

## Step-by-Step Procedure

1. **Compile the skill.** A deterministic compiler translates recognized skill constructs into **SkIR**, a source-linked IR, while leaving unrecognized requirements as text. Every IR node keeps a link to the source span it came from.
2. **Localize the fault.** Join **execution traces** with SkIR's **control-flow and dependence relations** to pinpoint the instruction(s) implicated in a failure — not just the task that failed.
3. **Propose typed mutations.** Generate candidate repairs as *typed* mutations over the IR rather than unconstrained prose rewrites.
4. **Select related repair tests.** Using the structural relations, screen in the tests an edit can affect — **including previously passing ones**. Under the one-hop-local execution assumption, the selected set includes every test an edit can affect (regression-complete, not just failure-targeted).
5. **Write back and recompile.** Each mutation is written back to its mapped source span and the skill recompiled; validation over the selected tests determines acceptance.
6. **Accept only well-formed outcomes.** Every accepted patch yields a well-formed skill and **preserves untargeted instruction spans** — the repair cannot drift unrelated parts of the skill.

## Verification (what the paper measured)

- **Task success-rate gains over SkillOpt**: DocVQA **+3.74–4.54 pp**, LiveMath **+2.40–4.00 pp**, across three execution models; Synapse beats Trace2Skill and SkillBoost in **all six settings**.
- **Ablation**: replacing SkIR-based repair and its test screening with constrained text editing screened only on failing tests **loses 2.40 and 2.67 pp** on DocVQA (two models) — the IR plus regression-aware screening is what pays.
- **Regression catch in the wild**: in two recorded repair runs, structural relations added tests for **23 of 37 patches**; in one repair, a control-flow-related test exposed a regression that coverage of the edited instruction alone missed.

## Pitfalls

- **Screening only on failing tests**: the ablation shows this is exactly what reintroduces regressions; always include related previously-passing tests.
- **Editing free-form text with a model directly**: without source-linked structure, fault localization and span-preserving write-back are impossible, and untargeted instructions drift.
- **Ignoring dependence relations**: an edit to instruction A can break tasks that never execute A directly but depend on it through control flow; the one-hop-local assumption is what makes the selected test set trustworthy.

## References

- Paper: https://arxiv.org/abs/2611.20856 (submitted 2026-11-16, cs.SE)
- Related: [[howto-maintainability-sensors-for-coding-agents]] — harness-side feedback that these skill repairs consume
- Related: [[howto-three-part-prompt-formula]] — authoring skills; Synapse is their program-repair lifecycle
