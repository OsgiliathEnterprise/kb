---
title: 'ParseGap: Testing What Coding Agents Authorize and What Shells Execute'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.29546
date: '2026-11-24'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# ParseGap: Testing What Coding Agents Authorize and What Shells Execute

## Overview
LLM coding agents authorize shell commands by **parsing the command string against a policy**, then handing the **raw string** to a system shell. The gate and the executor are two different interpreters — and ParseGap proves they disagree. It is a differential-testing framework that runs each command through an **unmodified vendor checker plus GNU Bash 5.2** in an isolated container, flagging a violation whenever a *policy-approved* command produces policy-violating runtime effects.

## Findings: 17 Root Causes Across 8 Production Coding Agents
The divergences cluster at **three boundaries**:
1. **Parse** — a defect in upstream **tree-sitter-bash** hides a *second command* from the checker used by **Mistral Vibe and Gemini CLI**: `cmd1 ; cmd2` can be adjudicated on cmd1 only, while Bash runs both.
2. **Utility** — every checker tested permits **read-only-labelled binaries whose arguments write files or launch programs** (9–47 of 55 such cases permitted).
3. **Confinement** — an allow-rule in **OpenAI Codex CLI disables its own read-only OS sandbox**, so approved commands escape confinement.

Live trials across two frontier models triggered policy violations in **all 16 agent-model pairs** (14 of 16 under the agents' own configured restrictions).

## The Fix: ShellPlan (single-interpretation dispatch)
Rather than patching each checker, ShellPlan eliminates the second interpretation entirely:
- Compiles a **strict Bash subset once** into a **typed execution plan**.
- Validates utility arguments against **positive capability specifications** (allowlists of effects, not denylists of strings).
- Dispatches approved plans **directly via `execve` — no shell involved**, so there is no separate shell re-interpretation to diverge from.
- Formally proven **single-interpretation dispatch** under audited assumptions, with bounds on programs and files touched.

**Security/utility numbers:** admitted **0/4,174 active attacks** across six static suites; **0/90 hits** in a ten-model agent benchmark (vs 62/90 unguarded) at **1.28 ms median gate latency**; preserves **36/36 (100 %)** frontier standard-deviation completion (74/100 overall); **0/348 external over-allows** outside modeled exceptions.

## Why It Matters (Explanation)
The generalizable failure mode: any safety gate that judges a *model* of execution while a real interpreter performs the execution inherits every parse difference between model and reality — parser bugs, utility semantics, sandbox interactions. Testing the gate against ground-truth execution (differential testing with unmodified vendor checkers) is the discovery method; eliminating the second interpreter (`execve` of typed plans) is the durable fix. For agentic coding tooling, "what the policy checker saw" must be provably "what ran", or the allowlist is theatre.

## References
- Paper: https://arxiv.org/abs/2611.29546
- Related in KB: `explanation-markdown-is-not-a-firewall.md` (rules vs gates), coding-agent sandbox notes under developer-tools-practices/ai-coding-agents
