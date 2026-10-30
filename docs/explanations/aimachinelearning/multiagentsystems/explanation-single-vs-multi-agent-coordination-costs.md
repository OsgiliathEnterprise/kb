---
title: 'Single-Agent vs Multi-Agent: 11 Agents, 50%, and Zero Lines of Code — Coordination
  Cost Explained'
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: DEV.to Tech News
source_url: https://dev.to/ohugonnot/single-agent-vs-multi-agent-11-ai-agents-50-and-zero-lines-of-code-5b1d
date: 2026-10-30
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# Single-Agent vs Multi-Agent: 11 Agents, 50%, and Zero Lines of Code

Jeremy McEntire's 2026 course *Beyond Code* ran the same coding task — a booking-platform backend, seven microservices — through four configurations with the **same model**, scored against a rubric of seven criteria (endpoints, data model, API-contract consistency, error handling). The results are a compact demonstration of why "more agents" is not automatically "more capability":

| Configuration | Score | What happened |
| --- | --- | --- |
| **Single agent** | **28/28** | Wrote it all, tested it, iterated |
| **Hierarchy** (coordinator + specialists) | 18/28 | The coordinator ended up doing most of the coding itself |
| **Swarm** (8 agents, shared files + task board) | 9/28 | Five of seven services, 152 files, service boundaries that don't line up (half snake_case, half camelCase) |
| **Pipeline** (11 agents in a chain, $50 budget) | **0/28** | The $50 burned through five planning stages before a single line of code was written |

A fifth configuration (typed contracts up front, tests instead of review) avoided the subjective rejections but spent the budget on **607 lines of JSON contracts for a four-function module**.

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "t1", "type": "text", "x": 40, "y": 20, "width": 600, "height": 24, "text": {"content": "Why swarms degrade: pairwise coordination channels", "fontSize": 15, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}, {"id": "r1", "type": "rectangle", "x": 40, "y": 60, "width": 150, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "1 agent\n0 channels", "fontSize": 13, "fontFamily": 1}}, {"id": "r2", "type": "rectangle", "x": 220, "y": 60, "width": 150, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#ffec99", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "5 agents\n10 channels", "fontSize": 13, "fontFamily": 1}}, {"id": "r3", "type": "rectangle", "x": 400, "y": 60, "width": 150, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "8 agents\n28 channels", "fontSize": 13, "fontFamily": 1}}, {"id": "r4", "type": "rectangle", "x": 580, "y": 60, "width": 150, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "10 agents\n45 channels", "fontSize": 13, "fontFamily": 1}}, {"id": "a1", "type": "arrow", "x": 190, "y": 95, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a2", "type": "arrow", "x": 370, "y": 95, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a3", "type": "arrow", "x": 550, "y": 95, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "n1", "type": "text", "x": 40, "y": 170, "width": 700, "height": 80, "text": {"content": "n(n-1)/2 agreement channels grow SUPERLINEARLY: each agent must align its output\nwith every other agent's output. A swarm's score dropped to 9/28 with 152 files\nwhose service boundaries didn't line up. Pipeline: each handoff passes only a\nSUMMARY; what's lost never comes back.", "fontSize": 12, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```

## Reading the mechanism, not just the scoreboard

The post is honest about its limits (no model name, no run count, the rubric is a proxy, the "researcher" is anonymous), and the author himself warns it's illustrative of the *mechanism*, not a measurement of any specific model. The parts that hold up are the **computable mechanisms** behind the numbers:

1. **Coordination cost grows superlinearly.** For agents that must agree with each other, the channel count is n(n-1)/2: 5 agents → 10 channels, 8 → 28, 10 → 45. Each agent has to align its output with everyone else's — and in the swarm run, the output was 152 files with boundaries that didn't line up (half snake_case, half camelCase). The hierarchy "fixed" this the only way a coordinator can: by doing the work itself.
2. **Pipelines lose information at every handoff.** Each stage passes a *summary* of its work, and what's dropped never comes back. In a separate run with a similar architecture, the review stage rejected 7 of 8 items — and **4 of the rejections had no real problem behind them** (15–23 lines of subjective objection each). The reviewer only saw the summary, not the code.
3. **Budgets interact with architecture.** The 11-agent pipeline spent its $50 on five planning stages and shipped nothing. The contracts-first variant spent its budget on 607 lines of JSON for a four-function module. The same dollars buy different failure modes under different architectures.

## The counterexample (kept honest)

The same author's own course had **26 agents working on their code find real exploitable security vulnerabilities**. Multi-agent doesn't fail — it *measures different things*. The honest takeaway: **single vs. multi is both true**, and the choice depends on which capability you're actually buying (breadth of coverage vs. depth of a single context) and what the coordination tax is for your task shape.

## What the research says (quantifying the mechanism)

The mechanism this note illustrates — coordination cost growing faster than capability as agents are added — has since been formalized. Kim et al., *"Towards a Science of Scaling Agent Systems"* (arXiv:2512.08296), distilled orchestration into three empirically-derived effects across 180 configurations:

1. **Tool-Coordination Trade-off.** Under a fixed budget, tool-heavy tasks suffer most from multi-agent overhead, because coordination tokens compete directly with the reasoning tokens the task needs.
2. **Capability Saturation.** Multi-agent coordination yields diminishing or even *negative* returns when the single-agent baseline is weak — scaling a weak baseline propagates its hallucinations rather than fixing them.
3. **Topology-Dependent Error Amplification.** How fast errors cascade depends on the architecture: independent (no-communication) agents amplify errors far more than centralized (supervisor) topologies, which contain them by cross-checking reports at the hub.

Practical engineering read (from [Sparrow Intelligence's production-oriented analysis](https://blog.sparrow.so/scaling-llm-agents-beyond-demos-coordination-costs-topologies-and-what-actually-works/)): topology matters more than agent count; when coordination tokens exceed roughly 45% of the budget, quality drops; and the best default for real systems is a hybrid/hierarchical setup with strict communication limits. For a structured evaluation of collaboration vs. competition, see [MultiAgentBench (arXiv:2503.01935)](https://arxiv.org/abs/2503.01935).

## Caveats to carry when you cite this

- The rubric is a **proxy** — the post is explicit it doesn't measure "code quality" in any absolute sense.
- No model name, no run count: results are **illustrative of the mechanism**, not a benchmark.
- "Hierarchy = 18" reflects one run where the coordinator collapsed into doing the work — a well-tuned coordinator with explicit delegation constraints may differ; the mechanism (coordination tax) is what's being illustrated.

## Practical implications

| Task shape | What the evidence suggests |
| --- | --- |
| Coherent single-context task (a module, a service) | Single agent wins — 28/28; the extra context cost of multi-agent is pure overhead here |
| Task requiring many independent perspectives (security audit, wide surface) | Multi-agent can add value — the 26-agent vuln-hunting run found real exploits |
| Swarm with shared mutable state | Expect boundary drift (naming, schemas) unless a **typed contract** is the first artifact |
| Long pipeline with summary handoffs | Budget for information loss at every hop; keep raw artifacts, not just summaries, available to later stages |
| Any multi-agent run | Set an explicit **step cap and budget** per agent — the hierarchy's failure was bounded by exactly this constraint |

## Related notes

- [How to Require a Job Receipt for Remote Model Proposals](../../../how-to/developertoolspractices/aicodingagents/howto-require-a-job-receipt-for-remote-model-proposals.md) — schema-validated proposals as one way to make handoff artifacts checkable
- [How to Maintain Maintainability Sensors for Coding Agents](../../../how-to/developertoolspractices/aicodingagents/howto-maintainability-sensors-for-coding-agents.md)

## References

- [Single-Agent vs Multi-Agent: 11 AI Agents, 50%, and Zero Lines of Code (DEV.to)](https://dev.to/ohugonnot/single-agent-vs-multi-agent-11-ai-agents-50-and-zero-lines-of-code-5b1d)
- [Towards a Science of Scaling Agent Systems (Kim et al., arXiv:2512.08296)](https://arxiv.org/abs/2512.08296) — quantitative scaling laws for agent systems: tool-coordination trade-off, capability saturation, topology-dependent error amplification.
- [MultiAgentBench (arXiv:2503.01935)](https://arxiv.org/abs/2503.01935) — benchmark for evaluating collaboration and competition of LLM agents.
- [How to Scale LLM Agents: Coordination Costs, Topologies, and Real-World Limits (Sparrow Intelligence)](https://blog.sparrow.so/scaling-llm-agents-beyond-demos-coordination-costs-topologies-and-what-actually-works/) — production-oriented interpretation of the scaling-laws paper (topology heuristics, the ~45% coordination-token rule of thumb).
