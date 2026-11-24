---
title: 'AgentBouncer: Defending Software Engineering Agents via Dynamic System-Call
  Mediation'
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.30621
date: '2026-11-24'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# How to Defend SE Coding Agents at Runtime — the AgentBouncer System-Call Mediation Recipe

## Objective
Prevent a software-engineering agent (one that reads/writes files, runs commands, downloads resources) from carrying out malicious actions delivered via prompt injection, malicious tools, or supply-chain compromise — without breaking its ability to complete legitimate tasks.

## Why Trajectory Analysis Alone Fails
 defenses that watch the initial prompt and the sequence of tool calls see only the agent's *intent*, not what the environment actually executes. A tool call that looks benign at the trajectory level can still trigger dangerous filesystem, network, or process activity. The enforcement point must be **the system calls themselves**.

## Procedure (AgentBouncer's Design as a Recipe)
1. **Intercept at the syscall boundary.** Mediate every system call triggered by the agent's tool calls; deny the ones judged unsafe. This observes actual executed actions, not just planned tool calls.
2. **Judge on two axes with an LLM arbiter.** Score each syscall for *necessity* and *safety* with respect to the current task:
   - Unsafe → deny.
   - The **less necessary** a syscall appears, the **higher the arbiter's required confidence** in its safety before allowing it. Low-necessity + uncertain = deny.
3. **Control the overhead.** Do not call the LLM arbiter on every syscall:
   - preseed **policy rules** for common, unambiguous calls;
   - use **hierarchy-aware caching** so repeated/closely-related decisions reuse prior verdicts;
   - invoke the arbiter only for genuinely key decisions.

## Validation Setup and Results (from the paper)
- Dataset: **340 attacks** on the development environment across **four attack vectors**, combined with benign issue-resolution tasks from **SWE-bench Verified**.
- Attack success rate: **99.41% (unsupervised) → 10.59%**, i.e. **18.23–73.53 percentage points lower** than competitive state-of-the-art defenses.
- Benign impact: only **0.25% of benign tool calls** wrongly denied — task success preserved.
- Cost per benign task: **+47 seconds** and **$0.0036** in LLM cost; the closest existing runtime defense costs **4.5× more time and 9.6× more**.

## When to Use This Pattern
- Coding-agent platforms that execute arbitrary shell/file operations in developer or CI environments.
- Complements (does not replace) prompt/tool-level defenses: it is a **last line of defense at the OS interface**, catching what trajectory monitors miss.
- The necessity-scaled safety bar is a reusable idea: gate any risky action by "how badly does the current task need this?" before demanding high-confidence safety evidence.

## Relevance to Our Domain
Fits the KB's ai-coding-agents and DevSecOps coverage as a concrete runtime-hardening procedure for agentic development environments — pairs with the KB's notes on coding-agent benchmarks and agent sandboxing.

## References
- Paper: https://arxiv.org/abs/2611.30621 (cs.CR, cs.MA, cs.SE, submitted 2026-11-23)
- PDF: https://arxiv.org/pdf/2611.30621
