---
title: 'HookEvo: A Framework for Coordinated Plugin Evolution on Hook-Enabled Agent
  Runtimes'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.27294
date: 2026-11-23
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# HookEvo: A Framework for Coordinated Plugin Evolution on Hook-Enabled Agent Runtimes

> Zookeeper correction (2026-11-23): initial auto-summary invented an OpenAI Agent SDK / mock-runtime gate and SWE-bench + GAIA evaluation; the paper actually instantiates HookEvo on DeepSeek Harness with a frozen Qwen3-4B, evaluated on ALFWorld (95.41%). Corrected against the verified abstract.


**Authors:** Shengze Huang, Yanyu Mao, Xiaofei Yu, Baoshen Guo, Xiaorui Wang, Zhiwen Wu, Sheng Wu, Fukang Wen, Chengxu Wu, Linhao Li, Kailai Sun, Baotong Mi


## Overview
HookEvo is a framework that uses an existing agent runtime's **lifecycle hooks** to evolve task-specific *harnesses* — the code around a frozen model that interprets tool receipts, assembles context, and checks actions. Repairs in tool-using agents often require coordinated changes across all three, so HookEvo evolves them jointly instead of one component at a time. The authors instantiate it on **DeepSeek Harness**.

## Problem Statement
Repairing failures in tool-using agents can require coordinated changes to how the harness interprets tool receipts, assembles context, and checks actions. Optimizing a single component (a prompt, a tool library) ignores inter-component coupling, so naive single-part edits can leave systemic failures unfixed.

## Key Contribution
- Harness evolution driven through the runtime's **lifecycle hooks**, on an existing harness (DeepSeek Harness) rather than a bespoke one.
- **Round-based improver loop**: in each round a separate improver diagnoses failures from execution traces and proposes a candidate harness; the candidate is evaluated *against the current harness on matched tasks*, and the retained version carries into the next round.
- **Coordinated executable edits**: a single candidate can jointly edit executable plugin handlers and the state they share within a task — e.g. letting a tool receipt inform context assembly and control a later action.

## Technical Approach
Per round: improver reads execution traces → proposes one candidate harness → A/B evaluation against the incumbent on matched tasks → winner advances. The improver and edit scope are variables, not constants: the study sweeps **three improvers × three edit scopes** (skill text → single-component → coordinated executable edits).

## Results
With a **frozen Qwen3-4B executor**, the selected harnesses lead the reported Qwen3-4B comparisons: **95.41% ALFWorld, 70.56% DBBench, 48.17% WebShop, 41.67% OSBench**. Across the three improvers, **GPT-6.1 Sol** shows the largest average gain when given the **broadest (coordinated executable) edit scope**.

## Relevance to Our Domain
Directly informs our agent-infrastructure roadmap: treating the harness (not just prompts/skills) as the unit of evolution, with improver-vs-incumbent A/B on matched tasks as the promotion gate, mirrors how we could version Hermes skills and cron-agent harnesses. The scope sweep result argues for allowing coordinated multi-component edits rather than single-file skill patches.

## References
- Paper: https://arxiv.org/abs/2611.27294 (cs.AI, cs.SE; submitted 2026-11-20)
- Project/code: https://huangshengzebluesky.github.io/hookevo/
- Related: explanation-evox-agent-harness-runtime-policy.md, explanation-anatomy-of-an-agent-harness.md
