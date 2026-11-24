---
title: 'Conartist: Adaptive Agentic Red-Teaming of Computer-Using Agents against Multi-Step
  Prompt Injection'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.29977
date: '2026-11-24'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# Conartist: Adaptive Agentic Red-Teaming of Computer-Using Agents against Multi-Step Prompt Injection

## Overview
Agent harnesses protect computer-using agents (CUAs) with two core mechanisms: **consistency checking** (the agent must not deviate from the user's legitimate objective) and **risk auditing** (high-risk operations are proactively examined). Conartist shows both are exploitable — consistency checks can be bypassed by making malicious actions *look logically consistent* with the task, and the auditing process itself introduces new exploitable actions. The paper turns this into a **cascaded adaptive prompt-injection** red-teaming procedure.

## When to Use
Security-assessing a CUA/agent harness that enforces goal-consistency and pre-execution risk audits against multi-step prompt injection arriving through the environment.

## Procedure (the two-stage cascade, as proposed)
1. **Stage 1 — Goal pollution.** Construct malicious operations wrapped in **deceptive causal dependencies** with the legitimate user objective, so each attack step appears to be a natural continuation of task execution. Progressively embed attack steps into the legitimate task workflow to pass consistency checking.
2. **Probe the auditor.** Task-coupled attacks still hit risk auditing — so run **controlled attack exploration** and collect the harness's **security-auditing feedback** (what it flags, what it lets through, what new actions auditing itself triggers).
3. **Stage 2 — Adaptive refinement.** Mine the feedback for **exploitable auditing patterns**, then refine the deception strategy to either **avoid triggering the audit** or **induce the audit itself to perform high-risk operations** (the auditor's own actions become the attack surface).
4. **Score** on tool-use and GUI benchmarks across multiple backbone models; compare against SOTA static injection.

## Results to Expect
- **32.12 % attack success** on a 576-instance tool-use benchmark and **66.67 %** on the Reddit GUI benchmark, across **five backbone models** — beating the prior SOTA attack by **+14.41** and **+29.17** points respectively.
- Analysis of **Openclaw** (one of the most popular agents) yields **seven realistic exploitable attack patterns**, the systematic conclusion being that mechanisms designed to prevent malicious actions can themselves be manipulated to facilitate them.

## Checklist Before Signing Off
- [ ] Attacks embedded as causally-consistent task steps (defeats consistency checking, not just filters)
- [ ] Auditing feedback collected from controlled exploration and mined for patterns
- [ ] At least one attempt to make the auditor itself execute a high-risk action
- [ ] Multi-step (cascaded) payloads, not single-shot injection

## References
- Paper: https://arxiv.org/abs/2611.29977
- Related in KB: CUA security taxonomy and Epistemic Guard runtime-verification notes under security-privacy/ai-agent-security
