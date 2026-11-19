---
title: 'Guarding the Kingdom of Skill-Based Agents in the AI Dynasty of Computation:
  Control-Flow Integrity for Agent Skills'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.24185
date: 2026-11-19
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Control-Flow Integrity for Agent Skills (SkillCFI)

## Overview
Agent skills move a program's control flow into **prompt text**: the LLM decides at runtime whether each step runs in reasoning, a tool call, or a script. The skill's control *skeleton* survives, but what is *enforceable* depends on where each step executes. SkillCFI (Ruan, Sun, Liu, Lin, Mao, Liang — NUS lineage) ports **Control-Flow Integrity** to skill-based agents: a compiler plus a deterministic runtime enforcer make the admitted execution trace follow a contract **whatever the model proposes**.

## Problem Statement
Two gaps make skill-based agents unsafe today:
1. **Allowlists are insufficient**: many violations (e.g., overwriting a file before validation) use only operations the skill legitimately requires — permission allowlists admit them.
2. **Regime migration defeats monitors**: a deviating or prompt-injected model can evade an agent-side monitor by moving execution to an unmediated channel — e.g., claiming a check passed, or running logic in an inline script the monitor can't see.

## Key Contribution
- **Compile-time confinement**: a compiler confines LLM interpretation to compile time, deriving **the agent's instructions and an executable contract from one and the same skill** — no LLM improvisation in the enforcement path.
- **Formal enforceability criterion**: enforces obligations whose evidence crosses the tool boundary; *rejects* skills whose mandatory obligation leaves nothing checkable.
- **Deterministic runtime enforcer**: admits a tool request only on **trusted evidence** and **refuses unmediated channels** (e.g., inline scripts), so admitted traces follow the contract regardless of what the model proposes.

## Results
- **Contract soundness**: across 8 self-written skills and 24 source mutations, **no compiled contract permits more than its source**.
- **Violation blocking**: in 770 agent sessions, SkillCFI **blocked all 240 violations before dispatch** — violations an operation allowlist admits. Normal tasks complete nearly as often as without enforcement.
- **Recovery UX**: listing the next legal steps in the refusal message raises recovery from **21% → 65%**.
- **Cost**: checking ≈ **2% of task time**; a compact command form cuts session slowdown from **1.32× → 1.08×**.
- **Ecosystem reality check**: **none of 53 public skills** was accepted as written; compiler diagnostics pointed to *interfaces* (not workflows) and guided 7 of them into enforceable contracts.

## Why It Matters
- Establishes that **where a step runs** is a security-relevant property of agent skills, and that evidence must be *trusted* (from the tool boundary), never self-reported by the model.
- The "public skills are not enforceable as written" finding implies skill ecosystems need a compilation/attestation layer before production use.
- Complements training-time defenses (PIPETTE-style adversarial training): SkillCFI is a **runtime architecture guarantee**, independent of model behavior.

## Related
- [[how-to-pipette-purple-team-prompt-injection-defense]] — training-time hardening; SkillCFI is the enforcement-time layer
- [[explanation-plain-data-indirect-injection]] — injection class that motivates model-agnostic enforcement

## References
- Paper: https://arxiv.org/abs/2611.24185
- Primary class: cs.CR
