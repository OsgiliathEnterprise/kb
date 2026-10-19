---
title: 'INFUSE: A Unified Surface Benchmark for Indirect Prompt Injection in Agentic
  Systems'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: 'arXiv: INFUSE: A Unified Surface Benchmark for Indirect Prompt Injection
  in Agentic Systems (arXiv:2610.20776)'
source_url: https://arxiv.org/abs/2610.20776
date: 2026-10-18
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# INFUSE: Unified Surface Benchmark for Indirect Prompt Injection in Agentic Systems

## Overview

INFUSE (cs.CR / cs.AI, 2026) is a benchmark for **indirect prompt injection (IPI)** against agentic systems — the attack where malicious instructions hide in content the agent processes (web pages, emails, documents, tool outputs) rather than in the user's direct prompt. Existing IPI evaluations are fragmented across different tasks, injection surfaces, and attack styles, making cross-study comparison nearly impossible. INFUSE unifies them: one task suite, one attack-scenario taxonomy, and one trajectory-level measurement protocol across 19 LLMs.

## Specification

| Attribute | Value |
|-----------|-------|
| Agentic tasks | 40 |
| Attack scenarios | 56 |
| Threat categories | 5 |
| LLMs evaluated | 19 |
| Adversarial trajectories generated | 41,824 |
| Mean attack success rate (ASR) | 19.6% |
| ASR before prompt hardening | 58.2% |
| ASR after prompt hardening | 14.3% |
| Semantic Scholar citation count | 0 (as of 2026-10-18) |

## How the Benchmark Works

1. **Task suite**: 40 agentic tasks that mirror real agent workloads (retrieval, multi-step tool use, document processing) where untrusted content enters the context.
2. **Scenario taxonomy**: 56 attack scenarios organized into 5 threat categories, covering where the injection is placed and what it tries to achieve (data exfiltration, tool misuse, state corruption, etc.).
3. **Trajectory-level measurement**: rather than a single pass/fail, the benchmark runs the full agent trajectory and measures whether the injected objective was achieved — 41,824 adversarial trajectories in total.
4. **Hardening comparison**: each scenario is run against both raw and prompt-hardened configurations, isolating the effect of system-prompt defenses.

## Results

- Mean ASR across the 19 LLMs: **19.6%** — indirect injection succeeds on roughly one in five adversarial runs even in default configurations.
- Prompt hardening cuts ASR from **58.2% → 14.3%** — substantial but far from elimination; the residual 14.3% is the floor a system-prompt-only defense leaves open.
- The per-LLM spread in the full results table (paper, Table 1) is the lookup reference for which models are most susceptible to each threat category.

## Relevance to Our Domain

INFUSE is the citable baseline for "how exposed is our agent to injected instructions in external content?" The 19.6% mean ASR and the 14.3% post-hardening floor are the numbers to use when arguing that **system-prompt hardening is necessary but not sufficient** for IPI defense — input provenance labeling, tool-surface restrictions, and output filtering remain the load-bearing controls. The 5-category threat taxonomy is also reusable as a checklist when reviewing agent attack-surface design (see the [agent security](.) notes).

## References

- Paper: https://arxiv.org/abs/2610.20776
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.20776 (citationCount: 0)
- Related work: adaptive attacks against IPI defenses (arXiv:2503.00061); HashJack URL-based IPI (Cato Networks); Writer.com data exfiltration case study (PromptArmor)
