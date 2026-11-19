---
title: 'The Limit Is in the Input, Not the Model: State-Dependent Command Safety in
  Natural-Language Interfaces to Industrial Controllers'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.24682
date: '2026-11-20'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# The Limit Is in the Input, Not the Model: State-Dependent Command Safety in Natural-Language Interfaces to Industrial Controllers

## Overview
This paper tests an intuition that matters wherever operators want to speak commands at machines: a fluent natural-language interface to a programmable logic controller (PLC) is unsafe not because the model is bad, but because **command safety depends on the machine's state**, which the model never sees. A state-blind interface passes ordinary input-level safety screening yet still emits hazardous commands. The fix demonstrated is an "answerability audit" — a pre-deployment procedure that turns a dangerous interface into a deployable one.

## Problem Statement
Domain experts in industrial settings want conversational control ("ramp setpoint to 80") while accepting that LLM output needs review. Operators, having supervised an assistant for a while, develop expectations. If the assistant fails silently — returning a wrong-but-plausible answer, or misreading the plant state — those expectations break without warning. This is a **trust calibration** problem, not a reliability problem, and it is amplified when the model is an edge case of a much larger one.

## How-to: run an answerability audit on an NL industrial interface
1. **Instrument an offline digital twin** of the industrial process; model the state machine explicitly.
2. **Build a command corpus** spanning ordinary and hazardous commands across many controller states (here: 433 commands across nine model instances).
3. **Probe state identifiability**: determine whether the *model's input* (the prompt) contains enough information to identify the controller state. If not, the model *cannot* be state-aware no matter how well it is prompted.
4. **Run a five-tier answerability test**: for each command, classify whether the interface (a) answers correctly, (b) asks for the missing state, (c) refuses appropriately, (d) answers wrongly, or (e) confidently hallucinates.
5. **Separate the failure modes**: input-level screening catches "should this command exist at all"; the audit catches state-dependent hazards screening misses.
6. **Fix by construction**: add state grounding to the interface (feed live controller state into the prompt), and gate every command with **PLC-side interlocks** — the controller enforces safety regardless of what the interface proposes.
7. **Re-run the audit**; deploy only when hazardous-command behavior degrades to asking/refusing.

## Key Results
- A state-blind model passed all standard input-level safety screening yet produced hazardous commands when plant conditions were dangerous — the vulnerability lives at the **interface level**, not inside the model.
- The digital-twin probe showed the model's input **structurally lacks information needed to identify controller state**: this is a limit of the input, not of model quality.
- The audited interface (state grounding + PLC-side interlocks + explicit answerability) degrades safely into asking or refusing on hazardous commands.

## Relevance to Our Domain
Generalizes beyond OT: any LLM agent acting on stateful systems (kubernetes ops, databases, pipelines) inherits the same trap — input-level guardrails cannot validate state-dependent actions. The audit procedure is directly reusable as an agent pre-deployment gate in the KB's agent-security practice: check whether tool-call prompts carry enough state to decide safety, interlock at the enforcement layer, and test the five answerability tiers.

## References
- Paper: https://arxiv.org/abs/2611.24682
- Related: [[explanation-ai-agents-manipulation-attack-surface]]
